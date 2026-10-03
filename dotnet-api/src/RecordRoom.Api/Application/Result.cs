using System.Security.Claims;
using RecordRoom.Api.Infrastructure.Auth;

namespace RecordRoom.Api.Application;

/// <summary>
/// Mirrors the frontend <c>Result&lt;T&gt;</c> so the HTTP layer and the service
/// layer agree on one shape: either a value, or an error with the field that caused it.
/// </summary>
public readonly record struct FieldError(string Message, string? Field = null);

public readonly record struct Result<T>
{
    private readonly T _value;

    public bool IsSuccess { get; }

    /// <summary>
    /// The value, meaningful only when <see cref="IsSuccess"/> is true.
    ///
    /// Deliberately typed <c>T</c>, not <c>T?</c>. On an unconstrained generic
    /// the <c>?</c> annotation is erased at runtime, so a failure would hand
    /// back <c>default(T)</c> that no null check can distinguish from a real
    /// value: an <c>int</c> result would read as a legitimate <c>0</c> and a
    /// null-check would never fire. Callers must consult IsSuccess.
    /// </summary>
    public T Value => _value;

    public IReadOnlyList<FieldError> Errors { get; }

    private Result(bool ok, T value, IReadOnlyList<FieldError> errors)
    {
        IsSuccess = ok;
        _value = value;
        Errors = errors;
    }

    public static Result<T> Ok(T value) => new(true, value, []);
    public static Result<T> Fail(string message, string? field = null) =>
        new(false, default!, [new FieldError(message, field)]);
    public static Result<T> Fail(IEnumerable<FieldError> errors) =>
        new(false, default!, errors.ToArray());

    /// <summary>
    /// Unwraps a success and throws on a failure, naming every error so the
    /// mistake is diagnosable from the message alone.
    /// </summary>
    public T ValueOrThrow() =>
        IsSuccess
            ? _value
            : throw new InvalidOperationException(
                $"Result has no value. Errors: {string.Join("; ", Errors.Select(e => e.Message))}");
}

/// <summary>Uniform success/failure envelope so the frontend adapter has one shape to parse.</summary>
public sealed record ApiResponse<T>(bool Success, T? Data, IReadOnlyList<FieldError>? Errors)
{
    public static ApiResponse<T> Ok(T data) => new(true, data, null);
    public static ApiResponse<T> Fail(IReadOnlyList<FieldError> errors) => new(false, default, errors);
}

public static class ApiResults
{
    public static IResult FromResult<T>(Result<T> result) =>
        result.IsSuccess
            ? Microsoft.AspNetCore.Http.Results.Ok(ApiResponse<T>.Ok(result.Value!))
            : Microsoft.AspNetCore.Http.Results.BadRequest(ApiResponse<T>.Fail(result.Errors));
}

/// <summary>
/// Resolves the caller's identity and role for audit stamping and permission checks.
/// The API re-checks every capability server-side; hiding a control in the
/// frontend is never the authorization boundary.
/// </summary>
public interface ICurrentUserAccessor
{
    CurrentUser? User { get; }
    string UserName { get; }
    string Role { get; }
    string Ip { get; }
    bool IsInRole(Domain.Role role);
}

public sealed class CurrentUserAccessor(IHttpContextAccessor accessor) : ICurrentUserAccessor
{
    public ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public CurrentUser? User
    {
        get
        {
            var p = Principal;
            if (p?.Identity?.IsAuthenticated != true) return null;
            // With MapInboundClaims disabled "sub" survives, but fall back to the
            // mapped claim so this keeps working if that setting ever changes.
            var id = p.FindFirst("sub")?.Value ?? p.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = p.FindFirst(ClaimTypes.Name)?.Value ?? p.Identity.Name ?? "unknown";
            if (!int.TryParse(id, out var parsedId)) return null;
            return new CurrentUser(
                parsedId,
                p.FindFirst("preferred_username")?.Value ?? name,
                p.FindFirst("name")?.Value ?? name,
                p.FindFirst(ClaimTypes.Role)?.Value ?? "Employee",
                p.FindFirst("employee_code")?.Value);
        }
    }

    public string UserName => User?.UserName ?? "anonymous";

    public string Role => User?.Role ?? "Employee";

    public string Ip =>
        accessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

    public bool IsInRole(Domain.Role role) => User?.Role == role.ToString();
}

public static class CurrentUserExtensions
{
    public static CurrentUser Require(this ICurrentUserAccessor accessor) =>
        accessor.User ?? throw new UnauthorizedAccessException("No authenticated user on this request.");
}