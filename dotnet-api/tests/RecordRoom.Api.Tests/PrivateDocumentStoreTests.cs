using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using RecordRoom.Api.Application.Services;

namespace RecordRoom.Api.Tests;

public sealed class PrivateDocumentStoreTests
{
    [Fact]
    public async Task SavesHashesReadsAndDeletesUploadedPdfBytes()
    {
        var root = Path.Combine(Path.GetTempPath(), "recordroom-doc-tests", Guid.NewGuid().ToString("N"));
        var store = CreateStore(root);
        var bytes = Encoding.ASCII.GetBytes("%PDF-1.7\nRecordRoom test scan\n%%EOF");
        await using var input = new MemoryStream(bytes);
        var file = CreateFormFile(input, "scan.pdf");

        try
        {
            var result = await store.SaveAsync(file);

            Assert.True(result.IsSuccess);
            var saved = result.Value;
            Assert.Equal(bytes.LongLength, saved.SizeBytes);
            Assert.Equal("application/pdf", saved.ContentType);
            Assert.Equal(Convert.ToHexString(SHA256.HashData(bytes)), saved.Sha256);

            // Windows keeps a delete pending while a read handle is open, so close it first.
            var opened = await store.OpenReadAsync(saved.StorageKey);
            Assert.NotNull(opened);
            using (opened!)
            {
                using var copy = new MemoryStream();
                await opened.CopyToAsync(copy);
                Assert.Equal(bytes, copy.ToArray());
            }

            await store.DeleteAsync(saved.StorageKey);
            Assert.Null(await store.OpenReadAsync(saved.StorageKey));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void DefaultCeilingStaysUnderTheReverseProxyLimit()
    {
        // nginx allows 50M on the deploy. If the API ceiling ever rises above
        // that, oversized files die at the proxy with a bare 413 instead of
        // reaching the friendly validation message here.
        Assert.True(PrivateDocumentStore.DefaultMaxUploadBytes < 50L * 1024 * 1024);
    }

    [Fact]
    public async Task RejectsAnImageExtensionWhoseContentIsNotAnImage()
    {
        var root = Path.Combine(Path.GetTempPath(), "recordroom-doc-tests", Guid.NewGuid().ToString("N"));
        var store = CreateStore(root);
        var bytes = Encoding.ASCII.GetBytes("%PDF-1.7\nnot a png");
        await using var input = new MemoryStream(bytes);
        var file = CreateFormFile(input, "scan.png");

        try
        {
            var result = await store.SaveAsync(file);
            Assert.False(result.IsSuccess);
            Assert.Contains(result.Errors, error => error.Message.Contains("does not match", StringComparison.OrdinalIgnoreCase));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }

    private static PrivateDocumentStore CreateStore(string root)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FileStorage:RootPath"] = root,
                ["FileStorage:MaxUploadBytes"] = "1048576",
            })
            .Build();
        return new PrivateDocumentStore(configuration, new TestHostEnvironment());
    }

    private static FormFile CreateFormFile(Stream stream, string filename) => new(
        stream, 0, stream.Length, "document", filename)
    {
        Headers = new HeaderDictionary(),
        ContentType = filename.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)
            ? "application/pdf"
            : "image/png",
    };

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Testing";
        public string ApplicationName { get; set; } = "RecordRoom.Api.Tests";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
