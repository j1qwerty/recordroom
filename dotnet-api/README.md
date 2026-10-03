# Record Room API

ASP.NET Core 10 + EF Core 10 + SQL Server. This is the server side of the
record-room app; the frontend (`../record-room-frontend/`) is its only client.

## Running it

Requires .NET 10 SDK and a reachable SQL Server (Express is fine). Default
connection string targets `localhost` with Windows integrated security and
creates the `RecordRoom` database on first run.

```bash
cd src/RecordRoom.Api
dotnet run --urls http://localhost:5199
```

On startup the API applies EF migrations and, if the registry is empty, seeds
the demo dataset (3 rooms, 14 files, 3 batches, 4 receipts, 8 employees,
5 logins). Swagger is at `/swagger`, health at `/api/health`.

### Demo logins

All use the password `Demo@12345`.

| User | Role | Notes |
| --- | --- | --- |
| `admin` | Admin | every capability |
| `supervisor` | Supervisor | all but user management |
| `operator` | Operator | desk work: register, issue, return, upload |
| `employee` | Employee | read-only registry and reports |
| `deputy.ceo` | Supervisor | deactivated, to exercise the refusal path |

Mobile sign-in accepts PIN `1234`. OTP sign-in issues a code that is logged
server-side and never returned over HTTP.

## Tests

No browser involved. `scripts/test-api.ps1` drives the real HTTP surface against
a real database and exits non-zero on the first failed assertion.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\test-api.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\test-api.ps1 -BaseUrl http://localhost:5199
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\test-api.ps1 -SkipDestructive   # read-only pass
```

142 assertions covering auth, the location hierarchy guards, registry
validation, multi-file issue with a partial return, audit and movement trails,
digitization versioning, bulk classification, barcodes, reports, dashboard
aggregates and role-based access control.

## Layout

```
Domain/          entities and enums, no framework dependencies
Application/     Result<T>, DTOs, display-name mapping, service interfaces
  Services/      one file per bounded area; all writes go through IAuditWriter
Infrastructure/
  Auth/          password hashing, JWT claims, realtime channel names
  Cache/         ICacheService with a Redis and an in-memory implementation
  Data/          DbContext, migrations, seeder
  Jobs/          Hangfire background jobs
  Realtime/      SignalR hub and publisher
Api/Controllers/ thin HTTP layer, one controller per resource
```

## Design notes

**Writes are audited in the same transaction as the data.** `IAuditWriter`
writes the audit row, the movement event and the changed entity together, then
publishes to SignalR after commit. There is no path that changes data without
leaving a trace.

**The API is the authorization boundary.** `[Authorize(Roles = ...)]` on every
mutating endpoint mirrors the capability matrix in
`../record-room-frontend/src/services/permissions.ts`. Hiding a control in the
frontend is UX, not access control; the smoke test asserts the server refuses
what the matrix withholds.

**No `EnableRetryOnFailure`.** EF Core's retrying execution strategy cannot be
combined with user-initiated transactions, and issue/return and location writes
depend on explicit transactions. Transaction correctness wins.

**`collectionTotal` is not `total`.** The registry table holds whatever is
actually loaded, but `PagedResult<FileDto>.CollectionTotal` reports the legacy
collection size (2,478,450) so the UI can label its window honestly instead of
implying it holds every record.

**Enums cross the wire as strings, on both serializer stacks.** Controller
actions return `IResult`, and `Results.Ok(...)` resolves to a minimal-API
`JsonHttpResult`, which formats with `ConfigureHttpJsonOptions` rather than
MVC's `AddJsonOptions`. Configuring only one leaves enums as integers on half
the endpoints. `Application/Display.cs` maps them to the exact status strings
the frontend contract uses (`"Partially returned"`, `"Under Digitization"`).

**Redis is optional.** `Redis:ConnectionString` empty or unreachable means the
in-memory cache is used and nothing else changes. A Redis fault mid-request is
logged and served from memory rather than surfaced.

**Hangfire is optional too.** In-memory storage by default so the app runs with
no extra infrastructure. Set `Hangfire:Storage` to `SqlServer` to persist jobs.

## Configuration

| Key | Default | Meaning |
| --- | --- | --- |
| `ConnectionStrings:Default` | localhost, integrated security | SQL Server |
| `Jwt:SigningKey` | dev placeholder | must be at least 32 characters |
| `Jwt:ExpiryMinutes` | `120` | token lifetime |
| `Database:MigrateOnStartup` | `true` | apply migrations on boot |
| `Database:SeedOnStartup` | `true` | seed when the registry is empty |
| `Redis:ConnectionString` | empty | enables the Redis cache when set |
| `Hangfire:Storage` | `InMemory` | or `SqlServer` |
| `Cors:AllowedOrigins` | `http://localhost:5173` | frontend origin |
| `Swagger:Enabled` | `true` | serve `/swagger` |

Migrations and the seeder never crash the process: a database that is not
reachable yet is logged and reported by `/api/health` instead.

## Real-time

Hub at `/hubs/recordroom`. A client calls `Subscribe(channels)` with the
channels its view depends on (`files`, `locations`, `issues`, `movements`,
`digitization`, `audit`, `dashboard`, `uploads`). Every connection joins
`dashboard` automatically, so the stat cards stay live on every screen.

A write publishes `notification` to its channel and to `dashboard`, after
clearing the cached aggregates so a client that refetches on the notification
cannot read a count one write stale. Publishing is best-effort: a SignalR
failure never fails a write that already committed.