using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace RecordRoom.Api.Infrastructure.Data;

/// <summary>
/// Lets `dotnet ef` build a context without starting the whole host. The app
/// host is not usable at design time: it would try to migrate and seed a real
/// database just to read the model, and its scoped/singleton services cannot be
/// validated outside a request.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("RECORDROOM_CONNECTION")
            ?? "Server=localhost;Database=RecordRoom;Trusted_Connection=True;TrustServerCertificate=True";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(connectionString, sql =>
                sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
            .Options;

        return new AppDbContext(options);
    }
}