using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;

namespace RecordRoom.Api.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
[Produces("application/json")]
[Tags("Files")]
public class FilesController(IFilesService files) : ControllerBase
{
    /// <summary>
    /// Server-side filtering, sorting and paging. <c>collectionTotal</c> reports
    /// the legacy registry size so the UI can label the window honestly.
    /// </summary>
    [HttpGet]
    public async Task<IResult> List(
        [FromQuery] string? search,
        [FromQuery] string? department,
        [FromQuery] string? status,
        [FromQuery] int? roomId,
        [FromQuery] int? sectionId,
        [FromQuery] int? shelfId,
        [FromQuery] string? area,
        [FromQuery] string? recordKind,
        [FromQuery] string? fileType,
        [FromQuery] string? eOfficeStatus,
        [FromQuery] string? sort,
        [FromQuery] string? direction,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var query = new FileQuery
        {
            Search = search,
            Department = department,
            Status = status,
            RoomId = roomId,
            SectionId = sectionId,
            ShelfId = shelfId,
            Area = area,
            RecordKind = recordKind,
            FileType = fileType,
            EOfficeStatus = eOfficeStatus,
            Sort = sort,
            Direction = direction,
            Page = page,
            PageSize = pageSize,
        };
        return Results.Ok(ApiResponse<PagedResult<FileDto>>.Ok(await files.ListAsync(query, ct)));
    }

    [HttpGet("departments")]
    public async Task<IResult> Departments(CancellationToken ct) =>
        Results.Ok(ApiResponse<string[]>.Ok(await files.DepartmentsAsync(ct)));

    [HttpGet("count")]
    public async Task<IResult> Count(CancellationToken ct) =>
        Results.Ok(ApiResponse<int>.Ok(await files.CountAsync(ct)));

    [HttpGet("{id:int}")]
    public async Task<IResult> Get(int id, CancellationToken ct)
    {
        var file = await files.GetAsync(id, ct);
        return file is null ? Results.NotFound() : Results.Ok(ApiResponse<FileDto>.Ok(file));
    }

    [HttpGet("by-barcode/{barcode}")]
    public async Task<IResult> ByBarcode(string barcode, CancellationToken ct)
    {
        var file = await files.ByBarcodeAsync(barcode, ct);
        return file is null ? Results.NotFound() : Results.Ok(ApiResponse<FileDto>.Ok(file));
    }

    /// <summary>Dry-run the legacy guards without writing anything.</summary>
    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost("validate")]
    public async Task<IResult> Validate(FileCreateInput input, CancellationToken ct)
    {
        var errors = await files.ValidateCreateAsync(input, ct);
        return Results.Ok(ApiResponse<bool>.Ok(errors.Count == 0) with { Errors = errors });
    }

    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost]
    public async Task<IResult> Create(FileCreateInput input, CancellationToken ct) =>
        ApiResults.FromResult(await files.CreateAsync(input, ct));

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpPost("{id:int}/relocate")]
    public async Task<IResult> Relocate(int id, RelocateInput input, CancellationToken ct) =>
        ApiResults.FromResult(await files.RelocateAsync(id, input, ct));

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpDelete("{id:int}")]
    public async Task<IResult> Delete(int id, CancellationToken ct) =>
        ApiResults.FromResult(await files.DeleteAsync(id, ct));
}
