# V2 — Editable role permissions

**Status: not implemented. This document is the plan.**

v1 ships the permission matrix as **read-only reference text**. This file records
why, and exactly how the editable version would be built when it is scheduled.

## Why the matrix is read-only in v1

Two reasons, both deliberate:

1. **Legacy parity.** The legacy PHP app had fixed roles. `User.php` hardcoded the
   Admin/Supervisor/Operator/Employee capability lists in PHP. Making them
   data-driven is new behaviour, not a port, so it belongs in a later phase.
2. **It would be cosmetic without enforcement.** See the next section — v1 does
   not enforce the permission list anywhere. An editable matrix on top of that
   would let an admin revoke a capability from a role, see the UI change, and
   still be allowed through the API. That is worse than a read-only matrix,
   because it looks authoritative while lying.

## What v1 actually enforces (read this first)

This is the important part, and it is easy to get wrong by reading the matrix
at face value.

**The frontend** gates on permissions, synchronously:

- `src/services/permissions.ts` — the `matrix` const and `can(role, permission)`.
- `src/hooks/useService.ts:141` — `useSession().allowed(permission)`, a thin
  wrapper over `can`.
- 16 files call `can()` / `allowed()`, including the route guard
  (`src/layouts/RouteGuards.tsx:47`) and both nav filters
  (`src/layouts/Sidebar.tsx:98`, `src/admin/AdminLayout.tsx:35`).

**The API enforces nothing from that list.** Authorization is expressed purely as
role names in attributes:

```csharp
[Authorize(Roles = "Admin,Supervisor")]   // ContentController.cs, LocationsController.cs, …
[Authorize(Roles = "Admin")]
```

`AuthService.PermissionsForRole()` (`Application/Services/AuthService.cs:289`)
duplicates the four frontend lists — its own doc comment says *"Same capability
list as the frontend `services/permissions.ts`"* — but it has exactly one caller:
`AuthController.cs:61`, which hands the list to the client so the UI can hide
controls. It is never consulted for an authorization decision.

So in v1 the two lists are duplicated string arrays that must be kept in sync by
hand, and revoking a permission would change the UI only. `docs/SECURITY.md`
already requires the API to re-check every one of these server-side; that work is
**not done**, and this document is the design for doing it.

---

## v2 design

### 1. Schema

One table. Grants are stored as present-rows (absence means "not granted"), so
adding a new permission to `PERMISSIONS` does not require a migration or a
backfill — every role simply lacks it until granted.

```sql
CREATE TABLE role_permission (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    role        NVARCHAR(32)  NOT NULL,   -- Admin | Supervisor | Operator | Employee
    permission  NVARCHAR(64)  NOT NULL,   -- matches PERMISSIONS in permissions.ts
    granted_by  NVARCHAR(64)  NULL,       -- userName, for the audit trail
    granted_at  DATETIME2     NOT NULL,
    CONSTRAINT uq_role_permission UNIQUE (role, permission)
);
CREATE INDEX ix_role_permission_role ON role_permission (role);
```

Reuse the existing `AppUser`/audit tables. Do **not** add a `permission` table:
`PERMISSIONS` is a compile-time union in TypeScript, and keeping it that way is
what lets `can()` stay type-safe. If a data-driven permission catalogue is
genuinely wanted later, that is a separate decision.

Migration: `dotnet ef migrations add AddRolePermission`, following the existing
naming in `src/RecordRoom.Api/Migrations/`.

Seed: insert the 4 current lists verbatim from `PermissionsForRole` so the
migration is behaviour-preserving. The seed must be idempotent and must run
only when `role_permission` is empty, so restarts never re-add a grant an admin
revoked.

### 2. Server-side enforcement (the actual goal)

Replace role-name attributes with a permission requirement.

```csharp
public sealed class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}

public sealed class PermissionHandler(IPermissionService perms)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext ctx, PermissionRequirement req)
    {
        var role = ctx.User.FindFirst(ClaimTypes.Role)?.Value;
        if (role is not null && perms.Has(role, req.Permission))
            ctx.Succeed(req);
        return Task.CompletedTask;
    }
}
```

Then, instead of `[Authorize(Roles = "Admin,Supervisor")]` on
`ContentController`/`LocationsController`/`FilesController`/etc:

```csharp
[Authorize(Policy = "perm:digitization.review")]
```

Each existing role list maps to a policy. This is the point of the whole change:
after it, a revoked grant is enforced on the server and the `Roles =` attributes
can be deleted.

**Caching.** `IPermissionService.Has()` is consulted per authorized request.
Cache the matrix in `IMemoryCache` keyed by role, invalidated by a
`role_permission` write (bump a version stamp; never clear the whole cache).
Re-reading from SQL on every request is not acceptable at the issue-desk volume.

**Token claims — deliberately avoided.** The tempting optimisation is to embed
`permissions` in the JWT so no lookup is needed. Rejected for now: a revoked
permission would stay live until the token expired, which for an archival system
is not acceptable. If the lookup cost later shows up in profiling, the fix is a
short access-token lifetime plus the same cache — not unverified claims.

### 3. Contract seam

`record-room-frontend/src/services/contracts.ts`, appended to `UsersApi`:

```ts
/** Full role → permission matrix. Absent permission means "not granted". */
permissionsMatrix(): Promise<RolePermissionMatrix>;
setPermission(role: Role, permission: Permission, granted: boolean): Promise<Result<true>>;
```

Per `AGENTS.md`, all three must land in the same commit:

- `src/services/contracts.ts` — the two methods above.
- `src/services/impl/users.ts` — in-memory matrix seeded from the current
  `permissions.ts` lists, so `local` mode is fully functional with no backend.
- `src/services/http/users.ts` — calls the new endpoints.
- `dotnet-api/.../UsersController.cs` — `GET /api/permissions/matrix` and
  `PUT /api/permissions/{role}/{permission}`. Both behind
  `users.edit`; writes also require the Admin row guard described below.

### 4. API shape

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/permissions/matrix` | `users.view` | Returns `{ role: Permission[] }` for all roles. |
| `PUT` | `/api/permissions/{role}/{permission}` | `users.edit` + Admin | Body `{ granted: bool }`. |

Single-cell `PUT` rather than a bulk matrix `POST` so a concurrent edit from two
admins cannot silently clobber a grant the other did not intend to change.

### 5. Keeping `can()` synchronous

This is the main frontend constraint. `can()` is called **synchronously** in 16
files, including a route guard. Making the matrix async would either break all
of them or force every call site into a suspense boundary — neither is
acceptable.

Resolution: keep `can()` synchronous and back it with an external store, seeded
from the current hardcoded matrix so first paint is byte-identical to v1.

```ts
// src/services/permissionsStore.ts  (new)
let snapshot: RolePermissionMatrix = MATRIX_V1;     // v1 lists, unchanged
const listeners = new Set<() => void>();

export const permissionsStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
  get: () => snapshot,
  replace(next: RolePermissionMatrix) {
    snapshot = next;
    listeners.forEach((fn) => fn());
  },
};
```

- `can(role, permission)` reads `permissionsStore.get()` instead of the module
  const. **Every existing call site keeps compiling unchanged.**
- `useSession().allowed` stays synchronous but must *subscribe*, otherwise
  components will not re-render when the matrix is replaced. It is already a
  hook, so this is `useSyncExternalStore(permissionsStore.subscribe, ...)` —
  the same pattern `RouteGuards.tsx:17` already uses for the session.
- Hydrate the store once after sign-in (and on `local` mode, from the in-memory
  adapter). Until it resolves, `can()` answers from the v1 seed, so there is no
  flash of a wrongly-denied control.
- Delete `const matrix` from `permissions.ts`, keeping `PERMISSIONS`,
  `permissionsFor` and `can` exported so the 16 call sites are untouched.

### 6. Admin row is locked

Per the v2 decision: the **Admin column is read-only**, rendered with an
explanatory note rather than disabled checkboxes.

Rationale: Admin is the recovery path. If Admin can revoke its own
`users.edit` or `users.view`, the last administrator locks every account out of
user management, and the only remedy is direct database access. A role that
cannot edit itself cannot strand the system.

Consequences to accept:

- Custom Admin permission sets are not possible in v2. If that is required
  later it needs a second, non-self-editable role, not a loophole here.
- The frontend must not be the only place the guard exists — the `PUT` endpoint
  rejects `role == Admin` server-side too, since the API is the real boundary.

Additionally, block removing the **last** remaining `users.edit` holder across
all roles, not just Admin. Two guards, both server-side:

```csharp
if (role == Role.Admin) return Result.Fail("The Admin role is fixed.");
if (!granted && permission == "users.edit" && await CountHoldersAsync("users.edit") <= 1)
    return Result.Fail("At least one role must keep users.edit.");
```

### 7. UI

`src/admin/UsersPage.tsx` — turn each editable cell into a checkbox:

- Gate the whole section behind `allowed('users.edit')`; read-only viewers keep
  seeing the matrix as static text.
- Admin column: static, with a `title`/`hint` saying it is fixed.
- Optimistic update + `reload()` on success; revert and flash `result.error` on
  failure, matching the existing `toggleActive`/`remove` handlers.
- Every write goes to the audit log (`granted_by`/`granted_at` above, plus an
  `AuditAction` entry) — permission changes are exactly the event the audit log
  exists for.

Keep the guard visible: the footer on that card currently claims the API must
enforce every check server-side. After v2 that becomes true, and the footer
should be reworded to say the matrix is enforced server-side rather than
hiding controls.

### 8. Tests

- `dotnet-api/scripts/test-api.ps1` (currently 142 assertions) — add: grant a
  permission, assert it appears in the matrix; assert `PUT` on the Admin role is
  rejected; assert revoking the last `users.edit` is rejected; assert the
  capability is genuinely enforced on a guarded endpoint (grant → allowed,
  revoke → 403) rather than merely absent from the matrix.
- `tests/api-contract.test.ts` (19 assertions, auto-skips when the API is down) —
  round-trip a grant through the HTTP adapter.
- `tests/services.test.ts` — in-memory adapter: grant, revoke, and confirm the
  `permissionsStore` notifies subscribers so `allowed()` re-renders.
- A regression test that the seeded matrix equals the v1 lists, so the migration
  cannot silently change anyone's access.

### 9. Rollout order

1. Migration + seed (behaviour-preserving on its own).
2. `IPermissionService` + cache, still reading the seeded table.
3. Swap `[Authorize(Roles = ...)]` → permission policies. **This is the commit
   that actually changes enforcement**, and it needs its own review.
4. Contract + both frontend impls; `permissionsStore` extraction.
5. Editable UI, Admin column locked.
6. Audit wiring + the full test set above.

Steps 1–2 are safe and shippable independently; step 3 is the one to review
carefully, because a policy that grants nothing locks operators out mid-deploy.

## Known gaps this does not address

- Per-user overrides. v2 is role-level only, matching the legacy model. A user
  who needs an exception gets a role, not a bespoke grant.
- Department/record-level scoping. `PRD.md` §16.2 and §18 describe a fuller
  permission pipeline (`RolePermission`, `UserRole`, `UserDelegation`); that is a
  larger piece of work than the matrix editor and is not covered here.
- `docs/SECURITY.md` requires permission checks on document URLs and on any
  AI/embedding context. Unrelated to this feature, still open.