using System.Text;

namespace RecordRoom.Api.Application.Services;

/// <summary>
/// Best-effort PDF page counting.
/// <para>
/// RecordRoom accepts PDFs whose page count matters: a single upload often covers
/// a whole A0-sized sheet folded down, or a multi-page scan, and the digitization
/// page model is keyed by barcode + page number. Splitting the bytes into separate
/// files would lose the original, so instead the page count is recorded and each
/// logical page row points back at the one stored document.
/// </para>
/// <para>
/// This reader deliberately avoids a PDF library. It scans the uncompressed
/// object structure, which is enough for ordinary scans produced by scanners and
/// print-to-PDF. Encrypted PDFs and PDFs whose page tree lives inside a compressed
/// object stream (<c>/ObjStm</c>) cannot be counted this way, so the result is a
/// nullable hint and callers must treat <c>null</c> as "unknown", never as 1.
/// </para>
/// </summary>
public static class PdfPageCounter
{
    /// <summary>Upper bound for the scan; a scan page tree larger than this is not parsed.</summary>
    private const int MaxScanBytes = 32 * 1024 * 1024;

    /// <summary>
    /// Returns the page count when it can be established from the raw bytes,
    /// otherwise <c>null</c>. Never throws for malformed input.
    /// </summary>
    public static async Task<int?> TryCountAsync(Stream content, CancellationToken ct = default)
    {
        var buffer = new byte[MaxScanBytes];
        var read = await ReadAtMostAsync(content, buffer, ct);
        if (read <= 0) return null;

        var latin1 = Encoding.Latin1.GetString(buffer, 0, read);
        if (!latin1.StartsWith("%PDF-", StringComparison.Ordinal)) return null;

        // The page tree root carries "/Type /Pages" and a "/Count" child. That is the
        // authoritative total, and it survives linearisation and incremental updates
        // better than counting leaf objects.
        var declared = TryReadCountFromPageTree(latin1);
        if (declared is > 0) return declared;

        // Fall back to counting leaf page objects. "/Type /Pages" is the tree node and
        // must not be counted, so a trailing "s" disqualifies the match.
        var leaves = 0;
        var index = 0;
        while (true)
        {
            var found = latin1.IndexOf("/Type", index, StringComparison.Ordinal);
            if (found < 0) break;
            var cursor = found + "/Type".Length;
            SkipWhitespaceAndSlashes(latin1, ref cursor);
            if (MatchesWord(latin1, cursor, "Pages"))
            {
                index = cursor + "Pages".Length;
                continue;
            }
            if (MatchesWord(latin1, cursor, "Page"))
            {
                leaves++;
                index = cursor + "Page".Length;
                continue;
            }
            index = cursor;
        }

        return leaves > 0 ? leaves : null;
    }

    /// <summary>
    /// Reads "/Count" that belongs to a "/Type /Pages" node rather than an outline
    /// or named-destination count, which would give the wrong number.
    /// </summary>
    private static int? TryReadCountFromPageTree(string latin1)
    {
        var total = 0;
        var index = 0;
        while (true)
        {
            var found = latin1.IndexOf("/Type", index, StringComparison.Ordinal);
            if (found < 0) break;
            var cursor = found + "/Type".Length;
            SkipWhitespaceAndSlashes(latin1, ref cursor);
            if (!MatchesWord(latin1, cursor, "Pages"))
            {
                index = cursor;
                continue;
            }

            // Scan this node's dictionary for its own "/Count".
            var nodeEnd = latin1.IndexOf(">>", cursor, StringComparison.Ordinal);
            var limit = nodeEnd < 0 ? latin1.Length : nodeEnd;
            var count = ReadIntAfter(latin1, cursor, limit, "/Count");
            if (count is > 0) total += count.Value;
            index = cursor + "Pages".Length;
        }

        return total > 0 ? total : null;
    }

    private static int? ReadIntAfter(string text, int from, int limit, string key)
    {
        var at = text.IndexOf(key, from, StringComparison.Ordinal);
        if (at < 0 || at >= limit) return null;
        var cursor = at + key.Length;
        SkipWhitespace(text, ref cursor);
        while (cursor < limit && text[cursor] == '+') cursor++;
        if (cursor < limit && text[cursor] == '-') return null;
        SkipWhitespace(text, ref cursor);
        var start = cursor;
        while (cursor < limit && char.IsAsciiDigit(text[cursor])) cursor++;
        if (cursor == start) return null;
        return int.TryParse(text.AsSpan(start, cursor - start), out var value) ? value : null;
    }

    private static void SkipWhitespaceAndSlashes(string text, ref int cursor)
    {
        while (cursor < text.Length)
        {
            var ch = text[cursor];
            if (char.IsWhiteSpace(ch) || ch == '/') cursor++;
            else break;
        }
    }

    private static void SkipWhitespace(string text, ref int cursor)
    {
        while (cursor < text.Length && char.IsWhiteSpace(text[cursor])) cursor++;
    }

    /// <summary>Case-sensitive PDF name comparison; PDF keywords are not case folded.</summary>
    private static bool MatchesWord(string text, int at, string word)
    {
        if (at + word.Length > text.Length) return false;
        if (string.CompareOrdinal(text, at, word, 0, word.Length) != 0) return false;
        var next = at + word.Length;
        return next >= text.Length || !char.IsLetterOrDigit(text[next]) && text[next] != '-';
    }

    private static async Task<int> ReadAtMostAsync(Stream content, byte[] buffer, CancellationToken ct)
    {
        var total = 0;
        while (total < buffer.Length)
        {
            var read = await content.ReadAsync(buffer.AsMemory(total, buffer.Length - total), ct);
            if (read <= 0) break;
            total += read;
        }

        return total;
    }
}