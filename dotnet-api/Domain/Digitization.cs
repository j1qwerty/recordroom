namespace RecordRoom.Api.Domain;

public class DigitizationBatch
{
    public long Id { get; set; }
    public required string Code { get; set; }
    public required string EmployeeCode { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public DigitizationFolder Folder { get; set; }
    public BatchStatus Status { get; set; } = BatchStatus.InProgress;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }

    public Employee? Employee { get; set; }
    public List<DigitizationPage> Pages { get; set; } = [];
}

/// <summary>
/// A scanned page. Keyed by barcode + page number; a re-scan stores the next
/// <see cref="Version"/> rather than overwriting a possibly-approved page.
/// </summary>
public class DigitizationPage
{
    public long Id { get; set; }
    public long BatchId { get; set; }
    public required string Barcode { get; set; }
    public required string FileName { get; set; }
    public int PageNo { get; set; }
    public int Version { get; set; } = 1;
    public PageStatus Status { get; set; } = PageStatus.PendingReview;
    public string Note { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string UploadedBy { get; set; } = string.Empty;
    public bool Bulk { get; set; }
    public string? StorageKey { get; set; }
    public string? ContentType { get; set; }
    public long? SizeBytes { get; set; }
    public string? Sha256 { get; set; }
    /// <summary>Pages in the stored PDF; null for images or an unreadable page tree.</summary>
    public int? PageCount { get; set; }
    /// <summary>1-based page within a multi-page PDF that this row represents.</summary>
    public int? PageIndex { get; set; }

    public DigitizationBatch? Batch { get; set; }
    public RecordFile? RecordFile { get; set; }
}

/// <summary>Legacy <c>upload_map</c> — scanned maps and file copies.</summary>
public class MapUpload
{
    public long Id { get; set; }
    public required string Barcode { get; set; }
    public required string FileName { get; set; }
    public int PageNo { get; set; }
    public int Version { get; set; } = 1;
    public PageStatus Status { get; set; } = PageStatus.PendingReview;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string UploadedBy { get; set; } = string.Empty;
    public int SizeKb { get; set; }
    public string? StorageKey { get; set; }
    public string? ContentType { get; set; }
    public long? SizeBytes { get; set; }
    public string? Sha256 { get; set; }
    /// <summary>Pages in the stored PDF; null for images or an unreadable page tree.</summary>
    public int? PageCount { get; set; }
    /// <summary>1-based page within a multi-page PDF that this row represents.</summary>
    public int? PageIndex { get; set; }

    public RecordFile? RecordFile { get; set; }
}

public class BulkImportJob
{
    public long Id { get; set; }
    public required string FileName { get; set; }
    public string Folder { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public string Status { get; set; } = "Validated";
    public int Accepted { get; set; }
    public int Rejected { get; set; }
    public int Duplicates { get; set; }

    public List<BulkImportRow> Rows { get; set; } = [];
}

public class BulkImportRow
{
    public long Id { get; set; }
    public long JobId { get; set; }
    public int RowNo { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string ShelfBarcode { get; set; } = string.Empty;
    public required string Result { get; set; }
    public string Detail { get; set; } = string.Empty;

    public BulkImportJob? Job { get; set; }
}

public class BarcodeJob
{
    public long Id { get; set; }
    public required BarcodeSubject Subject { get; set; }
    public required string TargetId { get; set; }
    public required string Label { get; set; }
    public required string Value { get; set; }
    public int Quantity { get; set; }
    public string RequestedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Queued";
}

public class Inquiry
{
    public long Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string Department { get; set; } = string.Empty;
    public required string Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = "record-room-frontend";
}

public class MediaLink
{
    public long Id { get; set; }
    public required string Title { get; set; }
    public required string Url { get; set; }
    public required string Alt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = "record-room-frontend";
}