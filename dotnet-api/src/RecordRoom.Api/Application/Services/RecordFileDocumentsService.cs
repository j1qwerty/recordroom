using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Data;
using RecordRoom.Api.Infrastructure.Realtime;

namespace RecordRoom.Api.Application.Services;

public interface IRecordFileDocumentsService
{
    Task<RecordFileDocumentDto[]?> ListAsync(int fileId, CancellationToken ct = default);
    Task<Result<RecordFileDocumentDto>> UploadAsync(int fileId, IFormFile? document, CancellationToken ct = default);
    Task<PrivateDocumentContent?> OpenAsync(int fileId, long documentId, CancellationToken ct = default);
}

/// <summary>File-level attachments, versioned independently from page-by-page digitization.</summary>
public sealed class RecordFileDocumentsService(
    AppDbContext db, IPrivateDocumentStore documentStore, IAuditWriter audit,
    ICurrentUserAccessor current, ILogger<RecordFileDocumentsService> logger) : IRecordFileDocumentsService
{
    private static RecordFileDocumentDto ToDto(RecordFileDocument d, string barcode) =>
        new(d.Id, d.RecordFileId, barcode, d.Version, d.OriginalFileName, d.ContentType, d.SizeBytes, d.Sha256, d.UploadedAt, d.UploadedBy, d.PageCount);

    public async Task<RecordFileDocumentDto[]?> ListAsync(int fileId, CancellationToken ct = default)
    {
        var file = await db.Files.AsNoTracking().Where(f => f.Id == fileId)
            .Select(f => new { f.Id, f.Barcode }).FirstOrDefaultAsync(ct);
        if (file is null) return null;
        var rows = await db.FileDocuments.AsNoTracking().Where(d => d.RecordFileId == fileId)
            .OrderByDescending(d => d.Version).ToListAsync(ct);
        return rows.Select(d => ToDto(d, file.Barcode)).ToArray();
    }

    public async Task<Result<RecordFileDocumentDto>> UploadAsync(int fileId, IFormFile? document, CancellationToken ct = default)
    {
        var file = await db.Files.AsNoTracking().FirstOrDefaultAsync(f => f.Id == fileId, ct);
        if (file is null) return Result<RecordFileDocumentDto>.Fail("Record not found.", "fileId");
        var storedResult = await documentStore.SaveAsync(document, ct);
        if (!storedResult.IsSuccess) return Result<RecordFileDocumentDto>.Fail(storedResult.Errors);
        var stored = storedResult.Value;
        var version = (await db.FileDocuments.AsNoTracking().Where(d => d.RecordFileId == fileId)
            .Select(d => (int?)d.Version).MaxAsync(ct) ?? 0) + 1;
        var row = new RecordFileDocument
        {
            RecordFileId = fileId, Version = version, OriginalFileName = stored.OriginalFileName,
            StorageKey = stored.StorageKey, ContentType = stored.ContentType, SizeBytes = stored.SizeBytes,
            Sha256 = stored.Sha256, UploadedAt = DateTime.UtcNow, UploadedBy = current.UserName,
            PageCount = stored.PageCount
        };
        db.FileDocuments.Add(row);
        await audit.LogAsync(db, AuditAction.Create, "RecordFileDocument", "pending", "-",
            $"{stored.OriginalFileName} v{version}; bytes={stored.SizeBytes}; sha256={stored.Sha256}",
            $"Uploaded attachment {stored.OriginalFileName} v{version} for {file.Barcode}", ct);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "Could not register file attachment v{Version} for record {FileId}.", version, fileId);
            await TryDeleteAsync(stored.StorageKey);
            return Result<RecordFileDocumentDto>.Fail("This record was updated by another upload. Please retry.", "document");
        }
        catch { await TryDeleteAsync(stored.StorageKey); throw; }
        await audit.AnnounceAsync(RealtimeChannels.Files, "file.document.uploaded", fileId.ToString(),
            $"{stored.OriginalFileName} uploaded as version {version}");
        return Result<RecordFileDocumentDto>.Ok(ToDto(row, file.Barcode));
    }

    public async Task<PrivateDocumentContent?> OpenAsync(int fileId, long documentId, CancellationToken ct = default)
    {
        var row = await db.FileDocuments.AsNoTracking().Include(d => d.RecordFile)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.RecordFileId == fileId, ct);
        if (row?.RecordFile is null) return null;
        var stream = await documentStore.OpenReadAsync(row.StorageKey, ct);
        return stream is null ? null : new PrivateDocumentContent(row.OriginalFileName, row.ContentType, row.SizeBytes, row.Sha256, stream);
    }

    private async Task TryDeleteAsync(string key)
    {
        try { await documentStore.DeleteAsync(key, CancellationToken.None); }
        catch (Exception ex) { logger.LogError(ex, "Could not clean up document key {StorageKey}.", key); }
    }
}
