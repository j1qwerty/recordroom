namespace RecordRoom.Api.Domain;

/// <summary>
/// Physical file master. <see cref="Barcode"/> is the permanent identity and is
/// unique and immutable; location is separate and changes without touching it.
/// </summary>
public class RecordFile
{
    public int Id { get; set; }
    public required string Barcode { get; set; }
    public required string FileNumber { get; set; }
    public required string Subject { get; set; }
    public string Department { get; set; } = string.Empty;
    public int Year { get; set; }
    public FileKind FileKind { get; set; } = FileKind.File;
    public string RecordKind { get; set; } = "File";
    public string DocumentSize { get; set; } = "Other";
    public string? EOfficeReference { get; set; }
    public RecordStatus Status { get; set; } = RecordStatus.Available;

    /// <summary>Derived display string: room / section / almirah / shelf codes.</summary>
    public string LocationDisplay { get; set; } = string.Empty;

    public int? RoomId { get; set; }
    public int? SectionId { get; set; }
    public int? AlmirahId { get; set; }
    public int? ShelfId { get; set; }
    public string ShelfBarcode { get; set; } = string.Empty;
    public int ApproxPosition { get; set; }

    public string Pincode { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string PropertyNo { get; set; } = string.Empty;
    public string PropertyArea { get; set; } = string.Empty;
    public string Dealer { get; set; } = string.Empty;
    public string CodalLife { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime LastMovementAt { get; set; } = DateTime.UtcNow;

    public string? Holder { get; set; }
    public string? HolderEmployeeCode { get; set; }
    public string Description { get; set; } = string.Empty;

    public Shelf? Shelf { get; set; }
    public List<IssueLine> IssueLines { get; set; } = [];
    public List<DigitizationPage> Pages { get; set; } = [];
    public List<MapUpload> Maps { get; set; } = [];
}

/// <summary>
/// One receipt can carry many files. Legacy <c>issue_file_tbl</c> was one row per
/// file, which cannot express a part return; this shape can.
/// </summary>
public class IssueReceipt
{
    public long Id { get; set; }
    public required string ReceiptNumber { get; set; }
    public bool BorrowerIsEmployee { get; set; }
    public required string BorrowerName { get; set; }
    public required string BorrowerEmployeeCode { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime DueAt { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public IssueStatus Status { get; set; } = IssueStatus.Issued;
    public string Remark { get; set; } = string.Empty;
    public string IssuedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<IssueLine> Lines { get; set; } = [];
}

public class IssueLine
{
    public long Id { get; set; }
    public long IssueReceiptId { get; set; }
    public int RecordFileId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public DateTime? ReturnedAt { get; set; }
    public string ReturnCondition { get; set; } = string.Empty;

    public IssueReceipt? IssueReceipt { get; set; }
    public RecordFile? RecordFile { get; set; }
}

public class MovementEvent
{
    public long Id { get; set; }
    public MovementKind Kind { get; set; }
    public int RecordFileId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Actor { get; set; } = string.Empty;
    public DateTime At { get; set; } = DateTime.UtcNow;
    public string Detail { get; set; } = string.Empty;
    public long? IssueReceiptId { get; set; }
}

public class AuditEntry
{
    public long Id { get; set; }
    public AuditAction Action { get; set; }
    public required string Entity { get; set; }
    public required string EntityId { get; set; }
    public required string Actor { get; set; }
    public required string Role { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
    public required string Ip { get; set; }
    public string Before { get; set; } = string.Empty;
    public string After { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
}