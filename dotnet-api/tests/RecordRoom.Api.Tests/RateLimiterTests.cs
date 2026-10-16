using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using RecordRoom.Api.Infrastructure.RateLimiting;

namespace RecordRoom.Api.Tests;

public sealed class RateLimiterTests
{
    private static RateLimitPolicy Policy(int limit = 3, int seconds = 60) =>
        RateLimitPolicy.FromConfiguration("test", limit, seconds);

    [Fact]
    public async Task AllowsUpToTheLimitThenBlocks()
    {
        var limiter = new MemoryRateLimiter(NullLogger<MemoryRateLimiter>.Instance);
        var policy = Policy(limit: 3);

        for (var i = 0; i < 3; i++)
        {
            var verdict = await limiter.CheckAsync(policy, "1.2.3.4");
            Assert.True(verdict.Allowed, $"request {i + 1} should be allowed");
            Assert.Equal(2 - i, verdict.Remaining);
        }

        var blocked = await limiter.CheckAsync(policy, "1.2.3.4");
        Assert.False(blocked.Allowed);
        Assert.Equal(0, blocked.Remaining);
        Assert.True(blocked.RetryAfter > TimeSpan.Zero);
    }

    [Fact]
    public async Task SeparatesCallersSoOneCannotLockOutAnother()
    {
        var limiter = new MemoryRateLimiter(NullLogger<MemoryRateLimiter>.Instance);
        var policy = Policy(limit: 2);

        await limiter.CheckAsync(policy, "10.0.0.1");
        await limiter.CheckAsync(policy, "10.0.0.1");
        Assert.False((await limiter.CheckAsync(policy, "10.0.0.1")).Allowed);

        // A different address must still be able to sign in.
        var other = await limiter.CheckAsync(policy, "10.0.0.2");
        Assert.True(other.Allowed);
    }

    [Fact]
    public async Task SeparatesPoliciesForTheSameCaller()
    {
        var limiter = new MemoryRateLimiter(NullLogger<MemoryRateLimiter>.Instance);

        await limiter.CheckAsync(RateLimitPolicy.FromConfiguration("login", 1, 60), "10.0.0.1");
        Assert.False((await limiter.CheckAsync(RateLimitPolicy.FromConfiguration("login", 1, 60), "10.0.0.1")).Allowed);

        // Exhausting the login quota must not block the OTP verify route.
        Assert.True((await limiter.CheckAsync(RateLimitPolicy.FromConfiguration("otp-verify", 1, 60), "10.0.0.1")).Allowed);
    }

    [Fact]
    public async Task ResetsAfterTheWindowExpires()
    {
        var limiter = new MemoryRateLimiter(NullLogger<MemoryRateLimiter>.Instance);
        var policy = Policy(limit: 1, seconds: 1);

        Assert.True((await limiter.CheckAsync(policy, "9.9.9.9")).Allowed);
        Assert.False((await limiter.CheckAsync(policy, "9.9.9.9")).Allowed);

        await Task.Delay(1100);
        Assert.True((await limiter.CheckAsync(policy, "9.9.9.9")).Allowed);
    }

    [Fact]
    public async Task PruneDropsExpiredWindows()
    {
        var limiter = new MemoryRateLimiter(NullLogger<MemoryRateLimiter>.Instance);
        await limiter.CheckAsync(Policy(limit: 1, seconds: 1), "1.1.1.1");
        await Task.Delay(1100);

        Assert.Equal(1, limiter.Prune());
        Assert.Equal(0, limiter.Prune());
    }

    [Fact]
    public void MapsCredentialRoutesToTheTightPolicies()
    {
        var policies = Build(new Dictionary<string, string?>());

        Assert.Equal(RateLimitPolicies.Login, policies.PolicyFor("/api/auth/login"));
        Assert.Equal(RateLimitPolicies.OtpVerify, policies.PolicyFor("/api/auth/otp/verify"));
        Assert.Equal(RateLimitPolicies.OtpRequest, policies.PolicyFor("/api/auth/otp/request"));
        Assert.Equal(RateLimitPolicies.Pin, policies.PolicyFor("/api/auth/pin"));
        Assert.Equal(RateLimitPolicies.Recovery, policies.PolicyFor("/api/auth/recovery/complete"));

        // Anything else falls to the broad backstop, never to a credential limit.
        Assert.Equal(RateLimitPolicies.Api, policies.PolicyFor("/api/files"));
    }

    [Fact]
    public void CredentialLimitsAreStricterThanTheBroadBackstop()
    {
        var all = Build(new Dictionary<string, string?>()).All;

        // A six-digit OTP has a million combinations, so the guessing surface has
        // to be far tighter than ordinary API traffic.
        Assert.True(all[RateLimitPolicies.OtpVerify].PermitLimit < all[RateLimitPolicies.Api].PermitLimit);
        Assert.True(all[RateLimitPolicies.Pin].PermitLimit < all[RateLimitPolicies.Api].PermitLimit);
        Assert.True(all[RateLimitPolicies.Login].PermitLimit < all[RateLimitPolicies.Api].PermitLimit);
    }

    [Fact]
    public void ReadsLimitsFromConfiguration()
    {
        var policies = Build(new Dictionary<string, string?>
        {
            ["RateLimiting:Login:Limit"] = "3",
            ["RateLimiting:Login:WindowSeconds"] = "30",
        });

        Assert.Equal(3, policies.All[RateLimitPolicies.Login].PermitLimit);
        Assert.Equal(TimeSpan.FromSeconds(30), policies.All[RateLimitPolicies.Login].Window);
    }

    [Fact]
    public void CanBeDisabledWithoutRemovingTheMiddleware()
    {
        var policies = Build(new Dictionary<string, string?> { ["RateLimiting:Enabled"] = "false" });
        Assert.False(policies.Enabled);
    }

    [Fact]
    public void NonsensicalConfigurationIsClampedRatherThanDisablingTheLimit()
    {
        // A zero or negative limit must not silently become "unlimited".
        var policies = Build(new Dictionary<string, string?>
        {
            ["RateLimiting:Login:Limit"] = "0",
            ["RateLimiting:Login:WindowSeconds"] = "0",
        });

        var login = policies.All[RateLimitPolicies.Login];
        Assert.True(login.PermitLimit >= 1);
        Assert.True(login.Window >= TimeSpan.FromSeconds(1));
    }

    private static RateLimitPolicies Build(Dictionary<string, string?> values) =>
        new(new ConfigurationBuilder().AddInMemoryCollection(values).Build());
}