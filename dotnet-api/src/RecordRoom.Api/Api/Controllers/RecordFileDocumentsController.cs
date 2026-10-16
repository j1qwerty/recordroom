using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;

namespace RecordRoom.Api.Api.Controllers;

[ApiController]
[Route("api/files/{fileId:int}/documents")]
[Authorize]
[Produces("application/json")]
[Tags("Record file documents")]
public sealed class RecordFileDocumentsController(IRecordFileDocumentsService documents) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> List(int fileId, CancellationToken ct)
    {
        var rows = await documents.ListAsync(fileId, ct);
        return rows is null ? Results.NotFound() : Results.Ok(ApiResponse<RecordFileDocumentDto[]>.Ok(rows));
    }

    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(538968064)]
    [RequestFormLimits(MultipartBodyLengthLimit = 538968064)]
    public async Task<IResult> Upload(int fileId, [FromForm] IFormFile? document, CancellationToken ct) =>
        ApiResults.FromResult(await documents.UploadAsync(fileId, document, ct));

    [HttpGet("{documentId:long}/content")]
    public async Task<IActionResult> Content(int fileId, long documentId, [FromQuery] bool download = false, CancellationToken ct = default)
    {
        var item = await documents.OpenAsync(fileId, documentId, ct);
        if (item is null) return NotFound();
        Response.Headers["Cache-Control"] = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        var disposition = new ContentDispositionHeaderValue(download ? "attachment" : "inline") { FileNameStar = item.FileName };
        Response.Headers["Content-Disposition"] = disposition.ToString();
        return File(item.Stream, item.ContentType, enableRangeProcessing: true);
    }
}
