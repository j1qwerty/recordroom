# Data model

## Core entities

### Organization

`Organization(Id, Code, Name, Status, CreatedAt)`

### Site

`Site(Id, OrganizationId, Code, Name, Address, Status)`

### Building

`Building(Id, SiteId, Code, Name, Status)`

### Floor

`Floor(Id, BuildingId, Code, Name, Level, Status)`

### Room

`Room(Id, FloorId, Code, Name, Width, Height, Status, LayoutVersion)`

### StorageUnit

`StorageUnit(Id, RoomId, Code, Name, Type, Status, X, Y, Width, Height)`

### Shelf

`Shelf(Id, StorageUnitId, Code, Name, Capacity, OccupiedEstimate, PositionOrder, Status)`

### ShelfSection

Optional finer subdivision for very large shelves.

### RecordFile

`RecordFile(Id, RFId, FileNumber, Subject, DepartmentId, Year, Status, CodalLife, CreatedAt, Description)`

`RFId` is unique and immutable.

### FileBarcode

`FileBarcode(Id, RecordFileId, BarcodeValue, Symbology, LabelRole, Active, ReplacedById, CreatedAt)`

### PhysicalFileLocation

`PhysicalFileLocation(Id, RecordFileId, ShelfId, ApproxPosition, VerifiedAt, VerifiedBy, IsCurrent)`

### LocationHistory

`LocationHistory(Id, RecordFileId, FromShelfId, ToShelfId, EventType, ActorId, Timestamp, Notes)`

### IssueTransaction

`IssueTransaction(Id, RecordFileId, RequestedBy, IssuedTo, IssuedAt, DueAt, ReturnedAt, Status)`

### MovementTransaction

`MovementTransaction(Id, RecordFileId, FromLocation, ToLocation, Reason, ActorId, Timestamp)`

### DigitalDocument

`DigitalDocument(Id, RecordFileId, StorageKey, Sha256, MimeType, PageCount, Status, CreatedAt)`

### DocumentVersion

`DocumentVersion(Id, DigitalDocumentId, VersionNo, StorageKey, Sha256, CreatedAt, CreatedBy)`

### OCRDocument / OCRPage

Store processing state, page text, confidence and error information. The final search index is an implementation detail.

### User / Role / Permission / Department / Designation

Identity and authorization entities are separate so that a person's role and department scope can change without rewriting historical events.

### AuditLog

Append-only record of security-sensitive and business-critical operations.

## Critical constraints

- Unique `RFId`.
- Unique active barcode payload.
- Foreign keys across the hierarchy.
- A record should have at most one current physical location.
- Issue and return transitions must be transactional.
- Audit records for identity creation, barcode replacement, location change, issue, return and document-access events.
