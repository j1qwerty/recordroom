using System.Buffers;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using RecordRoom.Api.Application;

namespace RecordRoom.Api.Application.Services;

public sealed record StoredDocument(string StorageKey, string OriginalFileName, string ContentType, long SizeBytes, string Sha256);
public sealed record PrivateDocumentContent(string FileName, string ContentType, long SizeBytes, string Sha256, Stream Stream);

public interface IPrivateDocumentStore
{
    long MaxUploadBytes { get; }
    Task<Result<StoredDocument>> SaveAsync(IFormFile? upload, CancellationToken ct = default);
    Task<Stream?> OpenReadAsync(string storageKey, CancellationToken ct = default);
    Task DeleteAsync(string storageKey, CancellationToken ct = default);
}

/// <summary>Private filesystem storage; generated keys mean uploaded names are never filesystem paths.</summary>
public sealed class PrivateDocumentStore : IPrivateDocumentStore
{
    public const long DefaultMaxUploadBytes = 512L * 1024 * 1024;
    private readonly string _rootPath;
    public long MaxUploadBytes { get; }

    public PrivateDocumentStore(IConfiguration configuration, IHostEnvironment environment)
    {
        var configuredRoot = configuration["FileStorage:RootPath"];
        _rootPath = string.IsNullOrWhiteSpace(configuredRoot)
            ? Path.Combine(environment.ContentRootPath, "App_Data", "documents")
            : Path.IsPathRooted(configuredRoot)
                ? Path.GetFullPath(configuredRoot)
                : Path.GetFullPath(Path.Combine(environment.ContentRootPath, configuredRoot));
        var configuredMax = configuration.GetValue<long?>("FileStorage:MaxUploadBytes") ?? DefaultMaxUploadBytes;
        MaxUploadBytes = Math.Clamp(configuredMax, 1L, DefaultMaxUploadBytes);
    }

    public async Task<Result<StoredDocument>> SaveAsync(IFormFile? upload, CancellationToken ct = default)
    {
        if (upload is null || upload.Length <= 0)
            return Result<StoredDocument>.Fail("Choose a non-empty PDF or image file.", "document");
        if (upload.Length > MaxUploadBytes)
            return Result<StoredDocument>.Fail($"Documents must be {MaxUploadBytes / (1024 * 1024)} MiB or smaller.", "document");

        var extension = Path.GetExtension(Path.GetFileName(upload.FileName)).ToLowerInvariant();
        var type = extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            _ => ""
        };
        if (type.Length == 0)
            return Result<StoredDocument>.Fail("Only PDF, JPG, JPEG, PNG and GIF documents are supported.", "document");
        if (!await HasValidSignatureAsync(upload, type, ct))
            return Result<StoredDocument>.Fail("The file content does not match a supported PDF or image format.", "document");

        var name = SafeFileName(upload.FileName, extension);
        var key = Guid.NewGuid().ToString("N") + extension;
        var path = GetPath(key);
        Directory.CreateDirectory(_rootPath);
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        var buffer = ArrayPool<byte>.Shared.Rent(81920);
        long size = 0;
        try
        {
            await using var input = upload.OpenReadStream();
            await using var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920,
                FileOptions.Asynchronous | FileOptions.SequentialScan);
            while (true)
            {
                var read = await input.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);
                if (read == 0) break;
                size += read;
                if (size > MaxUploadBytes) throw new DocumentTooLargeException();
                hash.AppendData(buffer.AsSpan(0, read));
                await output.WriteAsync(buffer.AsMemory(0, read), ct);
            }
            await output.FlushAsync(ct);
            return Result<StoredDocument>.Ok(new StoredDocument(key, name, type, size, Convert.ToHexString(hash.GetHashAndReset())));
        }
        catch (DocumentTooLargeException)
        {
            TryRemove(path);
            return Result<StoredDocument>.Fail($"Documents must be {MaxUploadBytes / (1024 * 1024)} MiB or smaller.", "document");
        }
        catch
        {
            TryRemove(path);
            throw;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }

    public Task<Stream?> OpenReadAsync(string storageKey, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        var path = GetPath(storageKey);
        Stream? stream = File.Exists(path)
            ? new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920,
                FileOptions.Asynchronous | FileOptions.SequentialScan)
            : null;
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storageKey, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        File.Delete(GetPath(storageKey));
        return Task.CompletedTask;
    }

    private string GetPath(string key)
    {
        var ext = Path.GetExtension(key);
        var id = Path.GetFileNameWithoutExtension(key);
        if (ext is not (".pdf" or ".jpg" or ".jpeg" or ".png" or ".gif") || !Guid.TryParseExact(id, "N", out _))
            throw new ArgumentException("Invalid private document storage key.", nameof(key));
        return Path.Combine(_rootPath, key);
    }

    private static string SafeFileName(string? supplied, string extension)
    {
        var name = Path.GetFileName(supplied ?? "");
        name = new string(name.Where(ch => !char.IsControl(ch) && ch is not '\\' and not '/').ToArray()).Trim();
        if (string.IsNullOrWhiteSpace(name)) name = "scan" + extension;
        return name.Length <= 255 ? name : name[..(255 - extension.Length)] + extension;
    }

    private static async Task<bool> HasValidSignatureAsync(IFormFile upload, string type, CancellationToken ct)
    {
        await using var stream = upload.OpenReadStream();
        var prefix = new byte[8];
        var count = await stream.ReadAsync(prefix.AsMemory(), ct);
        return type switch
        {
            "application/pdf" => count >= 5 && prefix.AsSpan(0, 5).SequenceEqual("%PDF-"u8),
            "image/jpeg" => count >= 3 && prefix[0] == 0xFF && prefix[1] == 0xD8 && prefix[2] == 0xFF,
            "image/png" => count >= 8 && prefix.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/gif" => count >= 6 && (prefix.AsSpan(0, 6).SequenceEqual("GIF87a"u8) || prefix.AsSpan(0, 6).SequenceEqual("GIF89a"u8)),
            _ => false
        };
    }

    private static void TryRemove(string path)
    {
        try { File.Delete(path); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    private sealed class DocumentTooLargeException : Exception { }
}
