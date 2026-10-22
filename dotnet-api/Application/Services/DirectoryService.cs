using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Application.Services;

// ================================================================== employees

public interface IEmployeesService
{
    Task<PagedResult<EmployeeDto>> ListAsync(string? search, string? department, string? status, int page, int pageSize, CancellationToken ct = default);
    Task<EmployeeDto?> GetAsync(int id, CancellationToken ct = default);
    Task<string[]> DepartmentsAsync(CancellationToken ct = default);
    Task<Result<EmployeeDto>> CreateAsync(EmployeeInput input, CancellationToken ct = default);
    Task<Result<EmployeeDto>> UpdateAsync(int id, EmployeeInput input, CancellationToken ct = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken ct = default);
}

public sealed class EmployeesService(AppDbContext db, IAuditWriter audit) : IEmployeesService
{
    private static EmployeeDto ToDto(Employee e) => new(
        e.Id, e.EmployeeCode, e.Prefix, e.Name, e.FatherName, e.Gender, e.DateOfBirth,
        e.Department, e.Designation, e.Email, e.Mobile, e.Pan, e.Aadhaar,
        Display.Role(e.Role), e.GradePay, e.PayScale, Display.Employee(e.Status), e.CreatedAt, e.ModifiedAt);

    public async Task<PagedResult<EmployeeDto>> ListAsync(
        string? search, string? department, string? status, int page, int pageSize, CancellationToken ct)
    {
        var query = db.Employees.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(e =>
                e.EmployeeCode.ToLower().Contains(needle)
                || e.Name.ToLower().Contains(needle)
                || e.Mobile.Contains(needle)
                || e.Designation.ToLower().Contains(needle)
                || e.Email.ToLower().Contains(needle));
        }
        if (!string.IsNullOrWhiteSpace(department) && department != "All")
            query = query.Where(e => e.Department == department);
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            var parsed = Enum.TryParse<EmployeeStatus>(status, true, out var s) ? s : (EmployeeStatus?)null;
            if (parsed is not null)
            {
                var target = parsed.Value;
                query = query.Where(e => e.Status == target);
            }
        }

        var total = await query.CountAsync(ct);
        var p = Math.Max(1, page);
        var size = Math.Clamp(pageSize, 1, 200);
        var rows = await query.OrderBy(e => e.Name).Skip((p - 1) * size).Take(size).ToListAsync(ct);
        return new PagedResult<EmployeeDto>(rows.Select(ToDto).ToArray(), total, p, size, total);
    }

    public async Task<EmployeeDto?> GetAsync(int id, CancellationToken ct)
    {
        var e = await db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return e is null ? null : ToDto(e);
    }

    public Task<string[]> DepartmentsAsync(CancellationToken ct) =>
        db.Employees.AsNoTracking().Select(e => e.Department).Distinct().OrderBy(d => d).ToArrayAsync(ct);

    private static (string code, Role role, EmployeeStatus status) Normalise(EmployeeInput input)
    {
        var code = input.EmployeeCode?.Trim().ToUpperInvariant() ?? string.Empty;
        var role = Enum.TryParse<Role>(input.Role, true, out var r) ? r : Role.Employee;
        var status = Enum.TryParse<EmployeeStatus>(input.Status, true, out var s) ? s : EmployeeStatus.Active;
        return (code, role, status);
    }

    public async Task<Result<EmployeeDto>> CreateAsync(EmployeeInput input, CancellationToken ct)
    {
        var (code, role, status) = Normalise(input);
        if (code.Length == 0) return Result<EmployeeDto>.Fail("Employee code is required.", "employeeCode");
        if (await db.Employees.AnyAsync(e => e.EmployeeCode == code, ct))
            return Result<EmployeeDto>.Fail($"{code} is already registered.", "employeeCode");
        if (string.IsNullOrWhiteSpace(input.Name))
            return Result<EmployeeDto>.Fail("Employee name is required.", "name");
        if (!string.IsNullOrWhiteSpace(input.Mobile) && !Regex.IsMatch(input.Mobile.Trim(), @"^\d{10}$"))
            return Result<EmployeeDto>.Fail("Mobile must be 10 digits.", "mobile");

        var now = DateTime.UtcNow;
        var employee = new Employee
        {
            EmployeeCode = code,
            Prefix = input.Prefix ?? "LK",
            Name = input.Name!.Trim(),
            FatherName = input.FatherName ?? string.Empty,
            Gender = input.Gender ?? "Male",
            DateOfBirth = input.DateOfBirth,
            Department = input.Department ?? string.Empty,
            Designation = input.Designation ?? string.Empty,
            Email = input.Email ?? string.Empty,
            Mobile = input.Mobile ?? string.Empty,
            Pan = input.Pan ?? string.Empty,
            Aadhaar = input.Aadhaar ?? string.Empty,
            Role = role,
            GradePay = input.GradePay ?? string.Empty,
            PayScale = input.PayScale ?? string.Empty,
            Status = status,
            CreatedAt = now,
            ModifiedAt = now,
        };

        db.Employees.Add(employee);
        await audit.LogAsync(db, AuditAction.Create, "Employee", employee.Id.ToString(),
            "-", $"{code} - {employee.Name}", $"Employee {code} registered");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Digitization, "employee.created", employee.Id.ToString(),
            $"Employee {code} registered");

        return Result<EmployeeDto>.Ok(ToDto(employee));
    }

    public async Task<Result<EmployeeDto>> UpdateAsync(int id, EmployeeInput input, CancellationToken ct)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (employee is null) return Result<EmployeeDto>.Fail("Employee not found.", "id");

        var (code, role, status) = Normalise(input);
        if (code != employee.EmployeeCode &&
            await db.Employees.AnyAsync(e => e.Id != id && e.EmployeeCode == code, ct))
        {
            return Result<EmployeeDto>.Fail($"{code} is already registered.", "employeeCode");
        }
        if (!string.IsNullOrWhiteSpace(input.Mobile) && !Regex.IsMatch(input.Mobile.Trim(), @"^\d{10}$"))
            return Result<EmployeeDto>.Fail("Mobile must be 10 digits.", "mobile");

        var before = $"{employee.EmployeeCode} - {employee.Status}";
        employee.EmployeeCode = code;
        employee.Prefix = input.Prefix ?? employee.Prefix;
        employee.Name = input.Name?.Trim() ?? employee.Name;
        employee.FatherName = input.FatherName ?? employee.FatherName;
        employee.Gender = input.Gender ?? employee.Gender;
        employee.DateOfBirth = input.DateOfBirth;
        employee.Department = input.Department ?? employee.Department;
        employee.Designation = input.Designation ?? employee.Designation;
        employee.Email = input.Email ?? employee.Email;
        employee.Mobile = input.Mobile ?? employee.Mobile;
        employee.Pan = input.Pan ?? employee.Pan;
        employee.Aadhaar = input.Aadhaar ?? employee.Aadhaar;
        employee.Role = role;
        employee.GradePay = input.GradePay ?? employee.GradePay;
        employee.PayScale = input.PayScale ?? employee.PayScale;
        employee.Status = status;
        employee.ModifiedAt = DateTime.UtcNow;

        // Keep batch display names in step with the employee record.
        var batches = await db.Batches.Where(b => b.EmployeeCode == employee.EmployeeCode).ToListAsync(ct);
        foreach (var batch in batches)
        {
            batch.EmployeeName = employee.Name;
            batch.Department = employee.Department;
        }

        await audit.LogAsync(db, AuditAction.Update, "Employee", id.ToString(),
            before, $"{employee.EmployeeCode} - {employee.Status}",
            $"Employee {employee.EmployeeCode} updated");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Digitization, "employee.updated", id.ToString(),
            $"Employee {employee.EmployeeCode} updated");

        return Result<EmployeeDto>.Ok(ToDto(employee));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken ct)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (employee is null) return Result<bool>.Fail("Employee not found.", "id");

        var batches = await db.Batches.CountAsync(b => b.EmployeeCode == employee.EmployeeCode, ct);
        if (batches > 0)
        {
            return Result<bool>.Fail(
                $"{batches} digitization batch(es) reference this employee. Reassign or delete them first.", "id");
        }

        db.Employees.Remove(employee);
        await audit.LogAsync(db, AuditAction.Delete, "Employee", id.ToString(),
            $"{employee.EmployeeCode} - {employee.Name}", "deleted",
            $"Employee {employee.EmployeeCode} removed");
        await db.SaveChangesAsync(ct);
        await audit.AnnounceAsync(RealtimeChannels.Digitization, "employee.deleted", id.ToString(),
            $"Employee {employee.EmployeeCode} removed");
        return Result<bool>.Ok(true);
    }
}

// ====================================================================== users

public interface IUsersService
{
    Task<AppUser[]> ListAsync(CancellationToken ct = default);
    Task<Result<UserDto>> CreateAsync(UserInput input, string password, CancellationToken ct = default);
    Task<Result<UserDto>> UpdateAsync(int id, UserInput input, CancellationToken ct = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken ct = default);
}

public sealed class UsersService(AppDbContext db, IAuditWriter audit, ICurrentUserAccessor current) : IUsersService
{
    public async Task<AppUser[]> ListAsync(CancellationToken ct = default) =>
        (await db.Users.AsNoTracking().OrderBy(u => u.UserName).ToListAsync(ct)).ToArray();

    public async Task<Result<UserDto>> CreateAsync(UserInput input, string password, CancellationToken ct)
    {
        var userName = input.UserName?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!Regex.IsMatch(userName, @"^[a-z0-9._-]{3,32}$"))
            return Result<UserDto>.Fail("Use 3-32 characters: letters, digits, dot, dash or underscore.", "userName");
        if (await db.Users.AnyAsync(u => u.UserName == userName, ct))
            return Result<UserDto>.Fail($"{userName} already has a login.", "userName");
        if (string.IsNullOrWhiteSpace(input.DisplayName))
            return Result<UserDto>.Fail("Display name is required.", "displayName");
        if ((password ?? string.Empty).Length < 8)
            return Result<UserDto>.Fail("Password must be at least 8 characters.", "password");

        var (hash, salt) = PasswordHasher.Create(password ?? string.Empty);
        var role = Enum.TryParse<Role>(input.Role, true, out var r) ? r : Role.Employee;
        var user = new AppUser
        {
            UserName = userName,
            DisplayName = input.DisplayName.Trim(),
            Role = role,
            EmployeeCode = string.IsNullOrWhiteSpace(input.EmployeeCode) ? null : input.EmployeeCode.Trim().ToUpperInvariant(),
            Active = input.Active,
            PasswordHash = hash,
            PasswordSalt = salt,
            LastLoginAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await audit.LogAsync(db, AuditAction.Create, "AppUser", user.Id.ToString(),
            "-", $"{user.UserName} - {user.Role}", $"Login created for {user.DisplayName}");
        await db.SaveChangesAsync(ct);
        return Result<UserDto>.Ok(AuthService.ToDto(user));
    }

    public async Task<Result<UserDto>> UpdateAsync(int id, UserInput input, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return Result<UserDto>.Fail("User not found.", "id");

        var userName = input.UserName?.Trim().ToLowerInvariant() ?? user.UserName;
        if (userName != user.UserName &&
            await db.Users.AnyAsync(u => u.Id != id && u.UserName == userName, ct))
        {
            return Result<UserDto>.Fail($"{userName} already has a login.", "userName");
        }
        if (!input.Active && user.Role == Role.Admin)
        {
            var otherAdmins = await db.Users.CountAsync(u => u.Id != id && u.Active && u.Role == Role.Admin, ct);
            if (otherAdmins == 0) return Result<UserDto>.Fail("Keep at least one active administrator.", "active");
        }

        var role = Enum.TryParse<Role>(input.Role, true, out var r) ? r : user.Role;
        var before = $"{user.UserName} - {user.Role} - active={user.Active}";
        user.UserName = userName;
        user.DisplayName = input.DisplayName?.Trim() ?? user.DisplayName;
        user.Role = role;
        user.EmployeeCode = string.IsNullOrWhiteSpace(input.EmployeeCode) ? null : input.EmployeeCode.Trim().ToUpperInvariant();
        user.Active = input.Active;

        await audit.LogAsync(db, AuditAction.Update, "AppUser", id.ToString(),
            before, $"{user.UserName} - {user.Role} - active={user.Active}",
            $"Login updated for {user.DisplayName}");
        await db.SaveChangesAsync(ct);
        return Result<UserDto>.Ok(AuthService.ToDto(user));
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return Result<bool>.Fail("User not found.", "id");

        if (user.Role == Role.Admin)
        {
            var admins = await db.Users.CountAsync(u => u.Active && u.Role == Role.Admin, ct);
            if (admins <= 1) return Result<bool>.Fail("Keep at least one administrator.", "id");
        }
        if (user.Id == current.User?.Id)
            return Result<bool>.Fail("You cannot remove your own login.", "id");

        db.Users.Remove(user);
        await audit.LogAsync(db, AuditAction.Delete, "AppUser", id.ToString(),
            $"{user.UserName} - {user.Role}", "deleted", $"Login removed for {user.DisplayName}");
        await db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }
}

// ==================================================================== inquiries

public interface IContentService
{
    Task<Result<InquiryDto>> SaveInquiryAsync(InquiryInput input, CancellationToken ct = default);
    Task<InquiryDto[]> InquiriesAsync(CancellationToken ct = default);
    Task<Result<bool>> DeleteInquiryAsync(long id, CancellationToken ct = default);
    Task<Result<MediaLinkDto>> SaveMediaLinkAsync(MediaLinkInput input, CancellationToken ct = default);
    Task<MediaLinkDto[]> MediaLinksAsync(CancellationToken ct = default);
    Task<Result<bool>> DeleteMediaLinkAsync(long id, CancellationToken ct = default);
}

public sealed class ContentService(AppDbContext db, IAuditWriter audit) : IContentService
{
    /// <summary>Only http(s) may be stored; anything else is refused up front.</summary>
    private static bool IsSafeHttpUrl(string value) =>
        Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

    public async Task<Result<InquiryDto>> SaveInquiryAsync(InquiryInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
            return Result<InquiryDto>.Fail("Name is required.", "name");
        if (string.IsNullOrWhiteSpace(input.Email) || !input.Email.Contains('@'))
            return Result<InquiryDto>.Fail("Enter a valid email address.", "email");
        if ((input.Message ?? string.Empty).Trim().Length < 10)
            return Result<InquiryDto>.Fail("Add a little more detail to the message.", "message");

        var inquiry = new Inquiry
        {
            Name = input.Name!.Trim(),
            Email = input.Email!.Trim(),
            Department = input.Department?.Trim() ?? string.Empty,
            Message = input.Message!.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        db.Inquiries.Add(inquiry);
        await audit.LogAsync(db, AuditAction.Create, "Inquiry", inquiry.Id.ToString(),
            "-", inquiry.Department, $"Inquiry submitted by {inquiry.Name}");
        await db.SaveChangesAsync(ct);

        return Result<InquiryDto>.Ok(new InquiryDto(inquiry.Id, inquiry.Name, inquiry.Email,
            inquiry.Department, inquiry.Message, inquiry.CreatedAt));
    }

    public async Task<InquiryDto[]> InquiriesAsync(CancellationToken ct = default) =>
        (await db.Inquiries.AsNoTracking().OrderByDescending(i => i.CreatedAt).ToListAsync(ct))
        .Select(i => new InquiryDto(i.Id, i.Name, i.Email, i.Department, i.Message, i.CreatedAt))
        .ToArray();

    public async Task<Result<bool>> DeleteInquiryAsync(long id, CancellationToken ct)
    {
        var inquiry = await db.Inquiries.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (inquiry is null) return Result<bool>.Fail("Inquiry not found.", "id");
        db.Inquiries.Remove(inquiry);
        await audit.LogAsync(db, AuditAction.Delete, "Inquiry", id.ToString(),
            inquiry.Email, "deleted", $"Inquiry from {inquiry.Name} removed");
        await db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<MediaLinkDto>> SaveMediaLinkAsync(MediaLinkInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Title))
            return Result<MediaLinkDto>.Fail("Title is required.", "title");
        if (string.IsNullOrWhiteSpace(input.Alt))
            return Result<MediaLinkDto>.Fail("Alt text is required.", "alt");
        if (!IsSafeHttpUrl(input.Url ?? string.Empty))
            return Result<MediaLinkDto>.Fail("Only http(s) image URLs are accepted.", "url");

        var link = new MediaLink
        {
            Title = input.Title!.Trim(),
            Url = input.Url!.Trim(),
            Alt = input.Alt!.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        db.MediaLinks.Add(link);
        await audit.LogAsync(db, AuditAction.Create, "MediaLink", link.Id.ToString(),
            "-", link.Url, $"Media link \"{link.Title}\" stored");
        await db.SaveChangesAsync(ct);

        return Result<MediaLinkDto>.Ok(new MediaLinkDto(link.Id, link.Title, link.Url, link.Alt, link.CreatedAt));
    }

    public async Task<MediaLinkDto[]> MediaLinksAsync(CancellationToken ct = default) =>
        (await db.MediaLinks.AsNoTracking().OrderByDescending(m => m.CreatedAt).ToListAsync(ct))
        .Select(m => new MediaLinkDto(m.Id, m.Title, m.Url, m.Alt, m.CreatedAt))
        .ToArray();

    public async Task<Result<bool>> DeleteMediaLinkAsync(long id, CancellationToken ct)
    {
        var link = await db.MediaLinks.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (link is null) return Result<bool>.Fail("Media link not found.", "id");
        db.MediaLinks.Remove(link);
        await audit.LogAsync(db, AuditAction.Delete, "MediaLink", id.ToString(),
            link.Url, "deleted", $"Media link \"{link.Title}\" removed");
        await db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }
}
