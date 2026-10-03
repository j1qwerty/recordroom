using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Application.Services;

/// <summary>
/// Room / section / almirah / shelf with the legacy
/// <c>Store_model.php</c> guards: a parent may only be removed once its children
/// are gone, and a shelf must be Active before a file may reference it.
/// </summary>
public interface ILocationsService
{
    Task<Result<RoomDto[]>> RoomsAsync(CancellationToken ct = default);
    Task<RoomDto?> RoomAsync(int id, CancellationToken ct = default);
    Task<AreaDto[]> AreasAsync(CancellationToken ct = default);
    Task<Result<SectionDto>> AddSectionAsync(int roomId, SectionInput input, CancellationToken ct = default);
    Task<Result<SectionDto>> UpdateSectionAsync(int id, SectionInput input, CancellationToken ct = default);
    Task<Result<bool>> DeleteSectionAsync(int id, CancellationToken ct = default);
    Task<Result<StorageUnitDto>> AddAlmirahAsync(int sectionId, AlmirahInput input, CancellationToken ct = default);
    Task<Result<StorageUnitDto>> UpdateAlmirahAsync(int id, AlmirahInput input, CancellationToken ct = default);
    Task<Result<bool>> DeleteAlmirahAsync(int id, CancellationToken ct = default);
    Task<Result<ShelfDto>> AddShelfAsync(int almirahId, ShelfInput input, CancellationToken ct = default);
    Task<Result<ShelfDto>> UpdateShelfAsync(int id, ShelfInput input, CancellationToken ct = default);
    Task<Result<bool>> DeleteShelfAsync(int id, CancellationToken ct = default);
    Task<Result<LayoutRevisionDto>> SaveLayoutAsync(int roomId, LayoutSaveInput input, CancellationToken ct = default);
    Task<LayoutRevisionDto[]> LayoutRevisionsAsync(int roomId, CancellationToken ct = default);
}

public sealed class LocationsService(
    AppDbContext db,
    IAuditWriter audit,
    ICurrentUserAccessor current) : ILocationsService
{
    private static StorageStatus ParseStatus(string? value, StorageStatus fallback) =>
        Enum.TryParse<StorageStatus>(value, true, out var parsed) ? parsed : fallback;

    private static string StatusName(StorageStatus status) => Display.Storage(status);

    private static ShelfDto ToShelf(Shelf shelf, int fileCount) => new(
        shelf.Id, shelf.Code, shelf.Name, shelf.Barcode, StatusName(shelf.Status),
        shelf.Capacity, shelf.Occupied, shelf.PositionOrder, fileCount);

    private static StorageUnitDto ToUnit(StorageUnit unit, IDictionary<int, int> shelfFileCounts) => new(
        unit.Id, unit.Code, unit.Name, unit.Type, unit.Barcode, StatusName(unit.Status),
        unit.X, unit.Y, unit.Width, unit.Height,
        unit.Shelves.OrderBy(s => s.PositionOrder)
            .Select(s => ToShelf(s, shelfFileCounts.TryGetValue(s.Id, out var n) ? n : 0))
            .ToArray());

    private static RoomDto ToRoom(
        Room room,
        IDictionary<int, int> shelfFileCounts,
        IReadOnlyDictionary<int, StorageUnitDto> unitDtos) => new(
        room.Id, room.Code, room.Name, room.Building, room.Floor, room.Occupancy, room.Capacity,
        room.Status.ToString(),
        room.Sections.Select(s => new SectionDto(
            s.Id, s.RoomId, s.Code, s.Name, StatusName(s.Status),
            room.StorageUnits
                .Where(u => u.SectionId == s.Id)
                .Select(u => unitDtos[u.Id])
                .ToArray()))
        .ToArray(),
        room.StorageUnits.Select(u => unitDtos[u.Id]).ToArray());

    /// <summary>
    /// Builds the whole tree in a few queries. Loading it eagerly per endpoint
    /// would mean a four-table join on every list call.
    /// </summary>
    private async Task<RoomDto[]> LoadRoomsAsync(CancellationToken ct)
    {
        var rooms = await db.Rooms
            .Include(r => r.Sections)
            .Include(r => r.StorageUnits).ThenInclude(u => u.Shelves)
            .AsSplitQuery()
            .OrderBy(r => r.Code)
            .ToListAsync(ct);

        var shelfIds = rooms.SelectMany(r => r.StorageUnits).SelectMany(u => u.Shelves).Select(s => s.Id);
        var counts = await db.Files
            .Where(f => f.ShelfId != null && shelfIds.Contains(f.ShelfId!.Value))
            .GroupBy(f => f.ShelfId!.Value)
            .Select(g => new { ShelfId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ShelfId, x => x.Count, ct);

        var unitDtos = rooms
            .SelectMany(r => r.StorageUnits)
            .ToDictionary(u => u.Id, u => ToUnit(u, counts));

        return rooms.Select(r => ToRoom(r, counts, unitDtos)).ToArray();
    }

    public async Task<Result<RoomDto[]>> RoomsAsync(CancellationToken ct = default) =>
        Result<RoomDto[]>.Ok(await LoadRoomsAsync(ct));

    public async Task<RoomDto?> RoomAsync(int id, CancellationToken ct = default)
    {
        var all = await LoadRoomsAsync(ct);
        return all.FirstOrDefault(r => r.Id == id);
    }

    public async Task<AreaDto[]> AreasAsync(CancellationToken ct = default) =>
        (await db.Areas.AsNoTracking().OrderBy(a => a.Name).ToListAsync(ct))
            .Select(a => new AreaDto(a.Id, a.Name, a.Pincode, a.Active))
            .ToArray();

    public async Task<Result<SectionDto>> AddSectionAsync(int roomId, SectionInput input, CancellationToken ct)
    {
        var name = input.Name?.Trim() ?? string.Empty;
        if (name.Length == 0) return Result<SectionDto>.Fail("Section name is required.", "name");

        var room = await db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId, ct);
        if (room is null) return Result<SectionDto>.Fail("Room not found.", "roomId");

        var clash = await db.Sections.AnyAsync(
            s => s.RoomId == roomId && s.Name.ToLower() == name.ToLower(), ct);
        if (clash) return Result<SectionDto>.Fail($"Section \"{name}\" already exists in {room.Code}.", "name");

        var section = new Section
        {
            RoomId = roomId,
            Name = name,
            Code = $"SEC-{name.ToUpperInvariant()}",
            Status = ParseStatus(input.Status, StorageStatus.Active),
        };

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        db.Sections.Add(section);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Create, "Section", section.Id.ToString(),
            "-", $"{room.Code} / {section.Code}",
            $"Section {section.Name} added to {room.Code}");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await audit.AnnounceAsync(RealtimeChannels.Locations, "section.created", section.Id.ToString(),
            $"Section {section.Name} added to {room.Code}");

        return Result<SectionDto>.Ok(new SectionDto(section.Id, section.RoomId, section.Code,
            section.Name, StatusName(section.Status), []));
    }

    public async Task<Result<SectionDto>> UpdateSectionAsync(int id, SectionInput input, CancellationToken ct)
    {
        var section = await db.Sections.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (section is null) return Result<SectionDto>.Fail("Section not found.", "id");

        var name = input.Name?.Trim() ?? section.Name;
        var clash = await db.Sections.AnyAsync(
            s => s.RoomId == section.RoomId && s.Id != id && s.Name.ToLower() == name.ToLower(), ct);
        if (clash) return Result<SectionDto>.Fail($"Section \"{name}\" already exists here.", "name");

        var nextStatus = input.Status is null ? section.Status : ParseStatus(input.Status, section.Status);

        // Legacy guard: a section may not go inactive while it still holds
        // active almirahs, because their files would lose a resolvable parent.
        if (nextStatus != StorageStatus.Active && section.Status == StorageStatus.Active)
        {
            var activeUnits = await db.StorageUnits.CountAsync(
                u => u.SectionId == id && u.Status == StorageStatus.Active, ct);
            if (activeUnits > 0)
            {
                return Result<SectionDto>.Fail(
                    $"Deactivate or remove {activeUnits} active almirah(s) in this section first.", "status");
            }
        }

        var before = $"{section.Code} / {StatusName(section.Status)}";
        section.Name = name;
        section.Code = $"SEC-{name.ToUpperInvariant()}";
        section.Status = nextStatus;
        section.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Update, "Section", id.ToString(),
            before, $"{section.Code} / {StatusName(section.Status)}",
            $"Section {section.Name} updated");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "section.updated", id.ToString(),
            $"Section {section.Name} updated");

        return Result<SectionDto>.Ok(new SectionDto(section.Id, section.RoomId, section.Code,
            section.Name, StatusName(section.Status), []));
    }

    public async Task<Result<bool>> DeleteSectionAsync(int id, CancellationToken ct)
    {
        var section = await db.Sections.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (section is null) return Result<bool>.Fail("Section not found.", "id");

        var units = await db.StorageUnits.CountAsync(u => u.SectionId == id, ct);
        if (units > 0) return Result<bool>.Fail($"Remove the {units} almirah(s) in {section.Name} first.", "id");

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        db.Sections.Remove(section);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Delete, "Section", id.ToString(),
            section.Code, "deleted", $"Section {section.Name} removed");
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        await audit.AnnounceAsync(RealtimeChannels.Locations, "section.deleted", id.ToString(),
            $"Section {section.Name} removed");
        return Result<bool>.Ok(true);
    }

    public async Task<Result<StorageUnitDto>> AddAlmirahAsync(int sectionId, AlmirahInput input, CancellationToken ct)
    {
        var section = await db.Sections.FirstOrDefaultAsync(s => s.Id == sectionId, ct);
        if (section is null) return Result<StorageUnitDto>.Fail("Section not found.", "sectionId");

        var code = input.Code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (code.Length == 0) return Result<StorageUnitDto>.Fail("Almirah code is required.", "code");

        var clash = await db.StorageUnits.AnyAsync(u => u.RoomId == section.RoomId && u.Code == code, ct);
        if (clash) return Result<StorageUnitDto>.Fail($"Almirah code {code} is already used.", "code");

        var barcode = string.IsNullOrWhiteSpace(input.Barcode)
            ? code.Replace("-", string.Empty)
            : input.Barcode.Trim().ToUpperInvariant();
        var barcodeClash = await db.StorageUnits.AnyAsync(u => u.Barcode == barcode, ct);
        if (barcodeClash) return Result<StorageUnitDto>.Fail($"Almirah barcode {barcode} is already used.", "barcode");

        var unit = new StorageUnit
        {
            RoomId = section.RoomId,
            SectionId = sectionId,
            Code = code,
            Name = string.IsNullOrWhiteSpace(input.Name) ? code : input.Name.Trim(),
            Type = string.IsNullOrWhiteSpace(input.Type) ? "Almirah" : input.Type,
            Barcode = barcode,
            Status = StorageStatus.Active,
            X = input.X, Y = input.Y, Width = input.Width, Height = input.Height,
        };

        db.StorageUnits.Add(unit);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Create, "StorageUnit", unit.Id.ToString(),
            "-", $"{section.Code} / {unit.Code}",
            $"Almirah {unit.Code} added to {section.Name}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "almirah.created", unit.Id.ToString(),
            $"Almirah {unit.Code} added");

        return Result<StorageUnitDto>.Ok(ToUnit(unit, new Dictionary<int, int>()));
    }

    public async Task<Result<StorageUnitDto>> UpdateAlmirahAsync(int id, AlmirahInput input, CancellationToken ct)
    {
        var unit = await db.StorageUnits.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (unit is null) return Result<StorageUnitDto>.Fail("Almirah not found.", "id");

        var code = input.Code?.Trim().ToUpperInvariant() ?? unit.Code;
        if (code != unit.Code)
        {
            var clash = await db.StorageUnits.AnyAsync(
                u => u.RoomId == unit.RoomId && u.Id != id && u.Code == code, ct);
            if (clash) return Result<StorageUnitDto>.Fail($"Almirah code {code} is already used.", "code");
        }

        var barcode = input.Barcode?.Trim().ToUpperInvariant() ?? unit.Barcode;
        if (barcode != unit.Barcode)
        {
            var barcodeClash = await db.StorageUnits.AnyAsync(u => u.Id != id && u.Barcode == barcode, ct);
            if (barcodeClash) return Result<StorageUnitDto>.Fail($"Almirah barcode {barcode} is already used.", "barcode");
        }

        var before = $"{unit.Code} / {unit.Barcode}";
        unit.Code = code;
        unit.Barcode = barcode;
        unit.Name = string.IsNullOrWhiteSpace(input.Name) ? unit.Name : input.Name.Trim();
        unit.X = input.X; unit.Y = input.Y; unit.Width = input.Width; unit.Height = input.Height;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Update, "StorageUnit", id.ToString(),
            before, $"{unit.Code} / {unit.Barcode}", $"Almirah {unit.Code} updated");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "almirah.updated", id.ToString(),
            $"Almirah {unit.Code} updated");

        var counts = await db.Files.Where(f => f.AlmirahId == id)
            .GroupBy(f => f.ShelfId!.Value).Select(g => new { K = g.Key, C = g.Count() })
            .ToDictionaryAsync(x => x.K, x => x.C, ct);
        return Result<StorageUnitDto>.Ok(ToUnit(unit, counts));
    }

    public async Task<Result<bool>> DeleteAlmirahAsync(int id, CancellationToken ct)
    {
        var unit = await db.StorageUnits.Include(u => u.Shelves).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (unit is null) return Result<bool>.Fail("Almirah not found.", "id");

        var fileCount = await db.Files.CountAsync(f => f.AlmirahId == id, ct);
        if (fileCount > 0) return Result<bool>.Fail($"{fileCount} file(s) still reference this almirah.", "id");
        if (unit.Shelves.Count > 0) return Result<bool>.Fail($"Remove the {unit.Shelves.Count} shelf label(s) first.", "id");

        db.StorageUnits.Remove(unit);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Delete, "StorageUnit", id.ToString(),
            $"{unit.Code} / {StatusName(unit.Status)}", "deleted", $"Almirah {unit.Code} removed");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "almirah.deleted", id.ToString(),
            $"Almirah {unit.Code} removed");
        return Result<bool>.Ok(true);
    }

    public async Task<Result<ShelfDto>> AddShelfAsync(int almirahId, ShelfInput input, CancellationToken ct)
    {
        var unit = await db.StorageUnits.Include(u => u.Shelves).FirstOrDefaultAsync(u => u.Id == almirahId, ct);
        if (unit is null) return Result<ShelfDto>.Fail("Almirah not found.", "almirahId");

        var code = input.Code?.Trim().ToUpperInvariant() ?? string.Empty;
        var barcode = input.Barcode?.Trim().ToUpperInvariant() ?? string.Empty;
        if (code.Length == 0) return Result<ShelfDto>.Fail("Shelf code is required.", "code");
        if (barcode.Length == 0) return Result<ShelfDto>.Fail("Shelf barcode is required.", "barcode");

        var barcodeClash = await db.Shelves.AnyAsync(s => s.Barcode == barcode, ct);
        if (barcodeClash) return Result<ShelfDto>.Fail($"Shelf barcode {barcode} is already registered.", "barcode");

        var codeClash = unit.Shelves.Any(s => s.Code == code);
        if (codeClash) return Result<ShelfDto>.Fail($"Shelf code {code} already exists in {unit.Code}.", "code");

        var shelf = new Shelf
        {
            StorageUnitId = almirahId,
            Code = code,
            Name = string.IsNullOrWhiteSpace(input.Name) ? code : input.Name.Trim(),
            Barcode = barcode,
            Status = ParseStatus(input.Status, StorageStatus.Active),
            Capacity = Math.Max(1, input.Capacity),
            PositionOrder = unit.Shelves.Count,
        };

        db.Shelves.Add(shelf);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Create, "Shelf", shelf.Id.ToString(),
            "-", $"{unit.Code} / {shelf.Code}",
            $"Shelf {shelf.Code} added with barcode {shelf.Barcode}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "shelf.created", shelf.Id.ToString(),
            $"Shelf {shelf.Code} added");

        return Result<ShelfDto>.Ok(ToShelf(shelf, 0));
    }

    public async Task<Result<ShelfDto>> UpdateShelfAsync(int id, ShelfInput input, CancellationToken ct)
    {
        var shelf = await db.Shelves.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (shelf is null) return Result<ShelfDto>.Fail("Shelf not found.", "id");

        var barcode = input.Barcode?.Trim().ToUpperInvariant() ?? shelf.Barcode;
        if (barcode != shelf.Barcode)
        {
            var clash = await db.Shelves.AnyAsync(s => s.Id != id && s.Barcode == barcode, ct);
            if (clash) return Result<ShelfDto>.Fail($"Shelf barcode {barcode} is already registered.", "barcode");
        }

        var before = $"{shelf.Code} / {StatusName(shelf.Status)} / {shelf.Barcode}";
        shelf.Code = input.Code?.Trim().ToUpperInvariant() ?? shelf.Code;
        shelf.Name = string.IsNullOrWhiteSpace(input.Name) ? shelf.Name : input.Name.Trim();
        shelf.Barcode = barcode;
        if (input.Status is not null) shelf.Status = ParseStatus(input.Status, shelf.Status);
        if (input.Capacity > 0) shelf.Capacity = input.Capacity;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync(db, AuditAction.Update, "Shelf", id.ToString(),
            before, $"{shelf.Code} / {StatusName(shelf.Status)} / {shelf.Barcode}",
            $"Shelf {shelf.Code} updated");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "shelf.updated", id.ToString(),
            $"Shelf {shelf.Code} updated");

        var fileCount = await db.Files.CountAsync(f => f.ShelfId == id, ct);
        return Result<ShelfDto>.Ok(ToShelf(shelf, fileCount));
    }

    public async Task<Result<bool>> DeleteShelfAsync(int id, CancellationToken ct)
    {
        var shelf = await db.Shelves.Include(s => s.StorageUnit!).ThenInclude(u => u.Shelves)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
        if (shelf is null) return Result<bool>.Fail("Shelf not found.", "id");

        var fileCount = await db.Files.CountAsync(f => f.ShelfId == id, ct);
        if (fileCount > 0) return Result<bool>.Fail($"{fileCount} file(s) sit on this shelf.", "id");

        var unit = shelf.StorageUnit!;
        db.Shelves.Remove(shelf);
        await db.SaveChangesAsync(ct);
        // Keep the display order contiguous after a removal.
        var remaining = await db.Shelves.Where(s => s.StorageUnitId == unit.Id)
            .OrderBy(s => s.PositionOrder).ToListAsync(ct);
        for (var i = 0; i < remaining.Count; i++) remaining[i].PositionOrder = i;
        await db.SaveChangesAsync(ct);

        await audit.LogAsync(db, AuditAction.Delete, "Shelf", id.ToString(),
            $"{shelf.Code} / {shelf.Barcode}", "deleted", $"Shelf {shelf.Code} removed");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "shelf.deleted", id.ToString(),
            $"Shelf {shelf.Code} removed");
        return Result<bool>.Ok(true);
    }

    public async Task<Result<LayoutRevisionDto>> SaveLayoutAsync(int roomId, LayoutSaveInput input, CancellationToken ct)
    {
        var room = await db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId, ct);
        if (room is null) return Result<LayoutRevisionDto>.Fail("Room not found.", "roomId");

        var revision = await db.LayoutRevisions.CountAsync(r => r.RoomId == roomId, ct) + 1;
        var entry = new LayoutRevision
        {
            RoomId = roomId,
            Revision = revision,
            Note = string.IsNullOrWhiteSpace(input.Note) ? "Layout saved" : input.Note.Trim(),
            At = DateTime.UtcNow,
            Actor = current.UserName,
        };

        db.LayoutRevisions.Add(entry);
        await audit.LogAsync(db, AuditAction.Update, "Room", roomId.ToString(),
            $"revision={revision - 1}", $"revision={revision}",
            $"Layout revision {revision} saved for {room.Code}");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Locations, "layout.saved", roomId.ToString(),
            $"{room.Code} layout revision {revision}");

        return Result<LayoutRevisionDto>.Ok(
            new LayoutRevisionDto(entry.Revision, entry.Note, entry.At, entry.Actor));
    }

    public async Task<LayoutRevisionDto[]> LayoutRevisionsAsync(int roomId, CancellationToken ct) =>
        (await db.LayoutRevisions.Where(r => r.RoomId == roomId)
            .OrderByDescending(r => r.Revision).Take(50).ToListAsync(ct))
        .Select(r => new LayoutRevisionDto(r.Revision, r.Note, r.At, r.Actor))
        .ToArray();
}