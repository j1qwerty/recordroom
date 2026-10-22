using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Cache;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Application.Services;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "record-room-api";
    public string Audience { get; set; } = "record-room-frontend";
    public string SigningKey { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 120;
}

public interface IAuthService
{
    Task<Result<AuthTokenResponse>> SignInAsync(LoginRequest request, string ip, string userAgent, CancellationToken ct = default);
    Task<Result<OtpChallengeResponse>> RequestOtpAsync(OtpRequest request, string ip, string userAgent, CancellationToken ct = default);
    Task<Result<AuthTokenResponse>> SignInWithOtpAsync(OtpVerifyRequest request, string ip, string userAgent, CancellationToken ct = default);
    Task<Result<AuthTokenResponse>> SignInWithPinAsync(PinLoginRequest request, string ip, string userAgent, CancellationToken ct = default);
    Task<Result<string>> RequestRecoveryAsync(string userName, CancellationToken ct = default);
    Task<Result<UserDto>> RecoverPasswordAsync(PasswordResetRequest request, CancellationToken ct = default);
    Task SignOutAsync(int userId, string ip, CancellationToken ct = default);
    string[] PermissionsFor(Role role);
    string GenerateToken(AppUser user);
}

/// <summary>
/// Reproduces the four legacy entry points from `User.php`: web password, mobile
/// OTP, employee PIN and the forgotpassword â†’ otpsubmit â†’ recoverpassword chain.
/// Every attempt, including failures, lands in the login history and the audit log.
/// </summary>
public sealed class AuthService(
    AppDbContext db,
    IOptions<JwtOptions> jwt,
    ICacheService cache,
    IAuditWriter audit,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly JwtOptions _jwt = jwt.Value;
    private static readonly TimeSpan OtpTtl = TimeSpan.FromMinutes(5);

    // Demo PIN for the employee flow. Production reads this from the employee record.
    private const string DemoPin = "1234";

    private async Task<AppUser?> FindAsync(string userName, CancellationToken ct) =>
        await db.Users.FirstOrDefaultAsync(
            u => u.UserName.ToLower() == userName.Trim().ToLower(), ct);

    private async Task RecordAttemptAsync(
        string userName, AppUser? user, LoginOutcome outcome, string channel,
        string detail, string ip, string userAgent, CancellationToken ct)
    {
        db.LoginHistory.Add(new LoginHistoryEntry
        {
            UserName = user?.UserName ?? (userName.Trim().Length == 0 ? "unknown" : userName.Trim()),
            Role = user?.Role.ToString() ?? nameof(Role.Employee),
            Channel = channel,
            Ip = ip,
            UserAgent = userAgent,
            LoginAt = DateTime.UtcNow,
            Outcome = outcome,
            Detail = detail,
        });
        await audit.LogAsync(db, AuditAction.Login, "Session", user?.UserName ?? userName,
            "session=anonymous",
            outcome == LoginOutcome.Success ? "session=active" : "session=rejected",
            $"{channel} {(outcome == LoginOutcome.Success ? "accepted" : "rejected")} for {user?.UserName ?? userName}");
        await db.SaveChangesAsync(ct);
    }

    private string NewOtp() => Random.Shared.Next(100_000, 1_000_000).ToString();

    private AuthTokenResponse BuildToken(AppUser user)
    {
        var expires = DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("preferred_username", user.UserName),
            new("name", user.DisplayName),
        };
        if (!string.IsNullOrWhiteSpace(user.EmployeeCode))
            claims.Add(new Claim("employee_code", user.EmployeeCode));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SigningKey));
        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new AuthTokenResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expires,
            ToDto(user),
            PermissionsFor(user.Role));
    }

    private async Task<AppUser> TouchAsync(AppUser user, CancellationToken ct)
    {
        user.LastLoginAt = DateTime.UtcNow;
        var tracked = await db.Users.FirstAsync(u => u.Id == user.Id, ct);
        tracked.LastLoginAt = user.LastLoginAt;
        return tracked;
    }

    public async Task<Result<AuthTokenResponse>> SignInAsync(
        LoginRequest request, string ip, string userAgent, CancellationToken ct = default)
    {
        var user = await FindAsync(request.UserName, ct);
        if (user is null)
        {
            await RecordAttemptAsync(request.UserName, null, LoginOutcome.Failed, "Web",
                "Unknown user name", ip, userAgent, ct);
            return Result<AuthTokenResponse>.Fail("That user name is not registered.", "userName");
        }
        if (!user.Active)
        {
            await RecordAttemptAsync(request.UserName, user, LoginOutcome.Failed, "Web",
                "Account deactivated", ip, userAgent, ct);
            return Result<AuthTokenResponse>.Fail(
                "This account is deactivated. Ask an administrator to re-enable it.", "userName");
        }
        if (!PasswordHasher.Verify(request.Password ?? string.Empty, user.PasswordHash, user.PasswordSalt))
        {
            await RecordAttemptAsync(request.UserName, user, LoginOutcome.Failed, "Web",
                "Password mismatch", ip, userAgent, ct);
            return Result<AuthTokenResponse>.Fail("Incorrect password.", "password");
        }

        await RecordAttemptAsync(request.UserName, user, LoginOutcome.Success, "Web",
            "Web login accepted", ip, userAgent, ct);
        var tracked = await TouchAsync(user, ct);
        await db.SaveChangesAsync(ct);
        return Result<AuthTokenResponse>.Ok(BuildToken(tracked));
    }

    public async Task<Result<OtpChallengeResponse>> RequestOtpAsync(
        OtpRequest request, string ip, string userAgent, CancellationToken ct = default)
    {
        var user = await FindAsync(request.UserName, ct);
        if (user is null)
            return Result<OtpChallengeResponse>.Fail(
                "Unknown user name. Mobile login needs a registered account.", "userName");
        if (!user.Active)
            return Result<OtpChallengeResponse>.Fail("This account is deactivated.", "userName");

        var otp = NewOtp();
        await cache.SetAsync(CacheKeys.Otp(user.UserName), otp, OtpTtl);
        // A real deployment sends this by SMS. The API returns only the challenge
        // id; the code is never echoed back over HTTP.
        logger.LogInformation("OTP issued for {User}: {Otp} (demo transport)", user.UserName, otp);
        return Result<OtpChallengeResponse>.Ok(
            new OtpChallengeResponse(Guid.NewGuid().ToString("N"), DateTime.UtcNow.Add(OtpTtl)));
    }

    public async Task<Result<AuthTokenResponse>> SignInWithOtpAsync(
        OtpVerifyRequest request, string ip, string userAgent, CancellationToken ct = default)
    {
        var user = await FindAsync(request.UserName, ct);
        if (user is null) return Result<AuthTokenResponse>.Fail("Unknown user name.", "userName");

        var expected = cache.Get<string>(CacheKeys.Otp(user.UserName));
        if (expected is null)
            return Result<AuthTokenResponse>.Fail("Request a one-time password first.", "otp");
        if (request.Otp?.Trim() != expected)
        {
            await RecordAttemptAsync(request.UserName, user, LoginOutcome.Failed, "Mobile",
                "OTP mismatch", ip, userAgent, ct);
            return Result<AuthTokenResponse>.Fail("Incorrect one-time password.", "otp");
        }

        await cache.RemoveAsync(CacheKeys.Otp(user.UserName));
        await RecordAttemptAsync(request.UserName, user, LoginOutcome.Success, "Mobile",
            "Mobile OTP login accepted", ip, userAgent, ct);
        var tracked = await TouchAsync(user, ct);
        await db.SaveChangesAsync(ct);
        return Result<AuthTokenResponse>.Ok(BuildToken(tracked));
    }

    public async Task<Result<AuthTokenResponse>> SignInWithPinAsync(
        PinLoginRequest request, string ip, string userAgent, CancellationToken ct = default)
    {
        var user = await FindAsync(request.UserName, ct);
        if (user is null) return Result<AuthTokenResponse>.Fail("Unknown user name.", "userName");

        if (request.Pin?.Trim() != DemoPin)
        {
            await RecordAttemptAsync(request.UserName, user, LoginOutcome.Failed, "Mobile",
                "PIN mismatch", ip, userAgent, ct);
            return Result<AuthTokenResponse>.Fail("Incorrect PIN.", "pin");
        }

        await RecordAttemptAsync(request.UserName, user, LoginOutcome.Success, "Mobile",
            "Mobile PIN login accepted", ip, userAgent, ct);
        var tracked = await TouchAsync(user, ct);
        await db.SaveChangesAsync(ct);
        return Result<AuthTokenResponse>.Ok(BuildToken(tracked));
    }

    public async Task<Result<string>> RequestRecoveryAsync(string userName, CancellationToken ct = default)
    {
        var user = await FindAsync(userName, ct);
        if (user is null) return Result<string>.Fail("Unknown user name.", "userName");

        var otp = NewOtp();
        await cache.SetAsync(CacheKeys.Recovery(user.UserName), otp, OtpTtl);
        logger.LogInformation("Recovery code issued for {User}: {Otp} (demo transport)", user.UserName, otp);
        return Result<string>.Ok(otp);
    }

    public async Task<Result<UserDto>> RecoverPasswordAsync(PasswordResetRequest request, CancellationToken ct = default)
    {
        var user = await FindAsync(request.UserName, ct);
        if (user is null) return Result<UserDto>.Fail("Unknown user name.", "userName");

        var expected = cache.Get<string>(CacheKeys.Recovery(user.UserName));
        if (expected is null || request.Otp?.Trim() != expected)
            return Result<UserDto>.Fail("Recovery code does not match. Request a new one.", "otp");
        if ((request.Password ?? string.Empty).Length < 8)
            return Result<UserDto>.Fail("Use at least 8 characters for the new password.", "password");

        await cache.RemoveAsync(CacheKeys.Recovery(user.UserName));
        var (hash, salt) = PasswordHasher.Create(request.Password ?? string.Empty);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;

        await audit.LogAsync(db, AuditAction.Update, "AppUser", user.Id.ToString(),
            "password=<redacted>", "password=<rotated>",
            $"Password reset completed for {user.UserName}");
        db.LoginHistory.Add(new LoginHistoryEntry
        {
            UserName = user.UserName,
            Role = user.Role.ToString(),
            Channel = "Web",
            Ip = "127.0.0.1",
            UserAgent = "recovery",
            LoginAt = DateTime.UtcNow,
            Outcome = LoginOutcome.Success,
            Detail = "Password reset with recovery code",
        });
        await db.SaveChangesAsync(ct);
        return Result<UserDto>.Ok(ToDto(user));
    }

    public async Task SignOutAsync(int userId, string ip, CancellationToken ct = default)
    {
        var open = await db.LoginHistory
            .Where(e => e.UserName != null && e.LogoutAt == null && e.Outcome == LoginOutcome.Success)
            .OrderByDescending(e => e.LoginAt)
            .FirstOrDefaultAsync(ct);
        var name = open?.UserName;
        if (name is null)
        {
            name = (await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct))?.UserName;
        }
        if (name is null) return;

        if (open is not null) open.LogoutAt = DateTime.UtcNow;
        await audit.LogAsync(db, AuditAction.Logout, "Session", userId.ToString(),
            "session=active", "session=closed", $"{name} signed out");
        await db.SaveChangesAsync(ct);
    }

    public static UserDto ToDto(AppUser user) => new(
        user.Id, user.UserName, user.DisplayName, user.Role.ToString(),
        user.EmployeeCode, user.Active, user.LastLoginAt);

    public string GenerateToken(AppUser user) => BuildToken(user).Token;

    public string[] PermissionsFor(Role role) => PermissionsForRole(role);

    /// <summary>Same capability list as the frontend <c>services/permissions.ts</c>.</summary>
    public static string[] PermissionsForRole(Role role) => role switch
    {
        Role.Admin =>
        [
            "files.view", "files.create", "files.edit", "files.bulkImport",
            "issue.issue", "issue.return", "locations.view", "locations.edit",
            "digitization.view", "digitization.upload", "digitization.review",
            "employees.view", "employees.edit", "users.view", "users.edit",
            "audit.view", "reports.view", "reports.export", "barcodes.print",
        ],
        Role.Supervisor =>
        [
            "files.view", "files.create", "files.edit", "files.bulkImport",
            "issue.issue", "issue.return", "locations.view", "locations.edit",
            "digitization.view", "digitization.upload", "digitization.review",
            "employees.view", "employees.edit", "users.view",
            "audit.view", "reports.view", "reports.export", "barcodes.print",
        ],
        Role.Operator =>
        [
            "files.view", "files.create", "issue.issue", "issue.return",
            "locations.view", "digitization.view", "digitization.upload",
            "employees.view", "reports.view", "barcodes.print",
        ],
        _ => ["files.view", "digitization.view", "reports.view"],
    };
}