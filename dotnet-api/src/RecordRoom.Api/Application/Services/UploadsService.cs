using System.Text;
using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Application.Services;

/// <summary>
/// Legacy <c>upload_map</c> rows and the bulk CSV ingest pipeline.
/// </summary>
public interface IUploadsService
{
    Task<MapUploadDto[]> MapsAsync(string? fileBarcode, string? search, CancellationToken ct = default);
    Task<Result<MapUploadDto>> AddMapAsync(MapUploadInput input, CancellationToken ct = default);
    Task<Result<bool>> RemoveMapAsync(long id, CancellationToken ct = default);
}

public sealed class UploadsService(AppDbContext db, IAuditWriter audit, ICurrentUserAccessor current) : IUploadsService
{
    private static MapUploadDto ToDto(MapUpload m) => new(
        m.Id, m.Barcode, m.FileName, m.PageNo, m.Version, Display.Page(m.Status),
        m.UploadedAt, m.UploadedBy, m.SizeKb);

    public async Task<MapUploadDto[]> MapsAsync(string? fileBarcode, string? search, CancellationToken ct)
    {
        var query = db.Maps.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(fileBarcode))
        {
            var needle = fileBarcode.Trim().ToUpperInvariant();
            query = query.Where(m => m.Barcode.ToUpper() == needle);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(m =>
                m.Barcode.ToLower().Contains(needle)
                || m.FileName.ToLower().Contains(needle)
                || m.Status.ToString().ToLower().Contains(needle));
        }
        return (await query.OrderByDescending(m => m.UploadedAt).ToListAsync(ct)).Select(ToDto).ToArray();
    }

    public async Task<Result<MapUploadDto>> AddMapAsync(MapUploadInput input, CancellationToken ct)
    {
        var barcode = input.FileBarcode?.Trim().ToUpperInvariant() ?? string.Empty;
        var file = await db.Files.FirstOrDefaultAsync(f => f.Barcode.ToUpper() == barcode, ct);
        if (file is null) return Result<MapUploadDto>.Fail($"{barcode} is not in the registry.", "fileBarcode");
        if (input.PageNo < 1) return Result<MapUploadDto>.Fail("Page number starts at 1.", "pageNo");
        if (string.IsNullOrWhiteSpace(input.FileName)) return Result<MapUploadDto>.Fail("File name is required.", "fileName");
        if (input.SizeKb <= 0) return Result<MapUploadDto>.Fail("Enter the scan size in KB.", "sizeKb");

        // A re-scan of the same file and page becomes the next version, and the
        // previous approved row is retired rather than silently replaced.
        var version = (await db.Maps.Where(m => m.Barcode == file.Barcode && m.PageNo == input.PageNo)
            .Select(m => (int?)m.Version).MaxAsync(ct) ?? 0) + 1;

        var map = new MapUpload
        {
            Barcode = file.Barcode,
            FileName = input.FileName.Trim(),
            PageNo = input.PageNo,
            Version = version,
            Status = PageStatus.PendingReview,
            SizeKb = input.SizeKb,
            UploadedAt = DateTime.UtcNow,
            UploadedBy = current.UserName,
        };

        db.Maps.Add(map);
        if (version > 1)
        {
            var superseded = await db.Maps
                .Where(m => m.Barcode == map.Barcode && m.PageNo == map.PageNo
                            && m.Version < version && m.Status == PageStatus.Approved)
                .ToListAsync(ct);
            foreach (var row in superseded) row.Status = PageStatus.Duplicate;
        }

        await audit.LogAsync(db, AuditAction.Create, "MapUpload", map.Id.ToString(),
            version > 1 ? $"version={version - 1}" : "-", $"{map.FileName} v{version}",
            $"Map page added for {map.Barcode}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Uploads, "map.added", map.Id.ToString(),
            $"{map.FileName} stored as version {map.Version}");

        return Result<MapUploadDto>.Ok(ToDto(map));
    }

    public async Task<Result<bool>> RemoveMapAsync(long id, CancellationToken ct)
    {
        var map = await db.Maps.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (map is null) return Result<bool>.Fail("Map not found.", "id");
        db.Maps.Remove(map);
        await audit.LogAsync(db, AuditAction.Delete, "MapUpload", id.ToString(),
            $"{map.FileName} v{map.Version}", "deleted", $"Map page removed for {map.Barcode}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Uploads, "map.removed", id.ToString(),
            $"{map.FileName} removed");
        return Result<bool>.Ok(true);
    }
}

public interface IBulkService
{
    Task<BulkJobDto[]> JobsAsync(CancellationToken ct = default);
    Task<BulkJobDto?> JobAsync(long id, CancellationToken ct = default);
    Task<Result<BulkJobDto>> ValidateAsync(BulkValidateInput input, CancellationToken ct = default);
    Task<Result<BulkJobDto>> CommitAsync(long id, CancellationToken ct = default);
}

/// <summary>
/// Bulk registry ingest, the modern equivalent of <c>bulk_upload</c> +
/// <c>renaming_process</c>. Rows are validated against the unique barcode index
/// and the shelf barcode table, and nothing is written until commit.
/// </summary>
public sealed class BulkService(AppDbContext db, IAuditWriter audit, ICurrentUserAccessor current) : IBulkService
{
    private static BulkJobDto ToDto(BulkImportJob j) => new(
        j.Id, j.FileName, j.Folder, j.CreatedAt, j.CreatedBy, j.Status,
        j.Rows.Select(r => new BulkRowDto(r.RowNo, r.Barcode, r.Subject, r.ShelfBarcode, r.Result, r.Detail)).ToArray(),
        j.Accepted, j.Rejected, j.Duplicates);

    public async Task<BulkJobDto[]> JobsAsync(CancellationToken ct = default) =>
        (await db.BulkJobs.AsNoTracking().Include(j => j.Rows)
            .OrderByDescending(j => j.CreatedAt).ToListAsync(ct))
        .Select(ToDto).ToArray();

    public async Task<BulkJobDto?> JobAsync(long id, CancellationToken ct)
    {
        var job = await db.BulkJobs.AsNoTracking().Include(j => j.Rows)
            .FirstOrDefaultAsync(j => j.Id == id, ct);
        return job is null ? null : ToDto(job);
    }

    private static List<string> SplitCsvLine(string line)
    {
        var cells = new List<string>();
        var current = new StringBuilder();
        var quoted = false;
        for (var i = 0; i < line.Length; i++)
        {
            var ch = line[i];
            if (quoted)
            {
                if (ch == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"') { current.Append('"'); i++; }
                    else quoted = false;
                }
                else current.Append(ch);
                continue;
            }
            if (ch == '"') quoted = true;
            else if (ch == ',') { cells.Add(current.ToString().Trim()); current.Clear(); }
            else current.Append(ch);
        }
        cells.Add(current.ToString().Trim());
        return cells;
    }

    private static int HeaderIndex(string[] header, params string[] names)
    {
        for (var i = 0; i < header.Length; i++)
        {
            var cell = header[i].ToLower().Replace(' ', '_').Replace("-", "_");
            if (names.Contains(cell)) return i;
        }
        return -1;
    }

    public async Task<Result<BulkJobDto>> ValidateAsync(BulkValidateInput input, CancellationToken ct)
    {
        var lines = (input.Csv ?? string.Empty)
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Trim())
            .Where(l => l.Length > 0)
            .ToList();

        if (lines.Count < 2)
            return Result<BulkJobDto>.Fail("Paste a header row plus at least one data row.", "csv");

        var header = SplitCsvLine(lines[0]).ToArray();
        var barcodeIdx = HeaderIndex(header, "barcode", "file_barcode", "rfid", "rf_id");
        var subjectIdx = HeaderIndex(header, "subject", "file_name");
        var shelfIdx = HeaderIndex(header, "shelf", "shelf_barcode");
        if (barcodeIdx < 0 || subjectIdx < 0 || shelfIdx < 0)
        {
            return Result<BulkJobDto>.Fail(
                "Header must include barcode (or file_barcode), subject and shelf (or shelf_barcode).", "csv");
        }

        var existingBarcodes = await db.Files.AsNoTracking()
            .Select(f => f.Barcode.ToUpper()).ToListAsync(ct);
        var known = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var active = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var shelf in await db.Shelves.AsNoTracking().Select(s => new { s.Barcode, s.Status }).ToListAsync(ct))
        {
            known.Add(shelf.Barcode);
            if (shelf.Status == StorageStatus.Active) active.Add(shelf.Barcode);
        }

        var folder = string.IsNullOrWhiteSpace(input.Folder) ? "bulk/" : input.Folder.Trim();
        var fileName = folder.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "staged.csv";

        var job = new BulkImportJob
        {
            FileName = fileName,
            Folder = folder,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = current.UserName,
            Status = "Validated",
        };

        for (var i = 1; i < lines.Count; i++)
        {
            var cells = SplitCsvLine(lines[i]);
            string Cell(int idx) => idx < cells.Count ? cells[idx] : string.Empty;

            var row = new BulkImportRow
            {
                RowNo = i + 1,
                Barcode = Cell(barcodeIdx),
                Subject = Cell(subjectIdx),
                ShelfBarcode = Cell(shelfIdx),
                Result = "Invalid row",
                Detail = string.Empty,
            };

            var barcode = row.Barcode.Trim().ToUpperInvariant();
            var shelfBarcode = row.ShelfBarcode.Trim().ToUpperInvariant();
            if (barcode.Length == 0 || row.Subject.Trim().Length == 0)
            {
                row.Detail = "Barcode and subject are both required.";
            }
            else if (existingBarcodes.Contains(barcode, StringComparer.OrdinalIgnoreCase))
            {
                row.Result = "Duplicate barcode";
                row.Detail = $"{barcode} already exists in the registry.";
            }
            else if (!known.Contains(shelfBarcode))
            {
                row.Result = "Unknown shelf";
                row.Detail = $"No shelf carries barcode {shelfBarcode}.";
            }
            else if (!active.Contains(shelfBarcode))
            {
                row.Result = "Inactive shelf";
                row.Detail = $"{shelfBarcode} is not active and cannot accept files.";
            }
            else
            {
                row.Result = "Accepted";
                row.Detail = "Barcode is free and the target shelf is active.";
            }

            job.Rows.Add(row);
        }

        Recount(job);
        db.BulkJobs.Add(job);
        await audit.LogAsync(db, AuditAction.Create, "BulkImportJob", "pending",
            "-", $"accepted={job.Accepted}, rejected={job.Rejected}",
            $"Validated {job.Rows.Count} staged row(s) from {job.FileName}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Files, "bulk.validated", job.Id.ToString(),
            $"{job.FileName}: {job.Accepted} accepted, {job.Rejected} rejected");

        return Result<BulkJobDto>.Ok(ToDto(job));
    }

    private static void Recount(BulkImportJob job)
    {
        job.Accepted = job.Rows.Count(r => r.Result == "Accepted");
        job.Rejected = job.Rows.Count(r => r.Result != "Accepted");
        job.Duplicates = job.Rows.Count(r => r.Result == "Duplicate barcode");
    }

    public async Task<Result<BulkJobDto>> CommitAsync(long id, CancellationToken ct)
    {
        var job = await db.BulkJobs.Include(j => j.Rows).FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job is null) return Result<BulkJobDto>.Fail("Import job not found.", "id");
        if (job.Status == "Committed") return Result<BulkJobDto>.Fail("This job was already committed.", "id");
        if (job.Accepted == 0) return Result<BulkJobDto>.Fail("Nothing to commit: every row was rejected.", "id");

        var now = DateTime.UtcNow;

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        foreach (var row in job.Rows.Where(r => r.Result == "Accepted").ToList())
        {
            var shelf = await db.Shelves.Include(s => s.StorageUnit!).ThenInclude(u => u.Section!)
                .FirstOrDefaultAsync(s => s.Barcode == row.ShelfBarcode.Trim(), ct);
            if (shelf is null)
            {
                // The shelf disappeared between validation and commit.
                row.Result = "Unknown shelf";
                row.Detail = "Shelf disappeared between validation and commit.";
                continue;
            }
            if (shelf.Status != StorageStatus.Active)
            {
                row.Result = "Inactive shelf";
                row.Detail = "Shelf is no longer active.";
                continue;
            }

            var unit = shelf.StorageUnit!;
            var room = await db.Rooms.FirstOrDefaultAsync(r => r.Id == unit.RoomId, ct);
            var barcode = row.Barcode.Trim().ToUpperInvariant();

            db.Files.Add(new RecordFile
            {
                Barcode = barcode,
                FileNumber = $"BULK/{now.Year}/{barcode[^4..]}",
                Subject = row.Subject.Trim(),
                Department = "Unverified",
                Year = now.Year,
                FileKind = FileKind.File,
                Status = RecordStatus.Available,
                RoomId = unit.RoomId,
                SectionId = unit.SectionId,
                AlmirahId = unit.Id,
                ShelfId = shelf.Id,
                ShelfBarcode = shelf.Barcode,
                ApproxPosition = Math.Min(100, shelf.Occupied + 1),
                LocationDisplay = $"{room?.Code} / {unit.Section?.Code} / {unit.Code} / {shelf.Code}",
                CodalLife = "As per department rules",
                CreatedAt = now,
                CreatedBy = current.UserName,
                UpdatedAt = now,
                UpdatedBy = current.UserName,
                LastMovementAt = now,
                Description = "Created by bulk import; department and area need verification.",
            });
            shelf.Occupied += 1;

            await audit.RecordMovementAsync(db, MovementKind.FileCreated,
                new RecordFile
                {
                    Barcode = barcode,
                    FileNumber = $"BULK/{now.Year}/{barcode[^4..]}",
                    Subject = row.Subject.Trim(),
                    LocationDisplay = shelf.Code,
                },
                "bulk staging", shelf.Code, $"Committed from {job.FileName} row {row.RowNo}.");
        }

        job.Status = "Committed";
        Recount(job);
        await audit.LogAsync(db, AuditAction.Create, "BulkImportJob", id.ToString(),
            $"status=Validated, accepted={job.Rows.Count(r => r.Result == "Accepted")}",
            $"status=Committed, accepted={job.Accepted}",
            $"Committed {job.Accepted} row(s) from {job.FileName}");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await audit.AnnounceAsync(RealtimeChannels.Files, "bulk.committed", id.ToString(),
            $"{job.Accepted} row(s) committed from {job.FileName}");
        return Result<BulkJobDto>.Ok(ToDto(job));
    }
}