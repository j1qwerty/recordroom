using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Application;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Cache;
using RecordRoom.Api.Infrastructure.Data;
using RecordRoom.Api.Infrastructure.Realtime;

namespace RecordRoom.Api.Application.Services;

/// <summary>
/// Every write goes through here so three things can never drift apart: the
/// data, the audit row describing it, and the real-time notification. They are
/// written in one transaction and published after commit.
/// </summary>
public interface IAuditWriter
{
    Task LogAsync(
        AppDbContext db,
        AuditAction action,
        string entity,
        string entityId,
        string before,
        string after,
        string summary,
        CancellationToken ct = default);

    Task<MovementEvent> RecordMovementAsync(
        AppDbContext db,
        MovementKind kind,
        RecordFile file,
        string from,
        string to,
        string detail,
        long? issueReceiptId = null,
        CancellationToken ct = default);

    /// <summary>Publishes and invalidates caches. Call after the transaction commits.</summary>
    Task AnnounceAsync(string channel, string action, string? entityId, string summary);
}

public sealed class AuditWriter(
    ICurrentUserAccessor current,
    IRealtimePublisher realtime,
    ICacheService cache) : IAuditWriter
{
    public Task LogAsync(
        AppDbContext db,
        AuditAction action,
        string entity,
        string entityId,
        string before,
        string after,
        string summary,
        CancellationToken ct = default)
    {
        db.Audit.Add(new AuditEntry
        {
            Action = action,
            Entity = entity,
            EntityId = entityId,
            Actor = current.UserName,
            Role = current.Role,
            At = DateTime.UtcNow,
            Ip = current.Ip,
            Before = before,
            After = after,
            Summary = summary,
        });
        return Task.CompletedTask;
    }

    public async Task<MovementEvent> RecordMovementAsync(
        AppDbContext db,
        MovementKind kind,
        RecordFile file,
        string from,
        string to,
        string detail,
        long? issueReceiptId = null,
        CancellationToken ct = default)
    {
        var movement = new MovementEvent
        {
            Kind = kind,
            RecordFileId = file.Id,
            Barcode = file.Barcode,
            Subject = file.Subject,
            From = from,
            To = to,
            Actor = current.UserName,
            At = DateTime.UtcNow,
            Detail = detail,
            IssueReceiptId = issueReceiptId,
        };
        db.Movements.Add(movement);
        await Task.CompletedTask;
        return movement;
    }

    public async Task AnnounceAsync(string channel, string action, string? entityId, string summary)
    {
        // Dashboard cards and the activity feed are derived from every channel,
        // so any write invalidates them before subscribers are notified. Doing it
        // in this order means a client that refetches on the notification cannot
        // read a count that is one write stale.
        await cache.RemoveAsync(CacheKeys.DashboardStats);
        await cache.RemoveAsync(CacheKeys.DashboardActivity);

        await realtime.PublishAsync(channel, action, entityId, summary, current.UserName);
        await realtime.PublishAsync(RealtimeChannels.Dashboard, action, entityId, summary, current.UserName);
    }
}
