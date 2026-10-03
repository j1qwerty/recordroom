using System.Security.Cryptography;
using System.Text;

namespace RecordRoom.Api.Infrastructure.Auth;

/// <summary>
/// PBKDF2-HMAC-SHA256 password hashing with a per-user random salt.
/// OWASP recommends at least 600,000 iterations for PBKDF2-HMAC-SHA256; this
/// uses 210,000 which matches the ASP.NET Core Identity default and keeps login
/// latency acceptable for an interactive desk.
/// </summary>
public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 210_000;

    public static (string Hash, string Salt) Create(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password), salt, Iterations, HashAlgorithmName.SHA256, HashSize);
        return (Convert.ToHexString(hash), Convert.ToHexString(salt));
    }

    public static bool Verify(string password, string hashHex, string saltHex)
    {
        if (string.IsNullOrWhiteSpace(hashHex) || string.IsNullOrWhiteSpace(saltHex)) return false;
        try
        {
            var salt = Convert.FromHexString(saltHex);
            var expected = Convert.FromHexString(hashHex);
            var actual = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password), salt, Iterations, HashAlgorithmName.SHA256, expected.Length);
            // Fixed-time comparison; a plain == would leak a timing signal.
            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}