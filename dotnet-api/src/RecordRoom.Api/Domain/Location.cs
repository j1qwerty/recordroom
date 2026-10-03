namespace RecordRoom.Api.Domain;

/// <summary>Room → section → almirah → shelf, matching legacy room/section/almirah/shelf tables.</summary>
public class Room
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public int Occupancy { get; set; }
    public int Capacity { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Operational;

    public List<Section> Sections { get; set; } = [];
    public List<StorageUnit> StorageUnits { get; set; } = [];
}

public class Section
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public StorageStatus Status { get; set; } = StorageStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Room? Room { get; set; }
    public List<StorageUnit> StorageUnits { get; set; } = [];
}

public class StorageUnit
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int SectionId { get; set; }
    public required string Barcode { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string Type { get; set; } = "Almirah";
    public StorageStatus Status { get; set; } = StorageStatus.Active;
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }

    public Section? Section { get; set; }
    public Room? Room { get; set; }
    public List<Shelf> Shelves { get; set; } = [];
}

public class Shelf
{
    public int Id { get; set; }
    public int StorageUnitId { get; set; }
    /// <summary>Physical label barcode. A file may only reference a shelf that exists and is Active.</summary>
    public required string Barcode { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public StorageStatus Status { get; set; } = StorageStatus.Active;
    public int Capacity { get; set; } = 80;
    public int Occupied { get; set; }
    public int PositionOrder { get; set; }

    public StorageUnit? StorageUnit { get; set; }
    public List<RecordFile> Files { get; set; } = [];
}

public class Area
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Pincode { get; set; }
    public bool Active { get; set; } = true;
}

public class LayoutRevision
{
    public long Id { get; set; }
    public int RoomId { get; set; }
    public int Revision { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime At { get; set; } = DateTime.UtcNow;
    public required string Actor { get; set; }

    public Room? Room { get; set; }
}