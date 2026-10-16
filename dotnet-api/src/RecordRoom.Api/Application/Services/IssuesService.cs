using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Application.Services;

public interface IIssuesService
{
    Task<PagedResult<IssueDto>> ListAsync(string? status, string? borrower, bool? open, int page, int pageSize, CancellationToken ct = default);
    Task<IssueDto?> GetAsync(long id, CancellationToken ct = default);
    Task<BorrowerDto[]> BorrowersAsync(CancellationToken ct = default);
    Task<string> NextReceiptNumberAsync(CancellationToken ct = default);
    Task<Result<IssueDto>> IssueAsync(IssueInput input, CancellationToken ct = default);
    Task<Result<IssueDto>> ReturnAsync(long id, ReturnInput input, CancellationToken ct = default);
    Task<IssueDto[]> OverdueAsync(CancellationToken ct = default);
}

public sealed class IssuesService(AppDbContext db, IAuditWriter audit, ICurrentUserAccessor current) : IIssuesService
{
    private static IssueDto ToDto(IssueReceipt i) => new(
        i.Id, i.ReceiptNumber, i.BorrowerIsEmployee ? "Employee" : "Depositor",
        i.BorrowerName, i.BorrowerEmployeeCode, i.Department, i.Purpose,
        i.Lines.Select(l => new IssueLineDto(l.Id, l.RecordFileId, l.Barcode, l.ReturnedAt, l.ReturnCondition)).ToArray(),
        i.IssuedAt, i.DueAt, i.ReturnedAt, Display.Issue(i.Status), i.Remark, i.IssuedBy);

    private static string BorrowerLabel(IssueReceipt issue) =>
        issue.BorrowerIsEmployee
            ? $"{issue.BorrowerName} - {issue.Department}"
            : $"{issue.BorrowerName} (depositor {issue.BorrowerEmployeeCode})";

    /// <summary>
    /// Part-return aware. Legacy <c>issue_file_tbl</c> had one row per file and
    /// could not express a receipt that came back in pieces.
    /// </summary>
    private static IssueStatus DeriveStatus(IssueReceipt issue, DateTime now)
    {
        var openLines = issue.Lines.Count(l => l.ReturnedAt is null);
        if (openLines == 0) return IssueStatus.Returned;
        if (openLines < issue.Lines.Count) return IssueStatus.PartiallyReturned;
        return issue.DueAt < now ? IssueStatus.Overdue : IssueStatus.Issued;
    }

    public async Task<PagedResult<IssueDto>> ListAsync(
        string? status, string? borrower, bool? open, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.Issues.AsNoTracking().Include(i => i.Lines).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            var parsed = Enum.TryParse<IssueStatus>(status, true, out var s) ? s : (IssueStatus?)null;
            if (parsed is not null)
            {
                var target = parsed.Value;
                query = query.Where(i => i.Status == target);
            }
        }
        if (open == true) query = query.Where(i => i.Status != IssueStatus.Returned);
        if (!string.IsNullOrWhiteSpace(borrower))
        {
            var needle = borrower.Trim().ToLower();
            query = query.Where(i =>
                i.BorrowerName.ToLower().Contains(needle)
                || i.BorrowerEmployeeCode.ToLower().Contains(needle)
                || i.Department.ToLower().Contains(needle)
                || i.Purpose.ToLower().Contains(needle)
                || i.ReceiptNumber.ToLower().Contains(needle)
                || i.Lines.Any(line =>
                    line.Barcode.ToLower().Contains(needle)
                    || (line.RecordFile != null && line.RecordFile.Subject.ToLower().Contains(needle))));
        }

        var total = await query.CountAsync(ct);
        var p = Math.Max(1, page);
        var size = Math.Clamp(pageSize, 1, 200);
        var rows = await query.OrderByDescending(i => i.IssuedAt)
            .Skip((p - 1) * size).Take(size).ToListAsync(ct);

        return new PagedResult<IssueDto>(rows.Select(ToDto).ToArray(), total, p, size, total);
    }

    public async Task<IssueDto?> GetAsync(long id, CancellationToken ct = default)
    {
        var issue = await db.Issues.AsNoTracking().Include(i => i.Lines)
            .FirstOrDefaultAsync(i => i.Id == id, ct);
        return issue is null ? null : ToDto(issue);
    }

    public async Task<BorrowerDto[]> BorrowersAsync(CancellationToken ct = default)
    {
        var open = await db.Issues.AsNoTracking().Include(i => i.Lines)
            .Where(i => i.Status != IssueStatus.Returned)
            .ToListAsync(ct);

        return open
            .SelectMany(issue => issue.Lines.Where(l => l.ReturnedAt is null)
                .Select(_ => new { issue, _ }))
            .GroupBy(x => x.issue.BorrowerEmployeeCode)
            .Select(g => new BorrowerDto(
                g.Key,
                g.First().issue.BorrowerName,
                g.First().issue.Department,
                g.Count(),
                g.Min(x => x.issue.DueAt),
                g.Any(x => x.issue.Status == IssueStatus.Overdue)))
            .OrderByDescending(b => b.Overdue)
            .ThenBy(b => b.OldestDue)
            .ToArray();
    }

    public async Task<string> NextReceiptNumberAsync(CancellationToken ct = default)
    {
        var prefix = $"ISS-{DateTime.UtcNow.Year}-";
        var rows = await db.Issues.AsNoTracking()
            .Where(i => i.ReceiptNumber.StartsWith(prefix))
            .Select(i => i.ReceiptNumber)
            .ToListAsync(ct);

        var highest = rows
            .Select(r => int.TryParse(r[prefix.Length..], out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max();
        return $"{prefix}{highest + 1:D4}";
    }

    public async Task<Result<IssueDto>> IssueAsync(IssueInput input, CancellationToken ct)
    {
        if (input.FileIds.Length == 0) return Result<IssueDto>.Fail("Scan at least one file before issuing.", "fileIds");
        if (input.FileIds.Distinct().Count() != input.FileIds.Length)
            return Result<IssueDto>.Fail("The same file was scanned twice in one receipt.", "fileIds");

        var isEmployee = string.Equals(input.BorrowerType, "Employee", StringComparison.OrdinalIgnoreCase);
        var code = input.BorrowerEmployeeCode?.Trim() ?? string.Empty;
        if (code.Length == 0)
        {
            return Result<IssueDto>.Fail(
                isEmployee
                    ? "Select the employee receiving the files."
                    : "Enter the depositor code for a walk-in borrower.",
                "borrowerEmployeeCode");
        }
        if (input.DueAt == default) return Result<IssueDto>.Fail("Set a due date for the receipt.", "dueAt");

        var files = await db.Files.Where(f => input.FileIds.Contains(f.Id)).ToListAsync(ct);
        if (files.Count != input.FileIds.Length)
            return Result<IssueDto>.Fail("One of the scanned files is not in the registry.", "fileIds");

        var blocked = files.FirstOrDefault(f => f.Status != RecordStatus.Available);
        if (blocked is not null)
        {
            return Result<IssueDto>.Fail(
                $"{blocked.Barcode} is {blocked.Status.ToString().ToLower()} and cannot be issued.", "fileIds");
        }

        var now = DateTime.UtcNow;
        var receipt = new IssueReceipt
        {
            ReceiptNumber = await NextReceiptNumberAsync(ct),
            BorrowerIsEmployee = isEmployee,
            BorrowerName = string.IsNullOrWhiteSpace(input.BorrowerName) ? code : input.BorrowerName.Trim(),
            BorrowerEmployeeCode = code,
            Department = input.Department?.Trim() ?? string.Empty,
            Purpose = input.Purpose?.Trim() ?? string.Empty,
            IssuedAt = now,
            DueAt = input.DueAt,
            IssuedBy = current.UserName,
            CreatedAt = now,
            Remark = input.Remark?.Trim() ?? string.Empty,
            Status = input.DueAt < now ? IssueStatus.Overdue : IssueStatus.Issued,
        };

        foreach (var file in files)
        {
            receipt.Lines.Add(new IssueLine
            {
                RecordFileId = file.Id,
                Barcode = file.Barcode,
                ReturnedAt = null,
            });
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        db.Issues.Add(receipt);
        await db.SaveChangesAsync(ct);

        var label = BorrowerLabel(receipt);
        foreach (var file in files)
        {
            file.Status = RecordStatus.Issued;
            file.Holder = label;
            file.HolderEmployeeCode = code;
            file.LastMovementAt = now;
            file.UpdatedAt = now;
            file.UpdatedBy = current.UserName;

            await audit.RecordMovementAsync(db, MovementKind.Issue, file, file.LocationDisplay, label,
                $"Issued on receipt {receipt.ReceiptNumber} ({files.Count} file(s)).", receipt.Id);
        }

        await audit.LogAsync(db, AuditAction.Issue, "IssueRecord", receipt.Id.ToString(),
            "status=Available",
            $"status=Issued, files={files.Count}",
            $"Issued {files.Count} file(s) to {label} on {receipt.ReceiptNumber}");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await audit.AnnounceAsync(RealtimeChannels.Issues, "issue.created", receipt.Id.ToString(),
            $"Receipt {receipt.ReceiptNumber}: {files.Count} file(s) issued to {label}");

        return Result<IssueDto>.Ok(ToDto(receipt));
    }

    public async Task<Result<IssueDto>> ReturnAsync(long id, ReturnInput input, CancellationToken ct)
    {
        var receipt = await db.Issues.Include(i => i.Lines).FirstOrDefaultAsync(i => i.Id == id, ct);
        if (receipt is null) return Result<IssueDto>.Fail("Receipt not found.", "id");
        if (input.FileIds.Length == 0) return Result<IssueDto>.Fail("Select at least one file to return.", "fileIds");

        var owned = receipt.Lines.Select(l => l.RecordFileId).ToHashSet();
        var foreign = input.FileIds.Where(f => !owned.Contains(f)).ToList();
        if (foreign.Count > 0)
            return Result<IssueDto>.Fail("A selected file does not belong to this receipt.", "fileIds");

        var now = DateTime.UtcNow;
        var returning = await db.Files.Where(f => input.FileIds.Contains(f.Id)).ToListAsync(ct);
        var condition = input.Condition?.Trim() ?? string.Empty;

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        // Stamp the lines first so the movement event can quote the condition.
        foreach (var line in receipt.Lines.Where(l => input.FileIds.Contains(l.RecordFileId)))
        {
            line.ReturnedAt = now;
            line.ReturnCondition = condition;
        }

        foreach (var file in returning)
        {
            file.Status = RecordStatus.Available;
            file.Holder = null;
            file.HolderEmployeeCode = null;
            file.LastMovementAt = now;
            file.UpdatedAt = now;
            file.UpdatedBy = current.UserName;

            var detail = string.IsNullOrWhiteSpace(condition)
                ? $"Returned against {receipt.ReceiptNumber}."
                : $"Returned against {receipt.ReceiptNumber} - condition: {condition}.";
            await audit.RecordMovementAsync(db, MovementKind.Return, file, BorrowerLabel(receipt),
                file.LocationDisplay, detail, receipt.Id);
        }

        receipt.Status = DeriveStatus(receipt, now);
        if (receipt.Status == IssueStatus.Returned) receipt.ReturnedAt = now;

        var openAfter = receipt.Lines.Count(l => l.ReturnedAt is null);
        await audit.LogAsync(db, AuditAction.Return, "IssueRecord", id.ToString(),
            $"status=Issued, open={input.FileIds.Length}",
            $"status={receipt.Status}, open={openAfter}",
            $"{input.FileIds.Length} file(s) returned against {receipt.ReceiptNumber}");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await audit.AnnounceAsync(RealtimeChannels.Issues, "issue.returned", id.ToString(),
            $"{input.FileIds.Length} file(s) returned against {receipt.ReceiptNumber}");

        return Result<IssueDto>.Ok(ToDto(receipt));
    }

    public async Task<IssueDto[]> OverdueAsync(CancellationToken ct = default) =>
        (await db.Issues.AsNoTracking().Include(i => i.Lines)
            .Where(i => i.Status == IssueStatus.Overdue)
            .OrderBy(i => i.DueAt)
            .ToListAsync(ct))
        .Select(ToDto)
        .ToArray();
}
