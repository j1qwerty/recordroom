using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using StackExchange.Redis;

namespace RecordRoom.Api.Infrastructure.Cache;

/// <summary>
/// Cache for dashboard aggregates, report snapshots and OTP challenges.
///
/// Two implementations exist. <see cref="MemoryCacheService"/> is always
/// registered so the app works with no Redis present. <see cref="RedisCacheService"/>
/// is layered on top when a connection string is configured: it writes to both
/// and reads Redis first, then memory. Any Redis fault is logged and served from
/// memory, so a Redis outage degrades performance without breaking a request.
/// </summary>
public interface ICacheService
{
    bool IsDistributed { get; }
    T? Get<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan ttl);
    Task RemoveAsync(string key);
    Task<T> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<Task<T>> factory);
}

public sealed class MemoryCacheService(IMemoryCache cache) : ICacheService
{
    public bool IsDistributed => false;

    public T? Get<T>(string key) => cache.Get<T>(key);

    public Task SetAsync<T>(string key, T value, TimeSpan ttl)
    {
        cache.Set(key, value, ttl);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        cache.Remove(key);
        return Task.CompletedTask;
    }

    public async Task<T> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<Task<T>> factory)
    {
        if (cache.TryGetValue<T>(key, out var hit) && hit is not null) return hit;
        var value = await factory();
        cache.Set(key, value, ttl);
        return value;
    }
}

public sealed class RedisCacheService(
    IConnectionMultiplexer redis,
    IMemoryCache memory,
    ILogger<RedisCacheService> logger) : ICacheService
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public bool IsDistributed => true;

    private static string Slot(string key) => $"rr:{key}";

    public T? Get<T>(string key)
    {
        // Memory first: it is local, has no failure modes, and is always warm in
        // a single-node deployment. Redis only matters once a second node exists.
        if (memory.TryGetValue<T>(key, out var local) && local is not null) return local;

        try
        {
            var raw = redis.GetDatabase().StringGet(Slot(key));
            if (raw.IsNullOrEmpty) return default;
            var value = JsonSerializer.Deserialize<T>((string)raw!, Json);
            if (value is not null) memory.Set(key, value, TimeSpan.FromMinutes(5));
            return value;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis GET {Key} failed; continuing without it.", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl)
    {
        memory.Set(key, value, ttl);
        try
        {
            await redis.GetDatabase().StringSetAsync(Slot(key), JsonSerializer.Serialize(value, Json), ttl);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis SET {Key} failed; memory cache still holds the value.", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        memory.Remove(key);
        try
        {
            await redis.GetDatabase().KeyDeleteAsync(Slot(key));
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis DEL {Key} failed; memory cache was still cleared.", key);
        }
    }

    public async Task<T> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<Task<T>> factory)
    {
        var hit = Get<T>(key);
        if (hit is not null) return hit;
        var value = await factory();
        await SetAsync(key, value, ttl);
        return value;
    }
}

public static class CacheKeys
{
    public const string DashboardStats = "dashboard:stats";
    public const string DashboardActivity = "dashboard:activity";

    /// <summary>Bumped by any write so versioned aggregate keys stop matching.</summary>
    public const string AggregateVersion = "aggregate:version";

    public static string Otp(string userName) => $"auth:otp:{userName.ToLowerInvariant()}";
    public static string Recovery(string userName) => $"auth:recovery:{userName.ToLowerInvariant()}";
    public static string Report(string key, string version) => $"report:{key}:v{version}";
}