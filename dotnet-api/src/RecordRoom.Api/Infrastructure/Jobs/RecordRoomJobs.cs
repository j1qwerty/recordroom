using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Domain;
using RecordRoom.Api.Infrastructure.Data;

namespace RecordRoom.Api.Infrastructure.Jobs;

/// <summary>
/// Background work that must not block a request. Runs on Hangfire, which uses
/// in-memory storage by default so the API needs no extra infrastructure.
/// Set <c>Hangfire:Storage=SqlServer</c> to persist jobs in SQL Server.
/// </summary>
public class RecordRoomJobs(
    IServiceProvider services,
    ILogger<RecordRoomJobs> logger)
{
    /// <summary>
    /// Flags receipts that have passed their due date. Idempotent, so running it
    /// twice in a day changes nothing the second time.
    /// </summary>
    [Hangfire.DisableConcurrentExecution(timeoutInSeconds: 300)]
    public async Task MarkOverdueReceiptsAsync()
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var candidates = await db.Issues
            .Where(i => i.Status == IssueStatus.Issued && i.DueAt < now)
            .ToListAsync();

        if (candidates.Count == 0)
        {
            logger.LogInformation("Overdue sweep found nothing to flag.");
            return;
        }

        foreach (var issue in candidates) issue.Status = IssueStatus.Overdue;
        await db.SaveChangesAsync();

        logger.LogInformation("Overdue sweep flagged {Count} receipt(s).", candidates.Count);
    }

    /// <summary>
    /// Retains the login history and audit trail. Real deployments must tune
    /// this to the retention policy in docs/SECURITY.md.
    /// </summary>
    [Hangfire.DisableConcurrentExecution(timeoutInSeconds: 600)]
    public async Task PruneOldAuditAsync()
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoff = DateTime.UtcNow.AddDays(-365);
        var audit = await db.Audit.Where(a => a.At < cutoff).ToListAsync();
        var logins = await db.LoginHistory.Where(l => l.LoginAt < cutoff).ToListAsync();

        if (audit.Count == 0 && logins.Count == 0) return;

        db.Audit.RemoveRange(audit);
        db.LoginHistory.RemoveRange(logins);
        await db.SaveChangesAsync();

        logger.LogInformation(
            "Pruned {Audit} audit row(s) and {Logins} login row(s) older than {Cutoff:yyyy-MM-dd}.",
            audit.Count, logins.Count, cutoff);
    }
}