# Security requirements

## Browser-side rules

- No service-account credentials in the frontend.
- No private API key or database credential committed to source.
- No third-party backend SDK is shipped in the browser bundle. Persistence is a local snapshot until `dotnet-api/` exists.
- Treat all frontend route protection as navigation convenience, not authorization.
- Avoid `dangerouslySetInnerHTML` for record data.
- Validate and constrain external image URLs before persisting them.
- Preserve alt text for user-supplied media.

## Backend requirements for production

- Server-side authorization on every file/document/report endpoint.
- Department and designation scope enforced by backend policy.
- Audit access to sensitive records and exports.
- Immutable/append-only audit semantics.
- HTTPS only.
- Short-lived access tokens and secure session handling.
- CSRF protections appropriate to the selected authentication model.
- Rate limiting on login, search and bulk-operation endpoints.

## Rate limiting

Implemented in `Infrastructure/RateLimiting`. A fixed-window counter per client IP,
keyed `rr:ratelimit:{policy}:{ip}` in Redis so the quota is shared across API nodes
rather than per process.

| Policy | Route | Default |
| --- | --- | --- |
| `login` | `POST /api/auth/login` | 10 / 60s |
| `otp-verify` | `POST /api/auth/otp/verify` | 10 / 60s |
| `pin` | `POST /api/auth/pin` | 10 / 60s |
| `otp-request` | `POST /api/auth/otp/request` | 5 / 300s |
| `recovery` | `POST /api/auth/recovery/*` | 3 / 900s |
| `api` | every other POST | 600 / 60s |

Credential routes are matched by exact path; everything else falls to the `api`
backstop, so a new endpoint is never silently caught by a credential limit.

Deliberate choices:

- **Only POST is limited.** GETs are cheap and blocking them would break normal
  browsing and the SignalR negotiate.
- **The limiter runs before authentication**, because the endpoints that matter
  for abuse are the anonymous credential ones.
- **Redis failures fail open.** A cache outage must not become an outage of the
  login page. Losing Redis costs abuse resistance, not availability.
- **ASP.NET Core's built-in rate limiter is not used** — it counts per process,
  so on N nodes the effective limit would silently be N times the configured one.

Rejections return `429` with the standard API error envelope, plus `Retry-After`
and `X-RateLimit-Limit` / `X-RateLimit-Remaining` headers.

Overrides live in configuration (`RateLimiting:*`) and are written by
`deploy-recordroom.ps1`. A zero or negative configured limit is clamped to 1 so a
typo cannot silently disable the limit.

## SignalR backplane

`AddStackExchangeRedis` is registered when `Redis:ConnectionString` is set, with
channel prefix `recordroom:signalr:` so the pub/sub channels cannot collide with
the other applications sharing the Redis instance. Without it, realtime events
raised on one node never reach a client connected to another.

Not registered when no connection string is configured: a deployment without
Redis keeps working with node-local hub groups rather than failing to start.
- Upload size/type validation and antivirus/malware scanning where required.
- Content hash for stored digital documents.
- Signed, permission-checked document URLs rather than public object-storage URLs.
- Secrets only in secret management/environment configuration.
- Database backup encryption and controlled restore access.

## AI search requirements

Authorization must be applied before retrieval and before any LLM/embedding context is constructed. Every AI answer should link back to source record IDs. The model must not be allowed to invent or infer document access permissions.
