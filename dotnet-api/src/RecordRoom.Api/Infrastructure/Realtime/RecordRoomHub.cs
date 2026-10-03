using Microsoft.AspNetCore.SignalR;
using RecordRoom.Api.Infrastructure.Auth;

namespace RecordRoom.Api.Infrastructure.Realtime;

/// <summary>Real-time push for anything another screen may be showing.</summary>
public class RecordRoomHub : Hub
{
    /// <summary>Client joins the channels its current view depends on.</summary>
    public Task Subscribe(IEnumerable<string> channels) =>
        Groups.AddToGroupAsync(
            Context.ConnectionId,
            GroupNames.Of(channels));

    public Task Unsubscribe(IEnumerable<string> channels) =>
        Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GroupNames.Of(channels));

    public override Task OnConnectedAsync()
    {
        // Every connection starts on the dashboard channel so the stat cards and
        // the activity list stay live everywhere, not only on the page that
        // opened the socket.
        Groups.AddToGroupAsync(Context.ConnectionId, RealtimeChannels.Dashboard);
        return base.OnConnectedAsync();
    }
}

public static class GroupNames
{
    public static string Of(IEnumerable<string> channels) =>
        string.Join("|", channels.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().Select(c => $"rr:{c}"));
}

/// <summary>
/// Thin wrapper so services can publish without depending on Hub instances.
/// Publishing is best-effort: a SignalR failure must never fail the write that
/// already committed to the database.
/// </summary>
public interface IRealtimePublisher
{
    Task PublishAsync(string channel, string action, string? entityId, string summary, string actor);
}

public sealed class RealtimePublisher(
    IHubContext<RecordRoomHub> hub,
    ILogger<RealtimePublisher> logger) : IRealtimePublisher
{
    public async Task PublishAsync(string channel, string action, string? entityId, string summary, string actor)
    {
        var payload = new RealtimeNotification(channel, action, entityId, summary, actor, DateTime.UtcNow);
        try
        {
            await hub.Clients.Group(GroupNames.Of([channel])).SendAsync("notification", payload);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Realtime publish to {Channel} failed; the write itself succeeded.", channel);
        }
    }
}