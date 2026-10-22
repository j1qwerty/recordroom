using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Cache;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Application.Services;

// ============================================================== movements/audit

public interface IReadService
{
    Task<MovementDto[]> MovementsAsync(string? kind, string? search, int limit, CancellationToken ct = default);
    Task<MovementDto[]> FileMovementsAsync(int fileId, CancellationToken ct = default);
    Task<AuditEntry[]> AuditAsync(string? action, string? actor, string? entity, string? search, int limit, CancellationToken ct = default);
    Task<LoginHistoryEntry[]> LoginHistoryAsync(string? outcome, string? search, CancellationToken ct = default);
    Task<string[]> AuditActorsAsync(CancellationToken ct = default);
    Task<DashboardStatsDto> DashboardStatsAsync(CancellationToken ct = default);
    Task<ActivityDto[]> ActivityAsync(int limit, CancellationToken ct = default);
}

public sealed class ReadService(AppDbContext db, ICacheService cache) : IReadService
{
    private static MovementDto ToMovement(MovementEvent m) => new(
        m.Id, Display.Movement(m.Kind), m.RecordFileId, m.Barcode, m.Subject, m.From, m.To,
        m.Actor, m.At, m.Detail, m.IssueReceiptId);

    private static string Stamp(DateTime value) =>
        value.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

    public async Task<MovementDto[]> MovementsAsync(string? kind, string? search, int limit, CancellationToken ct)
    {
        var query = db.Movements.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(kind) && kind != "All")
        {
            var parsed = Display.ParseMovement(kind);
            if (parsed is not null)
            {
                var target = parsed.Value;
                query = query.Where(m => m.Kind == target);
            }
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(m =>
                m.Barcode.ToLower().Contains(needle)
                || m.Subject.ToLower().Contains(needle)
                || m.Actor.ToLower().Contains(needle)
                || m.From.ToLower().Contains(needle)
                || m.To.ToLower().Contains(needle)
                || m.Detail.ToLower().Contains(needle));
        }

        var rows = (await query.OrderByDescending(m => m.At)
            .Take(Math.Clamp(limit, 1, 1000)).ToListAsync(ct)).ToArray();
        return rows.Select(ToMovement).ToArray();
    }

    public async Task<MovementDto[]> FileMovementsAsync(int fileId, CancellationToken ct) =>
        (await db.Movements.AsNoTracking().Where(m => m.RecordFileId == fileId)
            .OrderByDescending(m => m.At).ToListAsync(ct))
        .Select(ToMovement).ToArray();

    public async Task<AuditEntry[]> AuditAsync(
        string? action, string? actor, string? entity, string? search, int limit, CancellationToken ct)
    {
        var query = db.Audit.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(action) && action != "All")
        {
            var parsed = Enum.TryParse<AuditAction>(action, true, out var a) ? a : (AuditAction?)null;
            if (parsed is not null)
            {
                var target = parsed.Value;
                query = query.Where(e => e.Action == target);
            }
        }
        if (!string.IsNullOrWhiteSpace(actor) && actor != "All") query = query.Where(e => e.Actor == actor);
        if (!string.IsNullOrWhiteSpace(entity) && entity != "All") query = query.Where(e => e.Entity == entity);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(e =>
                e.Summary.ToLower().Contains(needle)
                || e.Entity.ToLower().Contains(needle)
                || e.EntityId.ToLower().Contains(needle)
                || e.Actor.ToLower().Contains(needle)
                || e.Ip.ToLower().Contains(needle));
        }

        return (await query.OrderByDescending(e => e.At)
            .Take(Math.Clamp(limit, 1, 1000)).ToListAsync(ct)).ToArray();
    }

    public async Task<LoginHistoryEntry[]> LoginHistoryAsync(string? outcome, string? search, CancellationToken ct)
    {
        var query = db.LoginHistory.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(outcome) && outcome != "All")
        {
            var parsed = Enum.TryParse<LoginOutcome>(outcome, true, out var o) ? o : (LoginOutcome?)null;
            if (parsed is not null)
            {
                var target = parsed.Value;
                query = query.Where(e => e.Outcome == target);
            }
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(e =>
                e.UserName.ToLower().Contains(needle)
                || e.Role.ToLower().Contains(needle)
                || e.Ip.ToLower().Contains(needle)
                || e.UserAgent.ToLower().Contains(needle)
                || e.Detail.ToLower().Contains(needle));
        }
        return (await query.OrderByDescending(e => e.LoginAt).Take(500).ToListAsync(ct)).ToArray();
    }

    public Task<string[]> AuditActorsAsync(CancellationToken ct) =>
        db.Audit.AsNoTracking().Select(e => e.Actor).Distinct().OrderBy(a => a).ToArrayAsync(ct);

    /// <summary>
    /// Cached because the dashboard is the first screen every operator opens.
    /// Any write clears the key, so a cached value is never more than one write
    /// behind.
    /// </summary>
    public Task<DashboardStatsDto> DashboardStatsAsync(CancellationToken ct) =>
        cache.GetOrCreateAsync(CacheKeys.DashboardStats, TimeSpan.FromSeconds(30), async () =>
        {
            var issued = await db.Files.CountAsync(f => f.Status == RecordStatus.Issued, ct);
            var overdue = await db.Issues.CountAsync(i => i.Status == IssueStatus.Overdue, ct);
            var dueToday = await db.Issues.CountAsync(
                i => i.Status != IssueStatus.Returned && i.DueAt <= DateTime.UtcNow.AddDays(1), ct);
            var borrowers = await db.Issues.AsNoTracking()
                .Where(i => i.Status != IssueStatus.Returned)
                .Select(i => i.BorrowerEmployeeCode).Distinct().CountAsync(ct);
            var pending = await db.Pages.CountAsync(p => p.Status == PageStatus.PendingReview, ct);
            var rooms = await db.Rooms.CountAsync(ct);
            var pageCount = await db.Pages.CountAsync(ct);
            var approved = await db.Pages.CountAsync(p => p.Status == PageStatus.Approved, ct);

            // Mirrors the frontend's honesty rule: the registry total is the
            // legacy collection size, never the loaded page count.
            const long total = 2_478_450;
            var loaded = await db.Files.CountAsync(ct);
            var mapped = Math.Round((double)loaded / total * 100, 1);

            return new DashboardStatsDto(
                total,
                mapped,
                issued,
                dueToday,
                pageCount == 0 ? 0 : Math.Round((double)approved / pageCount * 100, 1),
                overdue,
                rooms,
                borrowers,
                pending);
        });

    public Task<ActivityDto[]> ActivityAsync(int limit, CancellationToken ct) =>
        cache.GetOrCreateAsync(CacheKeys.DashboardActivity, TimeSpan.FromSeconds(20), async () =>
        {
            var rows = await db.Movements.AsNoTracking()
                .OrderByDescending(m => m.At).Take(Math.Clamp(limit, 1, 50)).ToListAsync(ct);

            return rows.Select(m => new ActivityDto(
                m.Id.ToString(),
                m.Kind.ToString(),
                Stamp(m.At),
                $"{m.Kind} - {m.Actor}",
                $"{m.Barcode} - {m.Detail}",
                m.Kind == MovementKind.Issue ? "warning"
                    : m.Kind == MovementKind.Return ? "success"
                    : m.Kind == MovementKind.LocationChange ? "info"
                    : "default")).ToArray();
        });
}

// ================================================================ barcode logic

/// <summary>
/// Payload grammar shared with the frontend <c>lib/barcode.ts</c>:
/// <c>RR|SUBJECT|VALUE</c> for Code 128 labels, and a /scan?p= URL for QR.
/// </summary>
public interface IBarcodeService
{
    Task<BarcodePayloadDto?> PayloadFor(BarcodeSubject subject, string targetId, CancellationToken ct = default);
    Task<BarcodeValidateResponse> Validate(BarcodeValidateInput input, CancellationToken ct = default);
    Task<BarcodeJobDto[]> JobsAsync(CancellationToken ct = default);
    Task<Result<BarcodeJobDto>> CreateJobAsync(BarcodeJobInput input, CancellationToken ct = default);
    Task<Result<bool>> CancelJobAsync(long id, CancellationToken ct = default);
    string BuildQrUrl(string linearPayload);
}

public sealed class BarcodeService(AppDbContext db, IAuditWriter audit) : IBarcodeService
{
    private const string Prefix = "RR";

    private static readonly Dictionary<BarcodeSubject, string> Codes = new()
    {
        [BarcodeSubject.File] = "FILE",
        [BarcodeSubject.Shelf] = "SHELF",
        [BarcodeSubject.Almirah] = "ALMIRAH",
        [BarcodeSubject.Section] = "SECTION",
        [BarcodeSubject.Room] = "ROOM",
        [BarcodeSubject.Area] = "AREA",
    };

    private static readonly Dictionary<string, BarcodeSubject> Subjects =
        Codes.ToDictionary(kv => kv.Value, kv => kv.Key);

    private static BarcodePayloadDto Build(BarcodeSubject subject, string value, string label) => new(
        subject.ToString(), "Code128", $"{Prefix}|{Codes[subject]}|{value}", label,
        $"Code 128 · set B · {value.Length} chars", true, null);

    public string BuildQrUrl(string linearPayload)
    {
        var origin = "https://records.local";
        return $"{origin}/scan?p={Uri.EscapeDataString(linearPayload)}";
    }

    public async Task<BarcodePayloadDto?> PayloadFor(BarcodeSubject subject, string targetId, CancellationToken ct)
    {
        if (int.TryParse(targetId, out var id))
        {
            switch (subject)
            {
                case BarcodeSubject.File:
                {
                    var file = await db.Files.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, ct);
                    if (file is not null) return Build(subject, file.Barcode, file.FileNumber);
                    break;
                }
                case BarcodeSubject.Shelf:
                {
                    var shelf = await db.Shelves.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
                    if (shelf is not null) return Build(subject, shelf.Barcode, shelf.Code);
                    break;
                }
                case BarcodeSubject.Almirah:
                {
                    var unit = await db.StorageUnits.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
                    if (unit is not null) return Build(subject, unit.Barcode, unit.Code);
                    break;
                }
                case BarcodeSubject.Section:
                {
                    var section = await db.Sections.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
                    if (section is not null) return Build(subject, section.Code, section.Name);
                    break;
                }
                case BarcodeSubject.Room:
                {
                    var room = await db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
                    if (room is not null) return Build(subject, room.Code, room.Name);
                    break;
                }
                case BarcodeSubject.Area:
                {
                    var area = await db.Areas.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
                    if (area is not null) return Build(subject, area.Name, $"{area.Name} · {area.Pincode}");
                    break;
                }
            }
        }
        return null;
    }

    public async Task<BarcodeValidateResponse> Validate(BarcodeValidateInput input, CancellationToken ct)
    {
        var raw = input.Value?.Trim() ?? string.Empty;
        if (raw.Length == 0)
            return new BarcodeValidateResponse(false, null, "Nothing scanned yet.");

        // QR stickers carry the same linear payload in a /scan?p= query.
        var normalised = raw.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            || raw.StartsWith("/scan", StringComparison.OrdinalIgnoreCase)
            ? System.Web.HttpUtility.ParseQueryString(
                new Uri(raw.StartsWith("/") ? "https://x" + raw : raw).Query)["p"] ?? raw
            : raw;

        var parts = normalised.Split('|');
        if (parts.Length != 3 || parts[0] != Prefix)
        {
            return new BarcodeValidateResponse(false, null,
                $"Unrecognised payload. Expected {Prefix}|SUBJECT|VALUE.");
        }
        if (!Subjects.TryGetValue(parts[1], out var subject))
            return new BarcodeValidateResponse(false, null, $"Unknown subject code \"{parts[1]}\".");

        var value = parts[2].Trim();
        if (value.Length == 0)
            return new BarcodeValidateResponse(false, null, "Payload carries an empty value.");

        return new BarcodeValidateResponse(true, new BarcodePayloadDto(
            subject.ToString(), "Code128", normalised, value,
            $"Code 128 · set B · {value.Length} chars", true, null),
            $"{subject} payload accepted.");
    }

    private static BarcodeJobDto ToJob(BarcodeJob j) => new(
        j.Id, j.Subject.ToString(), j.TargetId, j.Label, j.Value, j.Quantity,
        j.RequestedBy, j.CreatedAt, j.Status);

    public async Task<BarcodeJobDto[]> JobsAsync(CancellationToken ct) =>
        (await db.BarcodeJobs.AsNoTracking().OrderByDescending(j => j.CreatedAt).ToListAsync(ct))
        .Select(ToJob).ToArray();

    public async Task<Result<BarcodeJobDto>> CreateJobAsync(BarcodeJobInput input, CancellationToken ct)
    {
        if (!Enum.TryParse<BarcodeSubject>(input.Subject, true, out var subject))
            return Result<BarcodeJobDto>.Fail("Unknown barcode subject.", "subject");

        var payload = await PayloadFor(subject, input.TargetId, ct);
        if (payload is null) return Result<BarcodeJobDto>.Fail("Nothing to label for that target.", "targetId");

        var quantity = input.Quantity;
        if (quantity is < 1 or > 500) return Result<BarcodeJobDto>.Fail("Quantity must be between 1 and 500.", "quantity");

        var job = new BarcodeJob
        {
            Subject = subject,
            TargetId = input.TargetId,
            Label = payload.Label,
            Value = payload.Value,
            Quantity = quantity,
            CreatedAt = DateTime.UtcNow,
            Status = "Queued",
        };

        db.BarcodeJobs.Add(job);
        await audit.LogAsync(db, AuditAction.Create, "BarcodeJob", job.Id.ToString(),
            "-", $"{payload.Value} x{quantity}",
            $"Queued {quantity} {subject.ToString().ToLower()} label(s) for {payload.Label}");
        await db.SaveChangesAsync(ct);
        return Result<BarcodeJobDto>.Ok(ToJob(job));
    }

    public async Task<Result<bool>> CancelJobAsync(long id, CancellationToken ct)
    {
        var job = await db.BarcodeJobs.FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job is null) return Result<bool>.Fail("Print job not found.", "id");
        if (job.Status == "Printed")
            return Result<bool>.Fail("Printed jobs cannot be cancelled; raise a reprint instead.", "id");

        job.Status = "Cancelled";
        await audit.LogAsync(db, AuditAction.Update, "BarcodeJob", id.ToString(),
            "status=Queued", "status=Cancelled", $"Print job for {job.Label} cancelled");
        await db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }
}
