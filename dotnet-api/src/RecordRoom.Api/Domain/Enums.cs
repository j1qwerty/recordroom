namespace RecordRoom.Api.Domain;

/// <summary>Enums shared across the domain. Values map 1:1 to the legacy schema.</summary>
public enum Role
{
    Admin = 0,
    Supervisor = 1,
    Operator = 2,
    Employee = 3,
}

public enum RecordStatus
{
    Available = 0,
    Issued = 1,
    UnderDigitization = 2,
    Missing = 3,
    Archived = 4,
}

public enum FileKind
{
    Letter = 0,
    File = 1,
    Register = 2,
    Map = 3,
    Drawing = 4,
    Report = 5,
}

public enum StorageStatus
{
    Active = 0,
    Maintenance = 1,
    Inactive = 2,
    Decommissioned = 3,
}

public enum RoomStatus
{
    Operational = 0,
    Restricted = 1,
    Maintenance = 2,
}

public enum IssueStatus
{
    Issued = 0,
    Returned = 1,
    Overdue = 2,
    PartiallyReturned = 3,
}

public enum MovementKind
{
    Issue = 0,
    Return = 1,
    LocationChange = 2,
    Digitization = 3,
    FileCreated = 4,
    Relocation = 5,
}

public enum AuditAction
{
    Login = 0,
    Logout = 1,
    Create = 2,
    Update = 3,
    Delete = 4,
    Issue = 5,
    Return = 6,
    Relocate = 7,
    Approve = 8,
    Reject = 9,
    Export = 10,
}

public enum PageStatus
{
    PendingReview = 0,
    Approved = 1,
    Rejected = 2,
    Duplicate = 3,
    Active = 4,
}

public enum BatchStatus
{
    InProgress = 0,
    Submitted = 1,
    Approved = 2,
    PartiallyApproved = 3,
}

public enum DigitizationFolder
{
    ServiceBook = 0,
    LeaveReport = 1,
    Sr = 2,
    Apar = 3,
}

public enum EmployeeStatus
{
    Active = 0,
    Inactive = 1,
    Retired = 2,
}

public enum BarcodeSubject
{
    File = 0,
    Shelf = 1,
    Almirah = 2,
    Section = 3,
    Room = 4,
    Area = 5,
}

public enum LoginOutcome
{
    Success = 0,
    Failed = 1,
    SignedOut = 2,
}