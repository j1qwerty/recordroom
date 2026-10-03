using RecordRoom.Api.Infrastructure.Auth;

namespace RecordRoom.Api.Tests;

/// <summary>
/// Hashing is the one place where a subtle mistake is invisible in review and
/// catastrophic in production, so it gets direct coverage: a wrong password must
/// not verify, and the same password must never produce the same hash twice.
/// </summary>
public class PasswordHasherTests
{
    [Fact]
    public void Verify_accepts_the_original_password()
    {
        var (hash, salt) = PasswordHasher.Create("Demo@12345");

        Assert.True(PasswordHasher.Verify("Demo@12345", hash, salt));
    }

    [Fact]
    public void Verify_rejects_a_wrong_password()
    {
        var (hash, salt) = PasswordHasher.Create("Demo@12345");

        Assert.False(PasswordHasher.Verify("Demo@12346", hash, salt));
        Assert.False(PasswordHasher.Verify("", hash, salt));
        Assert.False(PasswordHasher.Verify("demo@12345", hash, salt));
    }

    [Fact]
    public void Verify_rejects_garbage_instead_of_throwing()
    {
        // A malformed row must read as "does not match", not crash the login path.
        Assert.False(PasswordHasher.Verify("anything", "not-hex", "also-not-hex"));
        Assert.False(PasswordHasher.Verify("anything", string.Empty, string.Empty));
    }

    [Fact]
    public void The_same_password_hashes_differently_each_time()
    {
        // Per-user salt: two accounts sharing a password must not share a hash.
        var first = PasswordHasher.Create("Demo@12345");
        var second = PasswordHasher.Create("Demo@12345");

        Assert.NotEqual(first.Salt, second.Salt);
        Assert.NotEqual(first.Hash, second.Hash);
        Assert.True(PasswordHasher.Verify("Demo@12345", first.Hash, first.Salt));
        Assert.True(PasswordHasher.Verify("Demo@12345", second.Hash, second.Salt));
    }

    [Fact]
    public void A_hash_cannot_be_replayed_with_another_users_salt()
    {
        var alice = PasswordHasher.Create("Demo@12345");
        var bob = PasswordHasher.Create("Demo@12345");

        Assert.False(PasswordHasher.Verify("Demo@12345", alice.Hash, bob.Salt));
    }

    [Fact]
    public void An_empty_password_still_produces_a_usable_hash()
    {
        // Creation must not special-case empty input; only length policy upstream
        // decides whether an empty password is acceptable.
        var (hash, salt) = PasswordHasher.Create(string.Empty);

        Assert.True(PasswordHasher.Verify(string.Empty, hash, salt));
        Assert.False(PasswordHasher.Verify("x", hash, salt));
    }
}