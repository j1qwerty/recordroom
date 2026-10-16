using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;

namespace RecordRoom.Api.Api.Controllers;

[ApiController]
[Route("api/digitization")]
[Authorize]
[Produces("application/json")]
[Tags("Digitization")]
public class DigitizationController(IDigitizationService digitization) : ControllerBase
{
    [HttpGet("batches")]
    public async Task<IResult> Batches(
        [FromQuery] string? employeeCode,
        [FromQuery] string? folder,
        [FromQuery] string? status,
        [FromQuery] string? search,
        CancellationToken ct) =>
        Results.Ok(ApiResponse<DigitizationBatchDto[]>.Ok(
            await digitization.BatchesAsync(employeeCode, folder, status, search, ct)));

    [HttpGet("pending-review-count")]
    public async Task<IResult> Pending(CancellationToken ct) =>
        Results.Ok(ApiResponse<int>.Ok(await digitization.PendingReviewCountAsync(ct)));

    [HttpGet("batches/{id:long}")]
    public async Task<IResult> Batch(long id, CancellationToken ct)
    {
        var batch = await digitization.BatchAsync(id, ct);
        return batch is null ? Results.NotFound() : Results.Ok(ApiResponse<DigitizationBatchDto>.Ok(batch));
    }

    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost("batches")]
    public async Task<IResult> Create(BatchCreateInput input, CancellationToken ct) =>
        ApiResults.FromResult(await digitization.CreateBatchAsync(input, ct));

    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost("batches/{id:long}/pages")]
    public async Task<IResult> UploadPage(long id, PageUploadInput input, CancellationToken ct) =>
        ApiResults.FromResult(await digitization.UploadPageAsync(id, input, ct));

    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost("pages/{pageId:long}/document")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(538968064)]
    [RequestFormLimits(MultipartBodyLengthLimit = 538968064)]
    public async Task<IResult> UploadPageDocument(long pageId, [FromForm] IFormFile? document, CancellationToken ct) =>
        ApiResults.FromResult(await digitization.UploadPageDocumentAsync(pageId, document, ct));

    [HttpGet("pages/{pageId:long}/content")]
    public async Task<IActionResult> PageContent(long pageId, [FromQuery] bool download = false, CancellationToken ct = default)
    {
        var item = await digitization.OpenPageDocumentAsync(pageId, ct);
        if (item is null) return NotFound();
        Response.Headers["Cache-Control"] = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Content-Disposition"] = DocumentHttpHeaders.BuildDisposition(item.FileName, download);
        return File(item.Stream, item.ContentType, enableRangeProcessing: true);
    }

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpDelete("pages/{pageId:long}")]
    public async Task<IResult> RemovePage(long pageId, CancellationToken ct) =>
        ApiResults.FromResult(await digitization.RemovePageAsync(pageId, ct));

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpPost("pages/{pageId:long}/review")]
    public async Task<IResult> ReviewPage(long pageId, PageReviewInput input, CancellationToken ct) =>
        ApiResults.FromResult(await digitization.ReviewPageAsync(pageId, input, ct));

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpPost("batches/{id:long}/review")]
    public async Task<IResult> ReviewBatch(long id, PageReviewInput input, CancellationToken ct) =>
        ApiResults.FromResult(await digitization.ReviewBatchAsync(id, input, ct));
}

internal static class DocumentHttpHeaders
{
    public static string BuildDisposition(string fileName, bool download)
    {
        var disposition = new Microsoft.Net.Http.Headers.ContentDispositionHeaderValue(download ? "attachment" : "inline")
        {
            FileNameStar = fileName
        };
        return disposition.ToString();
    }
}

[ApiController]
[Route("api/uploads")]
[Authorize]
[Produces("application/json")]
[Tags("Uploads")]
public class UploadsController(IUploadsService uploads) : ControllerBase
{
    [HttpGet("maps")]
    public async Task<IResult> Maps(
        [FromQuery] string? fileBarcode, [FromQuery] string? search, CancellationToken ct) =>
        Results.Ok(ApiResponse<MapUploadDto[]>.Ok(await uploads.MapsAsync(fileBarcode, search, ct)));

    [HttpPost("maps")]
    public async Task<IResult> AddMap(MapUploadInput input, CancellationToken ct) =>
        ApiResults.FromResult(await uploads.AddMapAsync(input, ct));

    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost("maps/{id:long}/document")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(538968064)]
    [RequestFormLimits(MultipartBodyLengthLimit = 538968064)]
    public async Task<IResult> UploadMapDocument(long id, [FromForm] IFormFile? document, CancellationToken ct) =>
        ApiResults.FromResult(await uploads.UploadMapDocumentAsync(id, document, ct));

    [HttpGet("maps/{id:long}/content")]
    public async Task<IActionResult> MapContent(long id, [FromQuery] bool download = false, CancellationToken ct = default)
    {
        var item = await uploads.OpenMapDocumentAsync(id, ct);
        if (item is null) return NotFound();
        Response.Headers["Cache-Control"] = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Content-Disposition"] = DocumentHttpHeaders.BuildDisposition(item.FileName, download);
        return File(item.Stream, item.ContentType, enableRangeProcessing: true);
    }

    [HttpDelete("maps/{id:long}")]
    public async Task<IResult> RemoveMap(long id, CancellationToken ct) =>
        ApiResults.FromResult(await uploads.RemoveMapAsync(id, ct));
}

[ApiController]
[Route("api/bulk")]
[Authorize]
[Produces("application/json")]
[Tags("Bulk")]
public class BulkController(IBulkService bulk) : ControllerBase
{
    [HttpGet("jobs")]
    public async Task<IResult> Jobs(CancellationToken ct) =>
        Results.Ok(ApiResponse<BulkJobDto[]>.Ok(await bulk.JobsAsync(ct)));

    [HttpGet("jobs/{id:long}")]
    public async Task<IResult> Job(long id, CancellationToken ct)
    {
        var job = await bulk.JobAsync(id, ct);
        return job is null ? Results.NotFound() : Results.Ok(ApiResponse<BulkJobDto>.Ok(job));
    }

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpPost("validate")]
    public async Task<IResult> Validate(BulkValidateInput input, CancellationToken ct) =>
        ApiResults.FromResult(await bulk.ValidateAsync(input, ct));

    [Authorize(Roles = "Admin,Supervisor")]
    [HttpPost("jobs/{id:long}/commit")]
    public async Task<IResult> Commit(long id, CancellationToken ct) =>
        ApiResults.FromResult(await bulk.CommitAsync(id, ct));
}

[ApiController]
[Route("api/barcodes")]
[Authorize]
[Produces("application/json")]
[Tags("Barcodes")]
public class BarcodesController(IBarcodeService barcodes) : ControllerBase
{
    [HttpGet("payload/{subject}/{targetId}")]
    public async Task<IResult> Payload(string subject, string targetId, CancellationToken ct)
    {
        if (!Enum.TryParse<Domain.BarcodeSubject>(subject, true, out var parsed))
            return Results.BadRequest(ApiResponse<object>.Fail([new FieldError("Unknown subject.", "subject")]));

        var payload = await barcodes.PayloadFor(parsed, targetId, ct);
        return payload is null
            ? Results.NotFound()
            : Results.Ok(ApiResponse<BarcodePayloadDto>.Ok(payload));
    }

    [HttpPost("validate")]
    public async Task<IResult> Validate(BarcodeValidateInput input, CancellationToken ct) =>
        Results.Ok(ApiResponse<BarcodeValidateResponse>.Ok(await barcodes.Validate(input, ct)));

    [HttpGet("qr")]
    public IResult Qr([FromQuery] string value) =>
        Results.Ok(ApiResponse<string>.Ok(barcodes.BuildQrUrl(value)));

    [HttpGet("jobs")]
    public async Task<IResult> Jobs(CancellationToken ct) =>
        Results.Ok(ApiResponse<BarcodeJobDto[]>.Ok(await barcodes.JobsAsync(ct)));

    [Authorize(Roles = "Admin,Supervisor,Operator")]
    [HttpPost("jobs")]
    public async Task<IResult> CreateJob(BarcodeJobInput input, CancellationToken ct) =>
        ApiResults.FromResult(await barcodes.CreateJobAsync(input, ct));

    [HttpDelete("jobs/{id:long}")]
    public async Task<IResult> CancelJob(long id, CancellationToken ct) =>
        ApiResults.FromResult(await barcodes.CancelJobAsync(id, ct));
}

[ApiController]
[Route("api/reports")]
[Authorize]
[Produces("application/json")]
[Tags("Reports")]
public class ReportsController(IReportsService reports) : ControllerBase
{
    [HttpGet]
    public IResult Definitions() =>
        Results.Ok(ApiResponse<ReportDefinitionDto[]>.Ok(reports.Definitions()));

    [HttpGet("{key}")]
    public IResult Build(string key)
    {
        try
        {
            return Results.Ok(ApiResponse<ReportResultDto>.Ok(reports.Build(key)));
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ApiResponse<ReportResultDto>.Fail([new FieldError(ex.Message, "key")]));
        }
    }

    /// <summary>
    /// Streams the CSV. Large exports should move to a Hangfire job that writes
    /// to object storage; this path is fine for the row counts the UI shows now.
    /// </summary>
    [Authorize(Roles = "Admin,Supervisor")]
    [HttpGet("{key}/export")]
    public IResult Export(string key)
    {
        try
        {
            var csv = reports.BuildCsv(key, out var rows);
            var safe = key.Replace('/', '-');
            return Results.File(
                System.Text.Encoding.UTF8.GetBytes(csv),
                "text/csv; charset=utf-8",
                $"{safe}-{DateTime.UtcNow:yyyy-MM-dd}.csv");
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ApiResponse<object>.Fail([new FieldError(ex.Message, "key")]));
        }
    }
}
