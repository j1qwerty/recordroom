using System.Text;
using RecordRoom.Api.Application.Services;

namespace RecordRoom.Api.Tests;

public sealed class PdfPageCounterTests
{
    [Fact]
    public async Task ReadsTheCountFromThePageTree()
    {
        var pdf = Build("""
            %PDF-1.7
            1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
            2 0 obj << /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >> endobj
            3 0 obj << /Type /Page /Parent 2 0 R >> endobj
            4 0 obj << /Type /Page /Parent 2 0 R >> endobj
            %%EOF
            """);

        Assert.Equal(2, await PdfPageCounter.TryCountAsync(ToStream(pdf)));
    }

    [Fact]
    public async Task FallsBackToCountingLeafPageObjects()
    {
        // No usable /Count on the tree node, so the leaf objects are counted instead.
        var pdf = Build("""
            %PDF-1.7
            1 0 obj << /Type /Catalog >> endobj
            2 0 obj << /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] >> endobj
            3 0 obj << /Type /Page >> endobj
            4 0 obj << /Type /Page >> endobj
            5 0 obj << /Type /Page >> endobj
            %%EOF
            """);

        Assert.Equal(3, await PdfPageCounter.TryCountAsync(ToStream(pdf)));
    }

    [Fact]
    public async Task DoesNotCountThePagesTreeNodeAsALeaf()
    {
        // "/Type /Pages" ends in "s"; a naive substring match would inflate the count.
        var pdf = Build("""
            %PDF-1.7
            1 0 obj << /Type /Pages /Kids [2 0 R] >> endobj
            2 0 obj << /Type /Page >> endobj
            %%EOF
            """);

        Assert.Equal(1, await PdfPageCounter.TryCountAsync(ToStream(pdf)));
    }

    [Fact]
    public async Task IgnoresCountValuesThatBelongToAnotherDictionary()
    {
        // The outline "/Count" is not the page total; the page tree value must win.
        var pdf = Build("""
            %PDF-1.7
            1 0 obj << /Type /Outlines /Count 9 >> endobj
            2 0 obj << /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >> endobj
            3 0 obj << /Type /Page >> endobj
            4 0 obj << /Type /Page >> endobj
            %%EOF
            """);

        Assert.Equal(2, await PdfPageCounter.TryCountAsync(ToStream(pdf)));
    }

    [Fact]
    public async Task ReturnsNullForNonPdfInput()
    {
        Assert.Null(await PdfPageCounter.TryCountAsync(ToStream("not a pdf at all")));
        Assert.Null(await PdfPageCounter.TryCountAsync(ToStream("%PDF-1.7 truncated")));
        Assert.Null(await PdfPageCounter.TryCountAsync(ToStream(string.Empty)));
    }

    [Fact]
    public async Task CountsSingleAndManyPageScans()
    {
        Assert.Equal(1, await PdfPageCounter.TryCountAsync(ToStream(
            "%PDF-1.4\n1 0 obj << /Type /Pages /Kids [2 0 R] /Count 1 >> endobj\n%%EOF")));

        var many = string.Join("\n", Enumerable.Range(0, 120).Select(i => $"{i} 0 obj << /Type /Page >> endobj"));
        var pdf = Build($"%PDF-1.7\n1 0 obj << /Type /Pages >> endobj\n{many}\n%%EOF");
        Assert.Equal(120, await PdfPageCounter.TryCountAsync(ToStream(pdf)));
    }

    private static string Build(string body) => body.ReplaceLineEndings("\n");

    private static Stream ToStream(string text) =>
        new MemoryStream(Encoding.Latin1.GetBytes(text));
}