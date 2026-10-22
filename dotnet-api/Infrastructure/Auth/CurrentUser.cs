using System.Text.Json.Serialization;

namespace RecordRoom.Api.Infrastructure.Auth;

public sealed record CurrentUser(
    int Id,
    string UserName,
    string DisplayName,
    string Role,
    string? EmployeeCode);

/// <summary>
/// Shared SignalR contract. The frontend mirrors these names in
/// `record-room-frontend/src/services/realtime.ts`; changing a channel name
/// here must be mirrored there.
/// </summary>
public static class RealtimeChannels
{
    public const string Files = "files";
    public const string Locations = "locations";
    public const string Issues = "issues";
    public const string Movements = "movements";
    public const string Digitization = "digitization";
    public const string Audit = "audit";
    public const string Dashboard = "dashboard";
    public const string Uploads = "uploads";
}

/// <summary>
/// Payload pushed after any write that changes a collection other screens read.
/// <see cref="EntityId"/> lets a client decide whether its current view is stale.
/// </summary>
public sealed record RealtimeNotification(
    [property: JsonPropertyName("channel")] string Channel,
    [property: JsonPropertyName("action")] string Action,
    [property: JsonPropertyName("entityId")] string? EntityId,
    [property: JsonPropertyName("summary")] string Summary,
    [property: JsonPropertyName("actor")] string Actor,
    [property: JsonPropertyName("at")] DateTime At);