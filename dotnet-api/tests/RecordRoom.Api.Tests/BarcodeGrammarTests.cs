using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Data;
using RecordRoom.Api.Infrastructure.Realtime;

namespace RecordRoom.Api.Tests;

/// <summary>
/// The barcode grammar is shared with record-room-frontend/src/lib/barcode.ts.
/// A scanner at a desk must be told it failed, never handed a half-understood
/// payload, so the rejection paths matter as much as the happy one.
/// </summary>
public class BarcodeGrammarTests
{
    /// <summary>
    /// Validation never touches the database, so the dependencies are passed as
    /// null rather than standing up a context for a pure string check.
    /// </summary>
    private static BarcodeService Service() => new(null!, null!);

    [Theory]
    [InlineData("RR|FILE|RF-0000124587", "File")]
    [InlineData("RR|SHELF|RM001A005SH01", "Shelf")]
    [InlineData("RR|ALMIRAH|RM001005", "Almirah")]
    [InlineData("RR|SECTION|SEC-A", "Section")]
    [InlineData("RR|ROOM|RM-001", "Room")]
    [InlineData("RR|AREA|AARI", "Area")]
    public async Task A_well_formed_payload_is_accepted(string value, string expectedSubject)
    {
        var result = await Service().Validate(new BarcodeValidateInput(value), default);

        Assert.True(result.Ok);
        Assert.NotNull(result.Payload);
        Assert.Equal(expectedSubject, result.Payload!.Subject);
        Assert.Equal(value, result.Payload.Value);
        Assert.Equal("Code128", result.Payload.Symbology);
    }

    [Theory]
    [InlineData("RR|WIDGET|X")]
    [InlineData("RR|FILEDROP|RF-1")]
    public async Task An_unknown_subject_code_is_refused(string value)
    {
        var result = await Service().Validate(new BarcodeValidateInput(value), default);

        Assert.False(result.Ok);
        Assert.Null(result.Payload);
        Assert.Contains("Unknown subject code", result.Message);
    }

    [Theory]
    [InlineData("not-a-payload")]
    [InlineData("FILE|RF-1")]
    [InlineData("XX|FILE|RF-1")]
    [InlineData("RR|FILE")]
    [InlineData("RR|FILE|RF-1|EXTRA")]
    public async Task A_payload_outside_the_grammar_is_refused(string value)
    {
        var result = await Service().Validate(new BarcodeValidateInput(value), default);

        Assert.False(result.Ok);
        Assert.Null(result.Payload);
        Assert.Contains("Unrecognised", result.Message);
    }

    [Theory]
    [InlineData("RR|FILE|   ")]
    [InlineData("RR|FILE|")]
    public async Task An_empty_value_is_refused_rather_than_accepted_as_blank(string value)
    {
        var result = await Service().Validate(new BarcodeValidateInput(value), default);

        Assert.False(result.Ok);
        Assert.Contains("empty value", result.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task Nothing_scanned_yet_says_so_instead_of_claiming_a_bad_payload(string? value)
    {
        var result = await Service().Validate(new BarcodeValidateInput(value!), default);

        Assert.False(result.Ok);
        Assert.Contains("Nothing scanned", result.Message);
    }

    [Fact]
    public async Task A_qr_sticker_url_unwraps_to_the_same_payload_as_the_linear_label()
    {
        // The QR sticker carries the identical payload in a /scan?p= query, so a
        // desk can mix label printers without losing scanability.
        var linear = "RR|FILE|RF-0000124587";
        var url = Service().BuildQrUrl(linear);

        var fromUrl = await Service()
            .Validate(new BarcodeValidateInput(url), default);
        var fromLinear = await Service()
            .Validate(new BarcodeValidateInput(linear), default);

        Assert.True(fromUrl.Ok);
        Assert.Equal(fromLinear.Payload!.Value, fromUrl.Payload!.Value);
    }

    [Fact]
    public async Task Surrounding_whitespace_from_a_scanner_is_tolerated()
    {
        var result = await Service()
            .Validate(new BarcodeValidateInput("  RR|FILE|RF-0000124587  "), default)
            ;

        Assert.True(result.Ok);
        Assert.Equal("RR|FILE|RF-0000124587", result.Payload!.Value);
    }

    [Fact]
    public async Task Meta_reports_the_encoded_length_the_frontend_encoder_will_use()
    {
        var result = await Service()
            .Validate(new BarcodeValidateInput("RR|SHELF|RM001A005SH01"), default)
            ;

        // Matches buildPayload() in lib/barcode.ts.
        Assert.Equal("Code 128 · set B · 13 chars", result.Payload!.Meta);
    }
}

public class RealtimeGroupTests
{
    [Fact]
    public void A_connection_is_placed_in_a_namespaced_group_per_channel()
    {
        // The namespace keeps these groups from colliding with anything else on
        // the same SignalR hub.
        var group = GroupNames.Of(["files", "dashboard"]);

        Assert.Equal("rr:files|rr:dashboard", group);
    }

    [Fact]
    public void Blank_and_duplicate_channels_are_dropped()
    {
        var group = GroupNames.Of(["files", "", "  ", "files", "issues"]);

        Assert.Equal("rr:files|rr:issues", group);
    }

    [Fact]
    public void No_channels_produces_no_group()
    {
        Assert.Equal(string.Empty, GroupNames.Of([]));
    }

    [Fact]
    public void Every_declared_channel_is_namespaced_when_subscribed_together()
    {
        var all = new[]
        {
            RealtimeChannels.Files, RealtimeChannels.Locations, RealtimeChannels.Issues,
            RealtimeChannels.Movements, RealtimeChannels.Digitization,
            RealtimeChannels.Audit, RealtimeChannels.Dashboard, RealtimeChannels.Uploads,
        };

        var group = GroupNames.Of(all);

        foreach (var channel in all)
            Assert.Contains($"rr:{channel}", group);
    }
}

/// <summary>
/// A failure must carry the field that caused it, because the frontend binds
/// those messages to individual inputs rather than showing a banner.
/// </summary>
public class ResultTests
{
    [Fact]
    public void A_success_carries_its_value_and_no_errors()
    {
        var result = Result<int>.Ok(42);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void A_failure_names_the_offending_field()
    {
        var result = Result<int>.Fail("Shelf is full.", "shelfId");

        Assert.False(result.IsSuccess);
        var error = Assert.Single(result.Errors);
        Assert.Equal("Shelf is full.", error.Message);
        Assert.Equal("shelfId", error.Field);
    }

    [Fact]
    public void A_failure_is_not_distinguishable_from_a_real_default_by_its_value_alone()
    {
        // Pins the reason Value is typed T rather than T?. On an unconstrained
        // generic the ? is erased, so a failed int result used to be a silent 0
        // that no null check could catch.
        var failure = Result<int>.Fail("Shelf not found.", "shelfId");
        var success = Result<int>.Ok(0);

        Assert.Equal(failure.Value, success.Value);
        Assert.NotEqual(failure.IsSuccess, success.IsSuccess);
    }

    [Fact]
    public void Multiple_field_errors_are_preserved_in_order()
    {
        var result = Result<int>.Fail(
        [
            new FieldError("Barcode is required.", "fileBarcode"),
            new FieldError("Enter a four-digit year.", "year"),
        ]);

        Assert.False(result.IsSuccess);
        Assert.Equal(2, result.Errors.Count);
        Assert.Equal("fileBarcode", result.Errors[0].Field);
        Assert.Equal("year", result.Errors[1].Field);
    }

    [Fact]
    public void Reading_the_value_of_a_failure_explains_itself()
    {
        // ValueOrThrow is only reached on a programming error, so the message
        // has to say what actually went wrong.
        var result = Result<int>.Fail("Shelf not found.", "shelfId");

        var thrown = Assert.Throws<InvalidOperationException>(() => result.ValueOrThrow());
        Assert.Contains("Shelf not found.", thrown.Message);
    }

    [Fact]
    public void A_field_error_without_a_field_is_allowed()
    {
        // Form-level messages have no single input to attach to.
        var result = Result<int>.Fail("The import could not be staged.");

        Assert.Null(Assert.Single(result.Errors).Field);
    }
}