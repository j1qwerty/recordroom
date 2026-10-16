using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using RecordRoom.Api.Application;
using RecordRoom.Api.Application.Contracts;
using RecordRoom.Api.Application.Services;
using RecordRoom.Api.Infrastructure.Auth;
using RecordRoom.Api.Infrastructure.Cache;
using RecordRoom.Api.Infrastructure.Data;
using RecordRoom.Api.Infrastructure.Jobs;
using RecordRoom.Api.Infrastructure.Realtime;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------- configuration
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // No EnableRetryOnFailure on purpose: the EF Core retrying execution strategy
    // cannot be combined with user-initiated transactions, and this API relies on
    // explicit transactions for issue/return and location writes. Transaction
    // correctness wins over transient-fault resilience.
    options.UseSqlServer(connectionString, sql =>
        sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName));

    if (builder.Environment.IsDevelopment())
        options.EnableDetailedErrors().EnableSensitiveDataLogging();
});

// Bind through the options system so IOptions<JwtOptions> resolves for any service
// that asks for it, and keep a direct instance for startup validation.
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (jwtOptions.SigningKey.Length < 32)
    throw new InvalidOperationException("Jwt:SigningKey must be at least 32 characters.");
builder.Services.AddSingleton(jwtOptions);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Read claims exactly as issued. Without this, JwtBearer rewrites "sub"
        // into ClaimTypes.NameIdentifier on the way in, and any code that looks
        // up "sub" silently gets null.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
            // Keep the raw claim names. Without this, JwtBearer rewrites "sub" to
            // ClaimTypes.NameIdentifier on the way in and the accessor has to guess.
            // Identity.Name should be the login, not the numeric id.
            NameClaimType = "preferred_username",
            // The API is the authorization boundary, so the role claim is trusted.
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    // Required for the SignalR websocket fallback.
    .AllowCredentials()));

// ------------------------------------------------------------------ redis/cache
builder.Services.AddMemoryCache();
var redisConnection = builder.Configuration["Redis:ConnectionString"];
builder.Services.AddSingleton<ICacheService>(sp =>
{
    var memory = sp.GetRequiredService<Microsoft.Extensions.Caching.Memory.IMemoryCache>();
    var log = sp.GetRequiredService<ILogger<Program>>();

    if (string.IsNullOrWhiteSpace(redisConnection))
    {
        log.LogInformation("No Redis:ConnectionString configured; using the in-memory cache.");
        return new MemoryCacheService(memory);
    }

    try
    {
        var mux = ConnectionMultiplexer.Connect(redisConnection);
        log.LogInformation("Redis connected at {Redis}.", redisConnection);
        return new RedisCacheService(mux, memory, sp.GetRequiredService<ILogger<RedisCacheService>>());
    }
    catch (Exception ex)
    {
        // Redis is optional. A bad host or a stopped server must degrade to the
        // in-memory cache rather than preventing startup.
        log.LogWarning(ex, "Redis unavailable at {Redis}; falling back to the in-memory cache.", redisConnection);
        return new MemoryCacheService(memory);
    }
});

// ----------------------------------------------------------------------- hangfire
// In-memory storage by default so the app runs with no extra infrastructure.
// Set Hangfire:Storage=SqlServer to persist jobs in the same SQL Server.
var hangfireStorage = builder.Configuration["Hangfire:Storage"] ?? "InMemory";
builder.Services.AddHangfire(config =>
{
    if (string.Equals(hangfireStorage, "SqlServer", StringComparison.OrdinalIgnoreCase))
        config.UseSqlServerStorage(connectionString);
    else
        config.UseMemoryStorage();
});

// Cron expressions are configuration, not code: a site may need the overdue
// sweep at a different cadence, and nobody should have to rebuild to change it.
var overdueCron = builder.Configuration["Hangfire:OverdueSweepCron"] ?? "*/15 * * * *";
var pruneCron = builder.Configuration["Hangfire:AuditRetentionCron"] ?? "30 2 * * *";

// Scoped, not singleton: it stamps audit rows with the caller identity, which comes from IHttpContextAccessor.
builder.Services.AddScoped<IAuditWriter, AuditWriter>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICurrentUserAccessor, CurrentUserAccessor>();
builder.Services.AddScoped<ILocationsService, LocationsService>();
builder.Services.AddScoped<IFilesService, FilesService>();
builder.Services.AddScoped<IRecordFileDocumentsService, RecordFileDocumentsService>();
builder.Services.AddSingleton<IPrivateDocumentStore, PrivateDocumentStore>();
builder.Services.AddScoped<IIssuesService, IssuesService>();
builder.Services.AddScoped<IDigitizationService, DigitizationService>();
builder.Services.AddScoped<IEmployeesService, EmployeesService>();
builder.Services.AddScoped<IUsersService, UsersService>();
builder.Services.AddScoped<IContentService, ContentService>();
builder.Services.AddScoped<IUploadsService, UploadsService>();
builder.Services.AddScoped<IBulkService, BulkService>();
builder.Services.AddScoped<IBarcodeService, BarcodeService>();
builder.Services.AddScoped<IReadService, ReadService>();
builder.Services.AddScoped<IReportsService, ReportsService>();
builder.Services.AddScoped<RecordRoomJobs>();
builder.Services.AddSingleton<IRealtimePublisher, RealtimePublisher>();
builder.Services.AddHttpContextAccessor();
// Enums must serialize as strings: the frontend contract uses readable status
// values ("Issued", "Partially returned"), and numbers would make the client's
// StatusBadge fall through to its neutral default.
//
// Both option sets are needed. The controller actions return IResult, and
// Results.Ok(...) resolves to a minimal-API JsonHttpResult, which formats with
// HttpJsonOptions rather than MVC's JsonOptions. Configuring only one of the two
// leaves enums as integers on half the endpoints.
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()));

builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(
    new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

const string BearerScheme = "bearer";
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Record Room API", Version = "v1" });
    c.AddSecurityDefinition(BearerScheme, new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the token returned by /api/auth/login.",
    });
    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference(BearerScheme, null)] = []
    });
});

var app = builder.Build();

// -------------------------------------------------------------- migrate + seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    if (app.Configuration.GetValue("Database:MigrateOnStartup", true))
    {
        try
        {
            await db.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied.");
        }
        catch (Exception ex)
        {
            // A database that is not reachable must not crash the process.
            // /api/health reports the degradation and the app still starts.
            logger.LogError(ex, "Database migration failed. The API starts but data endpoints will error.");
        }
    }

    if (app.Configuration.GetValue("Database:SeedOnStartup", true))
    {
        try
        {
            await DatabaseSeeder.SeedAsync(db, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Seeding failed.");
        }
    }
}

if (app.Environment.IsDevelopment() || app.Configuration.GetValue("Swagger:Enabled", true))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RecordRoomHub>("/hubs/recordroom");

// ------------------------------------------------------------------ scheduling
// Registered after the host is built so the recurring definitions exist before
// the first request can enqueue work. Guarded by configuration: a test run or a
// read-only replica should not start sweeping the registry behind the operator's
// back.
if (app.Configuration.GetValue("Hangfire:EnableScheduling", true))
{
    // IRecurringJobManager from DI, not the static RecurringJob helper: the
    // static API reads JobStorage.Current, which is only set once the service
    // provider has been built, so calling it here would throw at startup.
    var recurring = app.Services.GetRequiredService<IRecurringJobManager>();

    recurring.AddOrUpdate<RecordRoomJobs>(
        "mark-overdue-receipts",
        job => job.MarkOverdueReceiptsAsync(),
        overdueCron,
        new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

    recurring.AddOrUpdate<RecordRoomJobs>(
        "prune-old-audit",
        job => job.PruneOldAuditAsync(),
        pruneCron,
        new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

    app.Logger.LogInformation(
        "Hangfire scheduled: overdue receipts '{OverdueCron}', audit retention '{PruneCron}' (UTC).",
        overdueCron,
        pruneCron);
}
else
{
    app.Logger.LogInformation("Hangfire scheduling is disabled by configuration.");
}

app.MapGet("/api/health", async (AppDbContext db, ICacheService cache) =>
{
    var dbOk = true;
    var dbError = "Connected";
    try
    {
        dbOk = await db.Database.CanConnectAsync();
        if (!dbOk) dbError = "Not reachable";

        // Reachability is not the same as a usable schema. A migration that fails
        // on boot leaves the process alive and the port open, so without this the
        // deploy health check passes while every data endpoint returns 500.
        if (dbOk)
        {
            var pending = (await db.Database.GetPendingMigrationsAsync()).ToArray();
            if (pending.Length > 0)
            {
                dbOk = false;
                dbError = $"{pending.Length} pending migration(s): {string.Join(", ", pending)}";
            }
        }
    }
    catch (Exception ex)
    {
        dbOk = false;
        dbError = ex.Message;
    }

    return Results.Ok(new HealthDto(
        dbOk ? "Healthy" : "Degraded",
        dbError,
        // Only claim the distributed cache when it is genuinely reachable. With
        // abortConnect=false the multiplexer is constructed even if Redis is
        // down, so IsDistributed alone would report a healthy cache that caches
        // nothing. A cache failure is not a reason to fail the whole app, so it
        // is surfaced here rather than folded into the overall status.
        cache.IsDistributed && cache.IsReachable,
        string.Equals(hangfireStorage, "SqlServer", StringComparison.OrdinalIgnoreCase)
            ? "SqlServer"
            : "InMemory",
        DateTime.UtcNow));
}).WithTags("Health").AllowAnonymous();

app.Run();

/// <summary>Exposed so the integration tests can boot the real pipeline.</summary>
public partial class Program;
