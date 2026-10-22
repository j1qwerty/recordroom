using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;
using RecordRoom.Api.Domain;

namespace RecordRoom.Api.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController(IAuthService auth, ICurrentUserAccessor current) : ControllerBase
{
    private string Ip => current.Ip;
    private string Agent => Request.Headers.UserAgent.ToString();

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IResult> Login(LoginRequest request, CancellationToken ct) =>
        ApiResults.FromResult(await auth.SignInAsync(request, Ip, Agent, ct));

    [HttpPost("otp/request")]
    [AllowAnonymous]
    public async Task<IResult> RequestOtp(OtpRequest request, CancellationToken ct) =>
        ApiResults.FromResult(await auth.RequestOtpAsync(request, Ip, Agent, ct));

    [HttpPost("otp/verify")]
    [AllowAnonymous]
    public async Task<IResult> VerifyOtp(OtpVerifyRequest request, CancellationToken ct) =>
        ApiResults.FromResult(await auth.SignInWithOtpAsync(request, Ip, Agent, ct));

    [HttpPost("pin")]
    [AllowAnonymous]
    public async Task<IResult> PinLogin(PinLoginRequest request, CancellationToken ct) =>
        ApiResults.FromResult(await auth.SignInWithPinAsync(request, Ip, Agent, ct));

    [HttpPost("recovery/request")]
    [AllowAnonymous]
    public async Task<IResult> RequestRecovery(RecoveryRequest request, CancellationToken ct) =>
        ApiResults.FromResult(await auth.RequestRecoveryAsync(request.UserName, ct));

    [HttpPost("recovery/complete")]
    [AllowAnonymous]
    public async Task<IResult> CompleteRecovery(PasswordResetRequest request, CancellationToken ct) =>
        ApiResults.FromResult(await auth.RecoverPasswordAsync(request, ct));

    /// <summary>The signed-in user and their granted capabilities.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IResult> Me(CancellationToken ct)
    {
        var user = current.User;
        if (user is null) return Results.Unauthorized();
        var dto = new UserDto(
            user.Id, user.UserName, user.DisplayName, user.Role, user.EmployeeCode,
            true, DateTime.UtcNow);
        return Results.Ok(ApiResponse<object>.Ok(new
        {
            user = dto,
            permissions = AuthService.PermissionsForRole(Enum.Parse<Role>(user.Role)),
        }));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IResult> Logout(CancellationToken ct)
    {
        var user = current.User;
        if (user is null) return Results.Unauthorized();
        await auth.SignOutAsync(user.Id, Ip, ct);
        return Results.Ok(ApiResponse<object>.Ok(new { signedOut = true }));
    }
}