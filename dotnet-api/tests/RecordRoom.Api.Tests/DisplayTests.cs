using RecordRoom.Api.Application;
using RecordRoom.Api.Domain;

namespace RecordRoom.Api.Tests;

/// <summary>
/// The status strings the API returns are part of the contract the frontend
/// binds to. A rename here silently breaks every status badge in the UI, so the
/// exact wire values are pinned rather than derived from <c>ToString()</c>.
/// </summary>
public class DisplayTests
{
    [Theory]
    [InlineData(RecordStatus.Available, "Available")]
    [InlineData(RecordStatus.Issued, "Issued")]
    [InlineData(RecordStatus.UnderDigitization, "Under Digitization")]
    [InlineData(RecordStatus.Missing, "Missing")]
    [InlineData(RecordStatus.Archived, "Archived")]
    public void Record_status_uses_the_contract_spelling(RecordStatus status, string expected) =>
        Assert.Equal(expected, Display.Record(status));

    [Theory]
    [InlineData(IssueStatus.Issued, "Issued")]
    [InlineData(IssueStatus.Returned, "Returned")]
    [InlineData(IssueStatus.Overdue, "Overdue")]
    [InlineData(IssueStatus.PartiallyReturned, "Partially returned")]
    public void Issue_status_uses_the_contract_spelling(IssueStatus status, string expected) =>
        Assert.Equal(expected, Display.Issue(status));

    [Theory]
    [InlineData(PageStatus.PendingReview, "Pending review")]
    [InlineData(PageStatus.Approved, "Approved")]
    [InlineData(PageStatus.Rejected, "Rejected")]
    [InlineData(PageStatus.Duplicate, "Duplicate")]
    public void Page_status_uses_the_contract_spelling(PageStatus status, string expected) =>
        Assert.Equal(expected, Display.Page(status));

    [Theory]
    [InlineData(BatchStatus.InProgress, "In progress")]
    [InlineData(BatchStatus.Submitted, "Submitted")]
    [InlineData(BatchStatus.Approved, "Approved")]
    [InlineData(BatchStatus.PartiallyApproved, "Partially approved")]
    public void Batch_status_uses_the_contract_spelling(BatchStatus status, string expected) =>
        Assert.Equal(expected, Display.Batch(status));

    [Theory]
    [InlineData(DigitizationFolder.ServiceBook, "service_book")]
    [InlineData(DigitizationFolder.LeaveReport, "leave_report")]
    [InlineData(DigitizationFolder.Sr, "sr")]
    [InlineData(DigitizationFolder.Apar, "apar")]
    public void Folder_uses_the_legacy_slug(DigitizationFolder folder, string expected) =>
        Assert.Equal(expected, Display.Folder(folder));

    [Theory]
    [InlineData(MovementKind.LocationChange, "Location change")]
    [InlineData(MovementKind.FileCreated, "File created")]
    [InlineData(MovementKind.Issue, "Issue")]
    [InlineData(MovementKind.Return, "Return")]
    public void Movement_kind_uses_readable_text(MovementKind kind, string expected) =>
        Assert.Equal(expected, Display.Movement(kind));

    [Theory]
    [InlineData(RecordStatus.Available)]
    [InlineData(RecordStatus.Issued)]
    [InlineData(RecordStatus.UnderDigitization)]
    [InlineData(RecordStatus.Missing)]
    [InlineData(RecordStatus.Archived)]
    public void Record_status_round_trips(RecordStatus status) =>
        // Whatever the API emits must be accepted back as a filter, or a user
        // clicking a status chip to filter by it would get nothing.
        Assert.Equal(status, Display.ParseRecord(Display.Record(status)));

    [Theory]
    [InlineData(IssueStatus.Issued)]
    [InlineData(IssueStatus.Returned)]
    [InlineData(IssueStatus.Overdue)]
    [InlineData(IssueStatus.PartiallyReturned)]
    public void Issue_status_round_trips(IssueStatus status) =>
        Assert.Equal(status, Display.ParseIssue(Display.Issue(status)));

    [Theory]
    [InlineData(PageStatus.PendingReview)]
    [InlineData(PageStatus.Approved)]
    [InlineData(PageStatus.Rejected)]
    [InlineData(PageStatus.Duplicate)]
    [InlineData(PageStatus.Active)]
    public void Page_status_round_trips(PageStatus status) =>
        Assert.Equal(status, Display.ParsePage(Display.Page(status)));

    [Theory]
    [InlineData(BatchStatus.InProgress)]
    [InlineData(BatchStatus.Submitted)]
    [InlineData(BatchStatus.Approved)]
    [InlineData(BatchStatus.PartiallyApproved)]
    public void Batch_status_round_trips(BatchStatus status) =>
        Assert.Equal(status, Display.ParseBatch(Display.Batch(status)));

    [Theory]
    [InlineData(DigitizationFolder.ServiceBook)]
    [InlineData(DigitizationFolder.LeaveReport)]
    [InlineData(DigitizationFolder.Sr)]
    [InlineData(DigitizationFolder.Apar)]
    public void Folder_round_trips(DigitizationFolder folder) =>
        Assert.Equal(folder, Display.ParseFolder(Display.Folder(folder)));

    [Theory]
    [InlineData(MovementKind.Issue)]
    [InlineData(MovementKind.Return)]
    [InlineData(MovementKind.LocationChange)]
    [InlineData(MovementKind.FileCreated)]
    public void Movement_kind_round_trips(MovementKind kind) =>
        Assert.Equal(kind, Display.ParseMovement(Display.Movement(kind)));

    [Theory]
    [InlineData("All")]
    [InlineData("")]
    [InlineData(null)]
    public void A_blank_filter_means_no_filter_not_a_default_value(string? value)
    {
        // "All" is what the UI sends for an unset dropdown. Treating it as a
        // literal status name would silently filter everything out.
        Assert.Null(Display.ParseRecord(value));
        Assert.Null(Display.ParseIssue(value));
        Assert.Null(Display.ParsePage(value));
        Assert.Null(Display.ParseBatch(value));
    }

    [Fact]
    public void An_unknown_filter_value_is_rejected_rather_than_guessed()
    {
        Assert.Null(Display.ParseRecord("Teleported"));
        Assert.Null(Display.ParseIssue("Teleported"));
        Assert.Null(Display.ParsePage("Teleported"));
        Assert.Null(Display.ParseBatch("Teleported"));
        Assert.Null(Display.ParseFolder("Teleported"));
    }

    [Fact]
    public void Storage_and_employee_status_match_their_enum_names()
    {
        // These need no aliasing, so a stray rename is the only risk.
        foreach (var status in Enum.GetValues<StorageStatus>())
            Assert.Equal(status.ToString(), Display.Storage(status));

        foreach (var status in Enum.GetValues<EmployeeStatus>())
            Assert.Equal(status.ToString(), Display.Employee(status));

        foreach (var role in Enum.GetValues<Role>())
            Assert.Equal(role.ToString(), Display.Role(role));
    }
}