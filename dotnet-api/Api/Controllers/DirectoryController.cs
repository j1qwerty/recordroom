using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;

namespace RecordRoom.Api.Api.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
[Produces("application/json")]
[Tags("Employees")]
public class EmployeesController(IEmployeesService employees) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(
        [FromQuery] string? search,
        [FromQuery] string? department,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default) =>
        Results.Ok(ApiResponse<PagedResult<EmployeeDto>>.Ok(
            await employees.ListAsync(search, department, status, page, pageSize, ct)));

    [HttpGet("departments")]
    public async Task<IResult> Departments(CancellationToken ct) =>
        Results.Ok(ApiResponse<string[]>.Ok(await employees.DepartmentsAsync(ct)));

    [HttpGet("{id:int}")]
    public async Task<IResult> Get(int id, CancellationToken ct)
    {
        var employee = await employees.GetAsync(id, ct);
        return employee is null ? Results.NotFound() : Results.Ok(ApiResponse<EmployeeDto>.Ok(employee));
    }

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpPost]
    public async Task<IResult> Create(EmployeeInput input, CancellationToken ct) =>
        ApiResults.FromResult(await employees.CreateAsync(input, ct));

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpPut("{id:int}")]
    public async Task<IResult> Update(int id, EmployeeInput input, CancellationToken ct) =>
        ApiResults.FromResult(await employees.UpdateAsync(id, input, ct));

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpDelete("{id:int}")]
    public async Task<IResult> Delete(int id, CancellationToken ct) =>
        ApiResults.FromResult(await employees.DeleteAsync(id, ct));
}

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
[Tags("Users")]
public class UsersController(IUsersService users) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(CancellationToken ct) =>
        Results.Ok(ApiResponse<object>.Ok(new
        {
            users = (await users.ListAsync(ct)).Select(AuthService.ToDto).ToArray(),
            roles = Enum.GetNames<Domain.Role>(),
        }));

    [HttpPost]
    public async Task<IResult> Create([FromBody] CreateUserRequest request, CancellationToken ct) =>
        ApiResults.FromResult(await users.CreateAsync(
            new UserInput(request.UserName, request.DisplayName, request.Role,
                request.EmployeeCode, request.Active),
            request.Password, ct));

    [HttpPut("{id:int}")]
    public async Task<IResult> Update(int id, UserInput input, CancellationToken ct) =>
        ApiResults.FromResult(await users.UpdateAsync(id, input, ct));

    [HttpDelete("{id:int}")]
    public async Task<IResult> Delete(int id, CancellationToken ct) =>
        ApiResults.FromResult(await users.DeleteAsync(id, ct));
}

/// <summary>Login creation needs an initial password, which is write-only.</summary>
public sealed record CreateUserRequest(
    string UserName,
    string DisplayName,
    string Role,
    string? EmployeeCode,
    bool Active,
    string Password);

[ApiController]
[Route("api/inquiries")]
[Authorize]
[Produces("application/json")]
[Tags("Content")]
public class InquiriesController(IContentService content) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(CancellationToken ct) =>
        Results.Ok(ApiResponse<InquiryDto[]>.Ok(await content.InquiriesAsync(ct)));

    [HttpPost]
    public async Task<IResult> Create(InquiryInput input, CancellationToken ct) =>
        ApiResults.FromResult(await content.SaveInquiryAsync(input, ct));

    [HttpDelete("{id:long}")]
    public async Task<IResult> Delete(long id, CancellationToken ct) =>
        ApiResults.FromResult(await content.DeleteInquiryAsync(id, ct));
}

[ApiController]
[Route("api/media-links")]
[Authorize]
[Produces("application/json")]
[Tags("Content")]
public class MediaLinksController(IContentService content) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(CancellationToken ct) =>
        Results.Ok(ApiResponse<MediaLinkDto[]>.Ok(await content.MediaLinksAsync(ct)));

    [HttpPost]
    public async Task<IResult> Create(MediaLinkInput input, CancellationToken ct) =>
        ApiResults.FromResult(await content.SaveMediaLinkAsync(input, ct));

    [HttpDelete("{id:long}")]
    public async Task<IResult> Delete(long id, CancellationToken ct) =>
        ApiResults.FromResult(await content.DeleteMediaLinkAsync(id, ct));
}
