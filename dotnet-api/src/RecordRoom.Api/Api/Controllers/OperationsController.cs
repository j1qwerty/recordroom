using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;

namespace RecordRoom.Api.Api.Controllers;

[ApiController]
[Route("api/issues")]
[Authorize]
[Produces("application/json")]
[Tags("Issues")]
public class IssuesController(IIssuesService issues) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(
        [FromQuery] string? status,
        [FromQuery] string? borrower,
        [FromQuery] bool? open,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default) =>
        Results.Ok(ApiResponse<PagedResult<IssueDto>>.Ok(
            await issues.ListAsync(status, borrower, open, page, pageSize, ct)));

    [HttpGet("borrowers")]
    public async Task<IResult> Borrowers(CancellationToken ct) =>
        Results.Ok(ApiResponse<BorrowerDto[]>.Ok(await issues.BorrowersAsync(ct)));

    [HttpGet("overdue")]
    public async Task<IResult> Overdue(CancellationToken ct) =>
        Results.Ok(ApiResponse<IssueDto[]>.Ok(await issues.OverdueAsync(ct)));

    [HttpGet("next-receipt-number")]
    public async Task<IResult> NextReceipt(CancellationToken ct) =>
        Results.Ok(ApiResponse<string>.Ok(await issues.NextReceiptNumberAsync(ct)));

    [HttpGet("{id:long}")]
    public async Task<IResult> Get(long id, CancellationToken ct)
    {
        var issue = await issues.GetAsync(id, ct);
        return issue is null ? Results.NotFound() : Results.Ok(ApiResponse<IssueDto>.Ok(issue));
    }

    /// <summary>Multi-file issue: several files against one receipt.</summary>
    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost]
    public async Task<IResult> Issue(IssueInput input, CancellationToken ct) =>
        ApiResults.FromResult(await issues.IssueAsync(input, ct));

    /// <summary>Partial return: the receipt settles when every line is back.</summary>
    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost("{id:long}/return")]
    public async Task<IResult> Return(long id, ReturnInput input, CancellationToken ct) =>
        ApiResults.FromResult(await issues.ReturnAsync(id, input, ct));
}

[ApiController]
[Route("api/movements")]
[Authorize]
[Produces("application/json")]
[Tags("Movements")]
public class MovementsController(IReadService read) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(
        [FromQuery] string? kind,
        [FromQuery] string? search,
        [FromQuery] int limit = 200,
        CancellationToken ct = default) =>
        Results.Ok(ApiResponse<MovementDto[]>.Ok(await read.MovementsAsync(kind, search, limit, ct)));

    [HttpGet("file/{fileId:int}")]
    public async Task<IResult> ForFile(int fileId, CancellationToken ct) =>
        Results.Ok(ApiResponse<MovementDto[]>.Ok(await read.FileMovementsAsync(fileId, ct)));
}

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Produces("application/json")]
[Tags("Dashboard")]
public class DashboardController(IReadService read) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IResult> Stats(CancellationToken ct) =>
        Results.Ok(ApiResponse<DashboardStatsDto>.Ok(await read.DashboardStatsAsync(ct)));

    [HttpGet("activity")]
    public async Task<IResult> Activity([FromQuery] int limit = 6, CancellationToken ct = default) =>
        Results.Ok(ApiResponse<ActivityDto[]>.Ok(await read.ActivityAsync(limit, ct)));
}

/// <summary>
/// The audit trail is granted to Admin and Supervisor only. Enforced here rather
/// than by hiding the nav item: the API is the authorization boundary, and the
/// frontend capability matrix is only UX gating.
/// </summary>
[ApiController]
[Route("api/audit")]
[Authorize(Roles = "Admin,Supervisor")]
[Produces("application/json")]
[Tags("Audit")]
public class AuditController(IReadService read) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(
        [FromQuery] string? action,
        [FromQuery] string? actor,
        [FromQuery] string? entity,
        [FromQuery] string? search,
        [FromQuery] int limit = 200,
        CancellationToken ct = default) =>
        Results.Ok(ApiResponse<object>.Ok(new
        {
            entries = await read.AuditAsync(action, actor, entity, search, limit, ct),
        }));

    [HttpGet("login-history")]
    public async Task<IResult> LoginHistory(
        [FromQuery] string? outcome, [FromQuery] string? search, CancellationToken ct) =>
        Results.Ok(ApiResponse<object>.Ok(new
        {
            entries = await read.LoginHistoryAsync(outcome, search, ct),
        }));

    [HttpGet("actors")]
    public async Task<IResult> Actors(CancellationToken ct) =>
        Results.Ok(ApiResponse<string[]>.Ok(await read.AuditActorsAsync(ct)));
}