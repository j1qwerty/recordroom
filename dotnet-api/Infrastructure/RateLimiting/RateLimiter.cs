using System.Collections.Concurrent;
using StackExchange.Redis;

namespace RecordRoom.Api.Infrastructure.RateLimiting;

/// <summary>Outcome of one rate-limit check.</summary>
/// <param name="Allowed">False when the caller has exhausted the policy's quota.</param>
/// <param name="Remaining">Requests left in the current window.</param>
/// <param name="RetryAfter">How long until the window resets, when blocked.</param>
public readonly record struct RateLimitVerdict(bool Allowed, long Remaining, TimeSpan RetryAfter);

public interface IRateLimiter
{
    /// <summary>Whether limits are shared across nodes rather than per process.</summary>
    bool IsDistributed { get; }

    Task<RateLimitVerdict> CheckAsync(RateLimitPolicy policy, string identifier, CancellationToken ct = default);
}

/// <summary>
/// One fixed-window limit, e.g. "10 login attempts per 60 seconds".
/// </summary>
public sealed record RateLimitPolicy(string Name, int PermitLimit, TimeSpan Window)
{
    public static RateLimitPolicy FromConfiguration(string name, int permitLimit, int windowSeconds) =>
        new(name, Math.Max(1, permitLimit), TimeSpan.FromSeconds(Math.Max(1, windowSeconds)));
}

/// <summary>
/// Fixed-window counter kept in Redis so the quota is shared by every API node.
/// <para>
/// The window is one key holding a count, made atomic with INCR. The first
/// increment of a window sets the expiry, so the key self-cleans and a caller
/// cannot extend the window by retrying.
/// </para>
/// <para>
/// Redis being unavailable must not lock every user out of signing in, so a
/// failure here fails open and is reported to the caller.
/// </para>
/// </summary>
public sealed class RedisRateLimiter(IConnectionMultiplexer redis, ILogger<RedisRateLimiter> logger) : IRateLimiter
{
    public bool IsDistributed => true;

    public async Task<RateLimitVerdict> CheckAsync(
        RateLimitPolicy policy, string identifier, CancellationToken ct = default)
    {
        try
        {
            var db = redis.GetDatabase();
            var key = Slot(policy.Name, identifier);

            // INCR is atomic, so two nodes hitting the same key cannot both read
            // the same count. Only the increment that creates the key sets the TTL,
            // which keeps the window fixed rather than sliding.
            var count = await db.StringIncrementAsync(key);
            if (count == 1)
                await db.KeyExpireAsync(key, policy.Window);

            if (count <= policy.PermitLimit)
                return new RateLimitVerdict(true, policy.PermitLimit - count, TimeSpan.Zero);

            var ttl = await db.KeyTimeToLiveAsync(key) ?? policy.Window;
            return new RateLimitVerdict(false, 0, ttl < TimeSpan.Zero ? TimeSpan.Zero : ttl);
        }
        catch (Exception ex)
        {
            // Fail open: a cache outage must not become an outage of the login page.
            logger.LogWarning(ex, "Rate limit check failed for {Policy}; allowing the request.", policy.Name);
            return new RateLimitVerdict(true, policy.PermitLimit, TimeSpan.Zero);
        }
    }

    private static string Slot(string policy, string identifier) => $"rr:ratelimit:{policy}:{identifier}";
}

/// <summary>
/// Per-process fallback used when no Redis connection is available. Each node
/// counts separately, so a multi-node deployment on this path enforces
/// PermitLimit per node rather than in total; that is the accepted trade-off
/// for keeping the app runnable without Redis.
/// </summary>
public sealed class MemoryRateLimiter(ILogger<MemoryRateLimiter> logger) : IRateLimiter
{
    private readonly ConcurrentDictionary<string, Window> _windows = new(StringComparer.Ordinal);
    private readonly object _gate = new();

    public bool IsDistributed => false;

    public Task<RateLimitVerdict> CheckAsync(
        RateLimitPolicy policy, string identifier, CancellationToken ct = default)
    {
        var key = $"{policy.Name}:{identifier}";
        var now = DateTimeOffset.UtcNow;

        // Read-modify-write under a lock: the Redis path gets its atomicity from
        // INCR, and this is the equivalent for a single process.
        lock (_gate)
        {
            if (!_windows.TryGetValue(key, out var window) || window.Expires <= now)
            {
                window = new Window(policy.PermitLimit, now.Add(policy.Window));
                _windows[key] = window;
            }

            if (window.Remaining > 0)
            {
                window.Remaining--;
                return Task.FromResult(new RateLimitVerdict(true, window.Remaining, TimeSpan.Zero));
            }

            var retry = window.Expires - now;
            logger.LogDebug("Rate limit {Policy} blocked for {Identifier} for {Retry}.", policy.Name, identifier, retry);
            return Task.FromResult(new RateLimitVerdict(false, 0, retry));
        }
    }

    /// <summary>Prunes expired windows so a long-lived process does not grow without bound.</summary>
    public int Prune()
    {
        var now = DateTimeOffset.UtcNow;
        lock (_gate)
        {
            var stale = _windows.Where(entry => entry.Value.Expires <= now).Select(entry => entry.Key).ToArray();
            foreach (var key in stale) _windows.TryRemove(key, out _);
            return stale.Length;
        }
    }

    private sealed class Window
    {
        public Window(long remaining, DateTimeOffset expires)
        {
            Remaining = remaining;
            Expires = expires;
        }

        public long Remaining { get; set; }
        public DateTimeOffset Expires { get; }
    }
}