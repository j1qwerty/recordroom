namespace RecordRoom.Api.Domain;

/// <summary>Identity. Separate from <see cref="Employee"/> so a role change does not rewrite history.</summary>
public class AppUser
{
    public int Id { get; set; }
    public required string UserName { get; set; }
    public required string DisplayName { get; set; }
    public required string PasswordHash { get; set; }
    public required string PasswordSalt { get; set; }
    public Role Role { get; set; } = Role.Operator;
    public string? EmployeeCode { get; set; }
    public bool Active { get; set; } = true;
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;

    public Employee? Employee { get; set; }
}

/// <summary>
/// The legacy employee master. <see cref="EmployeeCode"/> drives the per-employee
/// digitization folder path, so it is unique and treated as immutable once batches exist.
/// </summary>
public class Employee
{
    public int Id { get; set; }
    public required string EmployeeCode { get; set; }
    public string Prefix { get; set; } = "LK";
    public required string Name { get; set; }
    public string FatherName { get; set; } = string.Empty;
    public string Gender { get; set; } = "Male";
    public string? DateOfBirth { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Pan { get; set; } = string.Empty;
    public string Aadhaar { get; set; } = string.Empty;
    public Role Role { get; set; } = Role.Employee;
    public string GradePay { get; set; } = string.Empty;
    public string PayScale { get; set; } = string.Empty;
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;

    public List<AppUser> Users { get; set; } = [];
    public List<DigitizationBatch> Batches { get; set; } = [];
}

public class LoginHistoryEntry
{
    public long Id { get; set; }
    public required string UserName { get; set; }
    public required string Role { get; set; }
    public required string Channel { get; set; }
    public required string Ip { get; set; }
    public string UserAgent { get; set; } = string.Empty;
    public DateTime LoginAt { get; set; } = DateTime.UtcNow;
    public DateTime? LogoutAt { get; set; }
    public required LoginOutcome Outcome { get; set; }
    public string Detail { get; set; } = string.Empty;
}