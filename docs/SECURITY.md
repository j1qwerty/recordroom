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
- Upload size/type validation and antivirus/malware scanning where required.
- Content hash for stored digital documents.
- Signed, permission-checked document URLs rather than public object-storage URLs.
- Secrets only in secret management/environment configuration.
- Database backup encryption and controlled restore access.

## AI search requirements

Authorization must be applied before retrieval and before any LLM/embedding context is constructed. Every AI answer should link back to source record IDs. The model must not be allowed to invent or infer document access permissions.
