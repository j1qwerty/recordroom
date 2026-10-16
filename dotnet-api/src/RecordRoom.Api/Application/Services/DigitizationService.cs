using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Application.Services;

public interface IDigitizationService
{
    Task<DigitizationBatchDto[]> BatchesAsync(string? employeeCode, string? folder, string? status, string? search, CancellationToken ct = default);
    Task<DigitizationBatchDto?> BatchAsync(long id, CancellationToken ct = default);
    Task<Result<DigitizationBatchDto>> CreateBatchAsync(BatchCreateInput input, CancellationToken ct = default);
    Task<Result<DigitizationPageDto>> UploadPageDocumentAsync(long pageId, Microsoft.AspNetCore.Http.IFormFile? document, CancellationToken ct = default);
    Task<PrivateDocumentContent?> OpenPageDocumentAsync(long pageId, CancellationToken ct = default);
    Task<Result<DigitizationPageDto>> UploadPageAsync(long batchId, PageUploadInput input, CancellationToken ct = default);
    Task<Result<bool>> RemovePageAsync(long pageId, CancellationToken ct = default);
    Task<Result<DigitizationPageDto>> ReviewPageAsync(long pageId, PageReviewInput input, CancellationToken ct = default);
    Task<Result<DigitizationBatchDto>> ReviewBatchAsync(long batchId, PageReviewInput input, CancellationToken ct = default);
    Task<int> PendingReviewCountAsync(CancellationToken ct = default);
}

public sealed class DigitizationService(
    AppDbContext db,
    IAuditWriter audit,
    ICurrentUserAccessor current,
    IPrivateDocumentStore documentStore,
    ILogger<DigitizationService> logger) : IDigitizationService
{
    private static DigitizationPageDto ToPage(DigitizationPage p) => new(
        p.Id, p.BatchId, p.Barcode, p.FileName, p.PageNo, p.Version,
        Display.Page(p.Status), p.Note, p.UploadedAt, p.UploadedBy, p.Bulk,
        !string.IsNullOrWhiteSpace(p.StorageKey), p.ContentType, p.SizeBytes, p.Sha256);

    private static DigitizationBatchDto ToBatch(DigitizationBatch b) => new(
        b.Id, b.Code, b.EmployeeCode, b.EmployeeName, b.Department,
        Display.Folder(b.Folder), Display.Batch(b.Status),
        b.Pages.Select(ToPage).ToArray(),
        b.CreatedAt, b.CreatedBy, b.SubmittedAt,
        FolderPath(b));

    /// <summary>Legacy per-employee folder layout.</summary>
    private static string FolderPath(DigitizationBatch b)
    {
        return $"uploads/{b.EmployeeCode}/{Display.Folder(b.Folder)}/";
    }

    private static BatchStatus RecomputeStatus(DigitizationBatch batch)
    {
        if (batch.Pages.Count == 0) return BatchStatus.InProgress;
        var reviewable = batch.Pages.Count(p => p.Status is PageStatus.PendingReview or PageStatus.Duplicate);
        if (reviewable > 0) return batch.SubmittedAt is null ? BatchStatus.InProgress : BatchStatus.Submitted;
        var approved = batch.Pages.Count(p => p.Status == PageStatus.Approved);
        if (approved == batch.Pages.Count) return BatchStatus.Approved;
        return approved == 0 ? BatchStatus.InProgress : BatchStatus.PartiallyApproved;
    }

    public async Task<DigitizationBatchDto[]> BatchesAsync(
        string? employeeCode, string? folder, string? status, string? search, CancellationToken ct = default)
    {
        var query = db.Batches.AsNoTracking().Include(b => b.Pages).AsQueryable();

        if (!string.IsNullOrWhiteSpace(employeeCode)) query = query.Where(b => b.EmployeeCode == employeeCode);
        if (!string.IsNullOrWhiteSpace(folder) && folder != "All")
        {
            var parsed = Display.ParseFolder(folder);
            if (parsed is not null)
            {
                var target = parsed.Value;
                query = query.Where(b => b.Folder == target);
            }
        }
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            var parsed = Display.ParseBatch(status);
            if (parsed is not null)
            {
                var target = parsed.Value;
                query = query.Where(b => b.Status == target);
            }
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(b =>
                b.Code.ToLower().Contains(needle)
                || b.EmployeeCode.ToLower().Contains(needle)
                || b.EmployeeName.ToLower().Contains(needle)
                || b.Pages.Any(p => p.Barcode.ToLower().Contains(needle)));
        }

        var rows = await query.OrderByDescending(b => b.CreatedAt).ToListAsync(ct);
        return rows.Select(ToBatch).ToArray();
    }

    public async Task<DigitizationBatchDto?> BatchAsync(long id, CancellationToken ct = default)
    {
        var batch = await db.Batches.AsNoTracking().Include(b => b.Pages)
            .FirstOrDefaultAsync(b => b.Id == id, ct);
        return batch is null ? null : ToBatch(batch);
    }

    public async Task<Result<DigitizationBatchDto>> CreateBatchAsync(BatchCreateInput input, CancellationToken ct)
    {
        var code = input.EmployeeCode?.Trim().ToUpperInvariant() ?? string.Empty;
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == code, ct);
        if (employee is null) return Result<DigitizationBatchDto>.Fail("Select a registered employee.", "employeeCode");
        if (employee.Status != EmployeeStatus.Active)
        {
            return Result<DigitizationBatchDto>.Fail(
                $"{employee.Name} is {employee.Status.ToString().ToLower()} and cannot own new batches.", "employeeCode");
        }

        var folder = Display.ParseFolder(input.Folder) ?? DigitizationFolder.ServiceBook;
        var clash = await db.Batches.FirstOrDefaultAsync(
            b => b.EmployeeCode == code && b.Folder == folder && b.Status != BatchStatus.Approved, ct);
        if (clash is not null)
        {
            return Result<DigitizationBatchDto>.Fail(
                $"{clash.Code} is already {clash.Status.ToString().ToLower()} for this folder.", "folder");
        }

        var serial = await db.Batches.CountAsync(ct) + 39;
        var batch = new DigitizationBatch
        {
            Code = $"BATCH-{serial:D3}",
            EmployeeCode = employee.EmployeeCode,
            EmployeeName = employee.Name,
            Department = employee.Department,
            Folder = folder,
            Status = BatchStatus.InProgress,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = current.UserName,
        };

        db.Batches.Add(batch);
        await audit.LogAsync(db, AuditAction.Create, "DigitizationBatch", batch.Id.ToString(),
            "-", $"{batch.Code} / {code} / {folder}",
            $"{batch.Code} opened for {employee.Name}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Digitization, "batch.created", batch.Id.ToString(),
            $"{batch.Code} opened for {employee.Name}");

        return Result<DigitizationBatchDto>.Ok(ToBatch(batch));
    }

    public async Task<Result<DigitizationPageDto>> UploadPageAsync(long batchId, PageUploadInput input, CancellationToken ct)
    {
        var batch = await db.Batches.Include(b => b.Pages).FirstOrDefaultAsync(b => b.Id == batchId, ct);
        if (batch is null) return Result<DigitizationPageDto>.Fail("Batch not found.", "batchId");
        if (batch.Status == BatchStatus.Approved)
            return Result<DigitizationPageDto>.Fail("Approved batches are read-only.", "batchId");
        if (input.PageNo < 1) return Result<DigitizationPageDto>.Fail("Page number starts at 1.", "pageNo");

        var barcode = input.FileBarcode?.Trim().ToUpperInvariant() ?? string.Empty;
        var file = await db.Files.FirstOrDefaultAsync(f => f.Barcode.ToUpper() == barcode, ct);
        if (file is null) return Result<DigitizationPageDto>.Fail($"{barcode} is not in the registry.", "fileBarcode");

        // Legacy duplicate-page check: the same file and page re-scanned becomes
        // the next version rather than overwriting an approved page.
        var nextVersion = await db.Pages
            .Where(p => p.Barcode == file.Barcode && p.PageNo == input.PageNo)
            .Select(p => (int?)p.Version)
            .MaxAsync(ct) ?? 0;
        nextVersion += 1;

        var hasActive = await db.Pages.AnyAsync(
            p => p.Barcode == file.Barcode && p.PageNo == input.PageNo && p.Status == PageStatus.Active, ct);

        var page = new DigitizationPage
        {
            BatchId = batchId,
            Barcode = file.Barcode,
            FileName = string.IsNullOrWhiteSpace(input.FileName)
                ? $"{file.Barcode}-FILE-{input.PageNo}{(nextVersion > 1 ? $"-V{nextVersion}" : string.Empty)}.pdf"
                : input.FileName.Trim(),
            PageNo = input.PageNo,
            Version = nextVersion,
            Status = nextVersion > 1 && hasActive ? PageStatus.Duplicate : PageStatus.PendingReview,
            Note = input.Bulk
                ? "Imported from a bulk staging folder."
                : nextVersion > 1 ? $"Rescan of an existing page (previous version {nextVersion - 1})." : string.Empty,
            UploadedAt = DateTime.UtcNow,
            UploadedBy = current.UserName,
            Bulk = input.Bulk,
        };

        db.Pages.Add(page);
        batch.Pages.Add(page);
        batch.Status = RecomputeStatus(batch);
        await audit.LogAsync(db, AuditAction.Create, "DigitizationPage", "pending",
            "-", $"{page.FileName} v{page.Version}",
            $"Page {page.PageNo} of {file.Barcode} added to {batch.Code}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Digitization, "page.added", batch.Id.ToString(),
            $"{page.FileName} added to {batch.Code}");

        return Result<DigitizationPageDto>.Ok(ToPage(page));
    }


    public async Task<Result<DigitizationPageDto>> UploadPageDocumentAsync(
        long pageId, Microsoft.AspNetCore.Http.IFormFile? document, CancellationToken ct = default)
    {
        var original = await db.Pages.Include(p => p.Batch!).FirstOrDefaultAsync(p => p.Id == pageId, ct);
        if (original is null) return Result<DigitizationPageDto>.Fail("Page not found.", "pageId");
        if (original.Batch!.Status == BatchStatus.Approved)
            return Result<DigitizationPageDto>.Fail("Approved batches are read-only.", "pageId");

        var storedResult = await documentStore.SaveAsync(document, ct);
        if (!storedResult.IsSuccess) return Result<DigitizationPageDto>.Fail(storedResult.Errors);
        var stored = storedResult.Value;
        var version = (await db.Pages.AsNoTracking()
            .Where(p => p.Barcode == original.Barcode && p.PageNo == original.PageNo)
            .Select(p => (int?)p.Version).MaxAsync(ct) ?? 0) + 1;
        var hasActive = await db.Pages.AnyAsync(p =>
            p.Barcode == original.Barcode && p.PageNo == original.PageNo && p.Status == PageStatus.Active, ct);
        var page = new DigitizationPage
        {
            BatchId = original.BatchId, Barcode = original.Barcode, FileName = stored.OriginalFileName,
            PageNo = original.PageNo, Version = version,
            Status = version > 1 && hasActive ? PageStatus.Duplicate : PageStatus.PendingReview,
            Note = $"Uploaded document version {version} for page {original.PageNo}.",
            UploadedAt = DateTime.UtcNow, UploadedBy = current.UserName, Bulk = original.Bulk,
            StorageKey = stored.StorageKey, ContentType = stored.ContentType, SizeBytes = stored.SizeBytes, Sha256 = stored.Sha256
        };
        db.Pages.Add(page);
        original.Batch.Pages.Add(page);
        original.Batch.Status = RecomputeStatus(original.Batch);
        await audit.LogAsync(db, AuditAction.Create, "DigitizationPage", "pending",
            $"page={page.PageNo}; version={version - 1}",
            $"{stored.OriginalFileName}; version={version}; bytes={stored.SizeBytes}; sha256={stored.Sha256}",
            $"Uploaded {stored.OriginalFileName} as version {version} for {original.Barcode}", ct);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "Could not register document version {Version} for page {PageId}.", version, pageId);
            await TryDeleteAsync(stored.StorageKey);
            return Result<DigitizationPageDto>.Fail("This page was updated by another upload. Please retry.", "document");
        }
        catch { await TryDeleteAsync(stored.StorageKey); throw; }
        await audit.AnnounceAsync(RealtimeChannels.Digitization, "page.added", page.BatchId.ToString(),
            $"{stored.OriginalFileName} added as version {version}");
        return Result<DigitizationPageDto>.Ok(ToPage(page));
    }

    public async Task<PrivateDocumentContent?> OpenPageDocumentAsync(long pageId, CancellationToken ct = default)
    {
        var page = await db.Pages.AsNoTracking().FirstOrDefaultAsync(p => p.Id == pageId, ct);
        if (page?.StorageKey is null || page.ContentType is null || page.Sha256 is null) return null;
        var stream = await documentStore.OpenReadAsync(page.StorageKey, ct);
        return stream is null ? null : new PrivateDocumentContent(page.FileName, page.ContentType, page.SizeBytes ?? 0, page.Sha256, stream);
    }

    private async Task TryDeleteAsync(string storageKey)
    {
        try { await documentStore.DeleteAsync(storageKey, CancellationToken.None); }
        catch (Exception ex) { logger.LogError(ex, "Could not clean up document key {StorageKey}.", storageKey); }
    }

    public async Task<Result<bool>> RemovePageAsync(long pageId, CancellationToken ct)
    {
        var page = await db.Pages.Include(p => p.Batch!).FirstOrDefaultAsync(p => p.Id == pageId, ct);
        if (page is null) return Result<bool>.Fail("Page not found.", "pageId");
        if (page.Batch!.Status == BatchStatus.Approved)
            return Result<bool>.Fail("Approved batches are read-only.", "pageId");

        var storageKey = page.StorageKey;
        db.Pages.Remove(page);
        page.Batch.Pages.Remove(page);
        page.Batch.Status = RecomputeStatus(page.Batch);
        await audit.LogAsync(db, AuditAction.Delete, "DigitizationPage", pageId.ToString(),
            $"{page.FileName} v{page.Version}", "deleted", $"Page removed from {page.Batch.Code}");
        await db.SaveChangesAsync(ct);
        if (!string.IsNullOrWhiteSpace(storageKey)) await TryDeleteAsync(storageKey);
        await audit.AnnounceAsync(RealtimeChannels.Digitization, "page.removed", page.BatchId.ToString(),
            $"{page.FileName} removed from {page.Batch.Code}");
        return Result<bool>.Ok(true);
    }

    public async Task<Result<DigitizationPageDto>> ReviewPageAsync(long pageId, PageReviewInput input, CancellationToken ct)
    {
        var page = await db.Pages.Include(p => p.Batch!).FirstOrDefaultAsync(p => p.Id == pageId, ct);
        if (page is null) return Result<DigitizationPageDto>.Fail("Page not found.", "pageId");

        var approve = string.Equals(input.Decision, "Approved", StringComparison.OrdinalIgnoreCase);
        if (!approve && string.IsNullOrWhiteSpace(input.Note))
            return Result<DigitizationPageDto>.Fail("A rejection reason is required.", "note");

        var before = Display.Page(page.Status);
        page.Status = approve ? PageStatus.Approved : PageStatus.Rejected;
        if (!string.IsNullOrWhiteSpace(input.Note)) page.Note = input.Note.Trim();
        page.Batch!.Status = RecomputeStatus(page.Batch);

        await audit.LogAsync(db, approve ? AuditAction.Approve : AuditAction.Reject,
            "DigitizationPage", pageId.ToString(), $"status={before}", $"status={Display.Page(page.Status)}",
            $"{page.FileName} {Display.Page(page.Status).ToLower()}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Digitization,
            approve ? "page.approved" : "page.rejected", page.BatchId.ToString(),
            $"{page.FileName} {Display.Page(page.Status).ToLower()}");

        return Result<DigitizationPageDto>.Ok(ToPage(page));
    }

    public async Task<Result<DigitizationBatchDto>> ReviewBatchAsync(long batchId, PageReviewInput input, CancellationToken ct)
    {
        var batch = await db.Batches.Include(b => b.Pages).FirstOrDefaultAsync(b => b.Id == batchId, ct);
        if (batch is null) return Result<DigitizationBatchDto>.Fail("Batch not found.", "batchId");

        var approve = string.Equals(input.Decision, "Approved", StringComparison.OrdinalIgnoreCase);
        if (!approve && string.IsNullOrWhiteSpace(input.Note))
            return Result<DigitizationBatchDto>.Fail("A rejection reason is required.", "note");

        var pending = batch.Pages.Where(p => p.Status == PageStatus.PendingReview).ToList();
        if (pending.Count == 0)
            return Result<DigitizationBatchDto>.Fail("No pages are awaiting review.", "batchId");

        foreach (var page in pending)
        {
            page.Status = approve ? PageStatus.Approved : PageStatus.Rejected;
            if (!string.IsNullOrWhiteSpace(input.Note)) page.Note = input.Note.Trim();
        }

        batch.SubmittedAt ??= DateTime.UtcNow;
        batch.Status = RecomputeStatus(batch);

        await audit.LogAsync(db, approve ? AuditAction.Approve : AuditAction.Reject,
            "DigitizationBatch", batchId.ToString(),
            $"pending={pending.Count}",
            $"{(approve ? "approved" : "rejected")}={pending.Count}",
            $"{batch.Code}: {pending.Count} page(s) {(approve ? "approved" : "rejected")}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Digitization,
            approve ? "batch.approved" : "batch.rejected", batchId.ToString(),
            $"{batch.Code} is now {Display.Batch(batch.Status)}");

        return Result<DigitizationBatchDto>.Ok(ToBatch(batch));
    }

    public async Task<int> PendingReviewCountAsync(CancellationToken ct = default) =>
        await db.Pages.CountAsync(p => p.Status == PageStatus.PendingReview, ct);
}