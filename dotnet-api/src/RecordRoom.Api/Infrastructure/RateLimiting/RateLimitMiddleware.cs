using StackExchange.Redis;

namespace RecordRoom.Api.Infrastructure.RateLimiting;

/// <summary>
/// Named limits attached to the authentication surface.
/// <para>
/// These defaults are deliberately strict on the credential-checking routes:
/// OTP and PIN guessing is the threat here, and a six-digit code has a million
/// combinations. The registry is keyed by path so a new endpoint has to be
/// added deliberately rather than inheriting a limit by accident.
/// </para>
/// </summary>
public sealed class RateLimitPolicies(IConfiguration configuration)
{
    public const string Login = "login";
    public const string OtpRequest = "otp-request";
    public const string OtpVerify = "otp-verify";
    public const string Pin = "pin";
    public const string Recovery = "recovery";
    public const string Api = "api";

    public bool Enabled { get; } = configuration.GetValue("RateLimiting:Enabled", true);

    private int Read(string key, int fallback) => configuration.GetValue($"RateLimiting:{key}:Limit", fallback);
    private int ReadWindow(string key, int fallback) => configuration.GetValue($"RateLimiting:{key}:WindowSeconds", fallback);

    public IReadOnlyDictionary<string, RateLimitPolicy> All => new Dictionary<string, RateLimitPolicy>
    {
        // Credential checks: tight, because these are the guessable ones.
        [Login] = RateLimitPolicy.FromConfiguration(Login, Read("Login", 10), ReadWindow("Login", 60)),
        [OtpVerify] = RateLimitPolicy.FromConfiguration(OtpVerify, Read("OtpVerify", 10), ReadWindow("OtpVerify", 60)),
        [Pin] = RateLimitPolicy.FromConfiguration(Pin, Read("Pin", 10), ReadWindow("Pin", 60)),
        // Issuing a challenge is rate limited more loosely: a locked-out user
        // cannot recover, so the limit must sit above normal retry behaviour.
        [OtpRequest] = RateLimitPolicy.FromConfiguration(OtpRequest, Read("OtpRequest", 5), ReadWindow("OtpRequest", 300)),
        [Recovery] = RateLimitPolicy.FromConfiguration(Recovery, Read("Recovery", 3), ReadWindow("Recovery", 900)),
        // Broad backstop for everything else.
        [Api] = RateLimitPolicy.FromConfiguration(Api, Read("Api", 600), ReadWindow("Api", 60)),
    };

    /// <summary>
    /// Maps a request path to its policy. Exact matches only, so an unrelated
    /// endpoint is never silently caught by a credential limit.
    /// </summary>
    public string? PolicyFor(string path)
    {
        var policies = All;
        foreach (var (path_, policy) in Routes)
            if (string.Equals(path, path_, StringComparison.OrdinalIgnoreCase))
                return policies[policy].Name;

        return policies[Api].Name;
    }

    private static readonly (string Path, string Policy)[] Routes =
    [
        ("/api/auth/login", Login),
        ("/api/auth/otp/request", OtpRequest),
        ("/api/auth/otp/verify", OtpVerify),
        ("/api/auth/pin", Pin),
        ("/api/auth/recovery/request", Recovery),
        ("/api/auth/recovery/complete", Recovery),
    ];
}

/// <summary>
/// Applies a fixed-window limit to every request, keyed by client IP.
/// <para>
/// Only POST is limited. A GET on a report or a SignalR negotiate is cheap and
/// blocking those would break normal browsing; the endpoints that matter for
/// abuse are all writes.
/// </para>
/// </summary>
public sealed class RateLimitMiddleware(RequestDelegate next, ILogger<RateLimitMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, RateLimitPolicies policies, IRateLimiter limiter)
    {
        if (!policies.Enabled || !HttpMethods.IsPost(context.Request.Method))
        {
            await next(context);
            return;
        }

        // SignalR and static assets never reach here as POST in practice, but a
        // long-lived hub POST must not be counted as an API call.
        if (context.Request.Path.StartsWithSegments("/hubs")) 
        {
            await next(context);
            return;
        }

        var policy = policies.All[policies.PolicyFor(context.Request.Path.Value ?? "/")];
        var identifier = ClientIdentifier(context);

        var verdict = await limiter.CheckAsync(policy, identifier, context.RequestAborted);

        context.Response.Headers["X-RateLimit-Limit"] = policy.PermitLimit.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, verdict.Remaining).ToString();

        if (!verdict.Allowed)
        {
            var retryAfter = (int)Math.Max(1, Math.Ceiling(verdict.RetryAfter.TotalSeconds));
            context.Response.Headers["Retry-After"] = retryAfter.ToString();
            logger.LogWarning(
                "Rate limit {Policy} exceeded for {Identifier}; blocked for {RetryAfter}s.",
                policy.Name, identifier, retryAfter);

            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/json";
            // Same envelope shape as every other API response so the frontend
            // error handling does not need a special case for this.
            await context.Response.WriteAsync(
                $$"""{"success":false,"data":null,"errors":[{"message":"Too many requests. Try again in {{retryAfter}} seconds.","field":"rateLimit"}]}""");
            return;
        }

        await next(context);
    }

    /// <summary>
    /// Client identity. nginx proxies everything, so the connection address is
    /// the proxy unless X-Forwarded-For is trusted; it is set by our own server
    /// block, so the left-most entry is the real client.
    /// </summary>
    private static string ClientIdentifier(HttpContext context)
    {
        var forwarded = context.Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var first = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first)) return first;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

public static class RateLimitingRegistration
{
    /// <summary>
    /// Registers the policy registry and the limiter. ASP.NET Core's built-in
    /// rate limiter is deliberately not used: it keeps counters in process, so
    /// on a multi-node deployment every node would enforce the full quota and the
    /// effective limit would silently be N times the configured one.
    /// </summary>
    public static IServiceCollection AddRecordRoomRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton(sp => new RateLimitPolicies(sp.GetRequiredService<IConfiguration>()));

        services.AddSingleton<IRateLimiter>(sp =>
        {
            var mux = sp.GetRequiredService<IConnectionMultiplexer?>();
            return mux is null
                ? new MemoryRateLimiter(sp.GetRequiredService<ILogger<MemoryRateLimiter>>())
                : new RedisRateLimiter(mux, sp.GetRequiredService<ILogger<RedisRateLimiter>>());
        });

        return services;
    }

    public static IApplicationBuilder UseRecordRoomRateLimiting(this IApplicationBuilder app) =>
        app.UseMiddleware<RateLimitMiddleware>();
}