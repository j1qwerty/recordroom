RECORD ROOM SOFTWARE
(Digitization) & Implementation

## Master Product Requirements Document (PRD)

Build-ready product, architecture, data model, workflow and implementation specification

> Implementation note: This PRD is a build specification. Unknown client-specific business rules are marked as configurable or requiring confirmation rather than silently assumed.

Contents

## 1. Executive summary

## 2. Product vision and objectives

## 3. Scope, assumptions and boundaries

## 4. Core product principles

## 5. User types and responsibility model

## 6. End-to-end business model

## 7. Physical record-room model

## 8. Identifier and barcode standards

## 9. Functional modules

## 10. Application navigation and page inventory

## 11. Detailed page specifications

## 12. Core workflows

## 13. Database architecture

## 14. Detailed database schema

## 15. API and integration specification

## 16. Search, OCR and AI search

## 17. Physical room and shelf visualizer

## 18. Security, identity and permissions

## 19. Notifications and real-time events

## 20. Reports and dashboards

## 21. Digitization operations and 25-lakh-file migration

## 22. Infrastructure and deployment

## 23. Non-functional requirements

## 24. Observability, backup and disaster recovery

## 25. Testing and quality assurance

## 26. Implementation plan, step by step

## 27. Phase deliverables and acceptance criteria

## 28. Data migration and cutover

## 29. Training, SOPs and handover

## 30. Risks and mitigations

## 31. Future enhancements

## 32. Glossary

## 33. Technology references

## 1. Executive summary

The Record Room Software is a web-based physical record management, file tracking, digitization and document access platform. Its defining feature is the direct relationship between the physical record room and its digital representation. A user must be able to search for a record and understand both the digital result and the exact physical location where the original is stored.

The application therefore models the full physical hierarchy: site, building, floor, room, almirah or rack, shelf, shelf section and file. Each physical storage object receives a human-readable code and a machine-readable barcode. Each file receives a permanent file identity that does not change when the physical file moves.

At scale, the system must support approximately 2.5 million physical files, bulk data entry, barcode generation, barcode scanning, issue and return operations, audit trails, digital scanning and OCR, full-text search, reports, role-based access, and a controlled path to semantic and AI-assisted search.

> Implementation note: The permanent file identifier is intentionally separate from physical location. This prevents file identity from becoming invalid when a record is moved from one shelf, room or site to another.

### 1.1 Target outcome

A searchable inventory of physical records and their current state.

A visual map of rooms, almirahs/racks and shelves that can be explored from the application.

A file search result that shows exact storage hierarchy and an approximate shelf position.

Barcode-controlled issue, return and movement with a complete audit history.

A digital copy and OCR text linked to the physical record where digitization has been completed.

Deterministic search first, followed by semantic and AI search without bypassing permissions.

Operational tools for high-volume data entry, barcode printing, scanning, validation and migration.

Management dashboards and downloadable PDF/Excel reports.

## 2. Product vision and objectives

### 2.1 Vision

Create a digital twin of the record room where the organization can answer, from one interface: what the record is, where it is, whether it is available, who currently holds it, what digital material exists, what happened to it over time, and what action should happen next.

### 2.2 Objectives

## 3. Scope, assumptions and boundaries

### 3.1 In scope

Record-room hierarchy and visual layout management.

Physical file master registry and metadata.

Barcode generation, label printing and barcode scanning.

File location assignment and location history.

Issue, return, transfer, movement and request workflows.

Digital document upload, preview, versioning and archival.

OCR processing and searchable text extraction.

Structured filters and full-text search.

Semantic/AI search as a controlled later phase.

User, role, designation, department and permission management.

Alerts, notifications, dashboards and reports.

Bulk import, data validation and digitization operations.

Audit logging and administrative controls.

Production deployment, backup, monitoring and operational handover.

### 3.2 Out of scope unless separately approved

Replacing the organization's broader ERP, HRMS, finance or e-office platform.

Uncontrolled public access to government records.

Automatic legal disposal of physical records without authorized approval.

AI-generated legal or policy decisions.

Changing codal/retention rules without an approved configuration.

Physical security systems such as CCTV, RFID gates or biometric hardware unless separately integrated.

A 3D digital twin in the first production version.

### 3.3 Key assumptions

The organization will provide the authoritative file identifiers, departments, retention rules and existing record registers.

Physical location can be normalized into a hierarchy that the system can manage.

Barcode scanners will behave as keyboard-input devices or use a documented SDK/API.

The deployment environment can provide SQL Server, file/object storage, HTTPS and scheduled backups.

The organization will define the legal/operational policy for what may be viewed, downloaded, printed or disposed.

Digitization quality control will be performed by trained staff using a defined SOP.

## 4. Core product principles

## 5. User types and responsibility model

## 6. End-to-end business model

### 6.1 Physical file lifecycle

RECEIVE

-> VERIFY METADATA

-> ASSIGN PERMANENT FILE ID

-> GENERATE/PRINT BARCODE

-> TAG PHYSICAL FILE

-> ASSIGN ROOM/ALMIRAH/SHELF

-> CONFIRM LOCATION

-> AVAILABLE

AVAILABLE

-> SEARCH / REQUEST

-> RETRIEVE

-> SCAN FILE BARCODE

-> ISSUE

-> WITH USER

WITH USER

-> RETURN

-> SCAN FILE BARCODE

-> VERIFY DESTINATION

-> SCAN SHELF / LOCATION BARCODE

-> CONFIRM

-> AVAILABLE

AVAILABLE

-> MOVE

-> SCAN SOURCE + DESTINATION

-> CONFIRM

-> LOCATION HISTORY CREATED

### 6.2 Digital document lifecycle

PHYSICAL FILE

-> SCAN

-> PDF / IMAGE PACKAGE

-> OCR

-> QUALITY CONTROL

-> METADATA VALIDATION

-> DIGITAL DOCUMENT CREATED

-> INDEX

-> SEARCHABLE

-> VIEW / DOWNLOAD / PRINT (PERMISSION CONTROLLED)

-> ARCHIVE / RETAIN

### 6.3 Core state model

## 7. Physical record-room model

### 7.1 Hierarchy

Tenant / Organization

Site

Building

Floor

Room

Storage Unit (Almirah / Rack / Cabinet)

Shelf

Shelf Section

Physical File

### 7.2 Storage unit requirements

Storage units must have a type: almirah, rack, cabinet, open-rack or other configured type.

Each storage unit has dimensions or display dimensions used by the visualizer.

Each storage unit may have shelves and optional shelf sections.

A storage unit may be active, inactive, under maintenance or decommissioned.

Location history must be preserved when a room or storage unit is renamed or reorganized.

The system should support temporary locations such as quarantine, scanning desk and missing-file desk.

### 7.3 Capacity model

Capacity should be represented at shelf level using a configurable measure. The first release should support an approximate slot/order model rather than pretending to know the exact physical millimeter position of every file.

## 8. Identifier and barcode standards

### 8.1 Permanent file identifier

RF-0000000001

RF-0000000002

RF-0000000003

RF means Record File. The numeric portion is a system-generated sequence. The format should remain stable for the life of the deployment.

### 8.2 Location identifiers

### 8.3 Location address

SITE-001 / BLD-001 / FL-02 / RM-004 / A-012 / S-05

### 8.4 Barcode rules

The barcode payload must identify the object, not encode the entire mutable location.

Code 128 should be the default linear barcode for file and location labels; QR can be supported for camera-based mobile scanning.

Human-readable text must be printed below or adjacent to the barcode.

Two physical file labels may point to the same file ID. They must not create two file records.

Reprinting a barcode must keep the same object ID unless the workflow explicitly records a replacement identity.

Damaged barcode replacement should be audited.

Barcode uniqueness is enforced at the database level.

### 8.5 Recommended label content

RECORD FILE

RF-0000124587

File No: ABC/2021/4587

Department: Revenue

Year: 2021

[ CODE 128 BARCODE ]

## 9. Functional modules

## 10. Application navigation and page inventory

## 11. Detailed page specifications

DASH-01 - Dashboard

ROOM-01 - Record room explorer

ROOM-02 - Room map

ROOM-05 - Layout designer

FILE-01 - File registry

FILE-03 - File detail

FILE-04 - Locate file

BAR-01 - Barcode center

MOVE-02 - Issue desk

MOVE-03 - Return desk

DIG-02 - Digitization batch detail

SEARCH-02 - AI search

REPORT-01 - Report center

ADMIN-05 - Audit log

## 12. Core workflows

### 12.1 New physical file onboarding

## 1. Operator opens Create File or imports a file through the bulk intake process.

## 2. System validates business identifiers against duplicate rules.

## 3. System generates permanent RF identifier.

## 4. System creates initial File record with status Draft.

## 5. Barcode job generates label payload tied to the RF identifier.

## 6. Operator prints and attaches the label to the physical file.

## 7. Operator scans the file barcode to start location assignment.

## 8. System asks for destination site, building, floor, room, storage unit and shelf.

## 9. Operator scans destination shelf barcode or selects it visually.

## 10. System validates that the destination is active and has available capacity.

## 11. Operator confirms placement.

## 12. System changes status to Available and creates a FileLocationHistory event.

## 13. Audit event is created for identity creation, barcode assignment and location confirmation.

### 12.2 Search and locate

## 1. User searches by file number, RF ID, subject, department, metadata, OCR text or advanced filters.

## 2. System applies authorization filters first.

## 3. System returns paginated results with current status.

## 4. User opens a record.

## 5. File detail shows current status and current holder if issued.

## 6. For Available records, Locate opens the room map.

## 7. Room map highlights the correct storage unit.

## 8. Storage unit view highlights the correct shelf.

## 9. Shelf view shows the approximate file position and neighboring file identifiers when permitted.

## 10. User may print a location slip for physical retrieval.

### 12.3 Issue

## 1. Custodian scans the file barcode.

## 2. System resolves the file and checks status.

## 3. System shows metadata and physical location.

## 4. Custodian identifies recipient/request.

## 5. If approval is required, system verifies approval before issue confirmation.

## 6. Custodian confirms issue.

## 7. System records IssueTransaction, MovementTransaction and AuditLog.

## 8. File status changes to Issued or With User.

## 9. Current holder becomes the authorized recipient or office.

## 10. The file disappears from current shelf occupancy and appears in the holder's active files.

### 12.4 Return

## 1. Custodian scans the returned file.

## 2. System verifies that the file is currently issued and returnable.

## 3. System shows previous storage location and any configured suggested destination.

## 4. Custodian scans the shelf barcode or selects a valid destination.

## 5. System validates destination.

## 6. Custodian physically places the file.

## 7. Custodian confirms placement.

## 8. System creates ReturnTransaction and FileLocationHistory.

## 9. File status changes to Available.

### 12.5 Physical move

## 1. Operator selects Move File or scans the file.

## 2. System records source location.

## 3. Destination is selected/scanned.

## 4. System validates move permission and destination state.

## 5. Operator confirms placement.

## 6. System creates a movement event and closes the prior active location.

## 7. Visual map and search index immediately use the new current location.

### 12.6 Missing-file workflow

## 1. Authorized operator starts Missing workflow from file detail or movement exception.

## 2. System captures last known location and last responsible user.

## 3. Reason and incident details are mandatory.

## 4. File status becomes Missing.

## 5. The file remains searchable but is not presented as physically available.

## 6. Authorized investigation updates the record and creates audit entries.

## 7. When recovered, the system requires barcode scan and new location confirmation before restoring Available status.

## 13. Database architecture

### 13.1 Database principles

Use relational integrity for all primary business relationships.

Use surrogate GUID/ULID-style keys internally where appropriate, but expose stable human-readable codes to users.

Enforce uniqueness at database level for barcode values and public codes.

Use UTC for event timestamps and store organization/local timezone configuration for display.

Use soft-delete or state transitions for records that must remain historically traceable.

Keep file/document metadata in SQL and binary content in controlled file/object storage.

Use rowversion/concurrency token or equivalent for high-conflict entities such as file location and issue state.

Add indexes based on actual query plans and production access patterns.

### 13.2 High-level entity relationship

Organization

├── Sites

│ └── Buildings

│ └── Floors

│ └── Rooms

│ └── StorageUnits

│ └── Shelves

│ └── ShelfSections

│

├── Departments

├── Designations

└── Users

└── Roles / Permissions

RecordFiles

├── FileBarcodes

├── FileMetadata

├── CurrentLocation -> Shelf/ShelfSection

├── FileLocationHistory

├── IssueTransactions

├── ReturnTransactions

├── MovementTransactions

├── DigitalDocuments

├── Retention / Disposal records

└── Audit events

## 14. Detailed database schema

### 14.1 Additional tables to include

Department, Designation, Category, Subcategory.

RetentionRule, RetentionEvent, DisposalRequest, DisposalApproval, DisposalCertificate.

Notification, NotificationRecipient, NotificationTemplate.

SearchIndexJob, OcrJob, ImportBatch, ImportRow, BarcodeBatch, BarcodeBatchItem.

ReportDefinition, ReportRun, ExportJob.

PermissionGroup, RolePermission, UserRole, UserDelegation.

FileTag, FileTagMap, SavedSearch.

IntegrationEndpoint, IntegrationCredentialReference, IntegrationEvent, IntegrationRetry.

SystemSetting, NumberSequence, PrinterProfile.

## 15. API and integration specification

### 15.1 API conventions

RESTful JSON APIs under /api.

Use resource identifiers in URLs; avoid exposing internal database sequence values.

Return standard HTTP status codes and a consistent problem-details error shape.

Use pagination with page/pageSize or cursor-based pagination for very large result sets.

All list endpoints must support explicit sorting and validated filter fields.

All write endpoints should be idempotent where a physical operation may be retried.

Long operations return a job ID and expose status through a job endpoint.

### 15.2 Integration boundaries

Identity provider: optional AD/LDAP/OIDC/SAML adapter depending client environment.

Storage provider: local/NAS or object-storage adapter.

OCR provider: internal engine or approved third-party/document intelligence adapter.

Email/SMS: adapter interface with provider-specific implementation.

Printer: browser print or server-side label-print service depending barcode hardware.

Dispatch/e-office: API/file-based integration after interface contract is supplied by the client.

## 16. Search, OCR and AI search

### 16.1 Search layers

### 16.2 Permission pipeline

User query

-> classify query / extract filters

-> retrieve candidate records

-> apply mandatory organization/department/security filters

-> retrieve permitted OCR/document chunks

-> rank results

-> optional AI synthesis

-> return sources + record IDs + location/status

### 16.3 OCR processing states

### 16.4 AI safeguards

Never return content from an unauthorized record.

Show source records for AI-generated summaries.

Do not allow AI to change file state or physical location without an explicit transactional workflow.

Log AI search request, model/version, retrieved record IDs and response metadata where policy permits.

Provide a deterministic search fallback if the AI provider is unavailable.

Treat OCR text as potentially inaccurate; the original scanned page remains authoritative.

## 17. Physical room and shelf visualizer

### 17.1 Technology

Use React + SVG for the initial visual layer. SVG provides selectable, scalable room objects without requiring a 3D engine.

### 17.2 Room visual model

Room

canvasWidth

canvasHeight

background

objects[]

id

type

x

y

width

height

rotation

zIndex

label

linkedEntityId

state

### 17.3 User interactions

Pan and zoom room map.

Click almirah/rack to open detail.

Hover to show label, type, occupancy and status.

Search within room.

Highlight a target file path.

Open shelf view from storage unit.

Show occupancy heatmap as an optional layer.

Use color and icon differences for Available, Full, Maintenance, Inactive and Selected states.

Keyboard navigation must remain possible for accessibility where practical.

### 17.4 Shelf visual model

Shelf

width

height

files[]

rfNumber

order

positionPercent

displayLabel

state

isTarget

> Implementation note: PositionPercent should be treated as approximate guidance. It is not a legal or engineering measurement of the physical file's exact position.

## 18. Security, identity and permissions

### 18.1 Authentication

Support application credentials as a minimum baseline.

Support organizational SSO/AD/OIDC/SAML through an adapter where the client requires it.

Short-lived access tokens or secure server sessions.

Refresh/session revocation.

Account lockout/rate limiting where applicable.

MFA support for privileged roles where infrastructure permits.

### 18.2 Authorization

Role-based permissions for coarse-grained access.

Policy-based rules for department, record category, operation and approval conditions.

Document content access must be separately checked from metadata visibility where needed.

Record-room custodians can manipulate physical state without automatically gaining unrestricted access to sensitive document content.

### 18.3 Protected operations

Change current location.

Issue/return.

Change retention or disposal state.

Delete/replace digital content.

Change roles and permissions.

Export large data sets.

View/export audit logs.

### 18.4 Audit requirements

Actor, timestamp, action, target entity, target ID, client IP/device if policy permits, success/failure and relevant before/after summary.

Avoid storing passwords, secrets or full sensitive document content in logs.

Audit retention must be configured to policy.

Critical audit events should be append-only from the application perspective.

## 19. Notifications and real-time events

### 19.1 Event examples

### 19.2 Real-time transport

Use ASP.NET Core SignalR for operational updates that benefit from near-real-time delivery. SignalR is suited to server-to-client updates, notifications and live dashboards. A Redis backplane can be considered if the application is scaled across multiple API instances.

## 20. Reports and dashboards

### 20.1 Export rules

Small exports may be generated synchronously.

Large exports become background jobs.

Export permissions are checked independently.

Excel exports must preserve identifiers as text to avoid numeric/date corruption.

PDF reports should include report title, generated time, filters and page numbers.

## 21. Digitization operations and 25-lakh-file migration

### 21.1 Operational model

Planning

-> Batch creation

-> Physical file preparation

-> Barcode verification

-> Scanning

-> Image/PDF quality check

-> OCR

-> Metadata validation

-> QC approval

-> Indexing

-> Digital completion

-> Physical file location confirmation

### 21.2 Batch entity

### 21.3 Import process

## 1. Import source register from validated CSV/XLSX.

## 2. Map source columns to target fields.

## 3. Run format and mandatory-field validation.

## 4. Run duplicate checks against existing data.

## 5. Produce an import preview with errors and warnings.

## 6. Allow operator to fix or re-upload.

## 7. Commit a valid batch transactionally.

## 8. Generate RF numbers for new records.

## 9. Queue barcode generation/printing.

## 10. Produce import report and audit event.

### 21.4 Physical reconciliation

The software should support periodic shelf-by-shelf stock verification.

Operator scans a shelf barcode to open a reconciliation session.

Each scanned file is marked seen in that session.

Files expected on the shelf but not scanned become exceptions.

Files scanned but assigned elsewhere become location mismatch exceptions.

Session is closed only after exceptions are acknowledged/resolved.

## 22. Infrastructure and deployment

### 22.1 Baseline application topology

Users / Browsers

|

v

Reverse proxy / IIS

|

+----------------------+

| |

v v

ASP.NET Core API Static React assets

|

+------------+-------------+-------------+

| | | |

v v v v

SQL Server Redis File/Object Worker

Storage Service

|

OCR / imports /

reports / index

### 22.2 Recommended software baseline

### 22.3 Deployment environments

Development: developer workstation/local containers where feasible.

Test/UAT: production-like database and storage separation.

Production: controlled HTTPS, restricted network paths, monitoring and backup.

Disaster recovery: separate backup target and documented restore runbook.

## 23. Non-functional requirements

## 24. Observability, backup and disaster recovery

### 24.1 Logs

API request logs with correlation ID.

Authentication events.

Authorization failures.

File state transitions.

Barcode validation failures.

Background job lifecycle.

OCR errors.

Integration retries.

### 24.2 Metrics

Requests/sec and latency.

Database query latency for key endpoints.

Active issue/return operations.

OCR queue length and failure rate.

Digitization throughput.

Storage growth.

Search latency.

Export queue length.

Failed login counts and lockouts.

### 24.3 Backup model

Do not rely on a provider's infrastructure backup as the only protection. The production design should have a documented organization-controlled backup strategy for SQL databases, digital document storage and configuration/secrets metadata, with restore testing.

## 25. Testing and quality assurance

### 25.1 Test levels

Unit tests for domain rules and state transitions.

Application/service tests for issue, return, move and authorization decisions.

API integration tests with SQL Server test database.

Frontend component and workflow tests.

End-to-end tests for search -> locate -> issue -> return.

Performance tests for large data sets and concurrent operations.

Security tests for authorization and document access.

Data migration rehearsal and reconciliation tests.

Disaster recovery restore test.

### 25.2 Critical test scenarios

## 26. Implementation plan, step by step

> Implementation note: Each step below is a deliverable gate. The next step should not begin blindly if the acceptance criteria of the current step are not satisfied.

Step 0 - Discovery and field validation

Implementation tasks

## 1. Collect current registers, file-number examples, room inventory, almirah/rack counts, shelf patterns, department list and codal/retention rules.

## 2. Map current dispatch -> record-room -> issue -> return processes.

## 3. Identify existing software and integration boundaries.

## 4. Confirm who is allowed to view, issue, download, print and dispose records.

## 5. Document exceptions and manual practices.

Exit / acceptance gate

Approved requirement baseline.

Approved role matrix.

Approved physical hierarchy.

Approved file lifecycle/state diagram.

Approved code/barcode convention.

Step 1 - Solution architecture and repo setup

Implementation tasks

## 1. Create Git repositories/solution.

## 2. Create .NET 10 solution with Api, Application, Domain, Infrastructure, Worker and Contracts projects.

## 3. Create React TypeScript application with feature modules.

## 4. Configure code formatting, static analysis, tests and CI.

## 5. Create configuration model and environment files.

## 6. Create base error contract, logging and correlation ID.

Exit / acceptance gate

Build passes.

API starts.

Frontend starts.

CI runs format/typecheck/test/build.

No environment secrets in source.

Step 2 - Database foundation

Implementation tasks

## 1. Create SQL Server database.

## 2. Create Organization/site/building/floor/room hierarchy.

## 3. Create storage unit and shelf entities.

## 4. Create user/role/department foundations.

## 5. Create migration strategy.

## 6. Create seed/reference-data strategy.

Exit / acceptance gate

Database migrations succeed from empty database.

Foreign keys and unique constraints exist.

Seed data produces a usable test record room.

Step 3 - Physical room visualizer

Implementation tasks

## 1. Create room layout model.

## 2. Create SVG map renderer.

## 3. Create storage-unit and shelf components.

## 4. Create admin layout designer.

## 5. Implement zoom, pan, selection and search highlighting.

## 6. Persist layout changes with version metadata.

Exit / acceptance gate

Admin can create a room.

Admin can place almirahs/racks.

User can open a room and drill into shelf level.

Visual object links to the correct storage entity.

Step 4 - File registry and identifier system

Implementation tasks

## 1. Create RecordFile and metadata tables.

## 2. Implement RF number generation.

## 3. Build create/edit/view pages.

## 4. Implement server-side pagination and filtering.

## 5. Implement duplicate detection rules.

## 6. Implement initial file-location assignment.

Exit / acceptance gate

File can be created and searched.

RF number is permanent.

File remains valid when location changes.

Step 5 - Barcode subsystem

Implementation tasks

## 1. Create barcode entity and batch job model.

## 2. Generate Code 128 labels.

## 3. Create label template.

## 4. Create print queue/batch pages.

## 5. Implement scanner validation endpoint and UI.

## 6. Support replacement/reprint workflow.

Exit / acceptance gate

A printed barcode scans back to the expected record.

Duplicate active barcode is impossible.

Replacement labels are audited.

Step 6 - Issue, return and movement

Implementation tasks

## 1. Create request, issue, return and movement entities.

## 2. Implement scanner-first issue desk.

## 3. Implement scanner-first return desk.

## 4. Implement physical move workflow.

## 5. Implement overdue state.

## 6. Add concurrency control and audit events.

Exit / acceptance gate

Issue and return work end-to-end with barcode scans.

Location history is complete.

Concurrent issue is prevented.

Step 7 - Authentication, authorization and audit

Implementation tasks

## 1. Implement identity.

## 2. Implement roles and permissions.

## 3. Implement department/policy filters.

## 4. Secure document endpoints.

## 5. Implement audit service.

## 6. Add administrator/auditor pages.

Exit / acceptance gate

Unauthorized access is blocked.

Audit captures all critical operations.

Privileged operations require explicit permission.

Step 8 - Digital document management

Implementation tasks

## 1. Implement file/object storage adapter.

## 2. Implement document upload and checksum.

## 3. Create preview/download endpoints.

## 4. Create document versioning.

## 5. Add archival status.

## 6. Link digital documents to RecordFile.

Exit / acceptance gate

Authorized user can view/download a document.

Unauthorized user cannot retrieve content.

Content hash is stored.

Step 9 - OCR and full-text search

Implementation tasks

## 1. Implement OCR worker.

## 2. Store page-level OCR text.

## 3. Build full-text index.

## 4. Add search result highlighting/snippets.

## 5. Add OCR QC state.

## 6. Add retry/exceptions.

Exit / acceptance gate

Search can find a known OCR phrase.

OCR failures are visible and retryable.

Search respects permissions.

Step 10 - Advanced/AI search

Implementation tasks

## 1. Add semantic indexing.

## 2. Define chunking strategy.

## 3. Implement retrieval with mandatory authorization filter.

## 4. Add natural-language query parsing.

## 5. Return sources and file links.

## 6. Log AI search events as policy permits.

Exit / acceptance gate

AI search returns only authorized records.

Every answer is source-linked.

Deterministic search remains available.

Step 11 - Bulk migration and digitization operations

Implementation tasks

## 1. Build import mapping UI.

## 2. Build validation preview.

## 3. Build import batch commit.

## 4. Build barcode batch generation.

## 5. Build scan/OCR/QC pipeline.

## 6. Build reconciliation sessions.

Exit / acceptance gate

### 100k-record rehearsal succeeds with reconciliation.

Import can resume after failure.

Duplicate and invalid rows are isolated.

Step 12 - Reports and dashboards

Implementation tasks

## 1. Implement report catalogue.

## 2. Implement filters and exports.

## 3. Implement large-export jobs.

## 4. Create management dashboard.

## 5. Create digitization and record-room dashboards.

Exit / acceptance gate

All required baseline reports run.

Excel and PDF outputs are readable.

Large reports do not block normal traffic.

Step 13 - Performance, security and production hardening

Implementation tasks

## 1. Profile key queries.

## 2. Review indexes.

## 3. Run concurrency tests.

## 4. Run security tests.

## 5. Configure monitoring, backups and restore.

## 6. Perform production-like UAT.

Exit / acceptance gate

Critical performance targets met.

Security findings resolved/accepted.

Restore test passes.

Step 14 - Pilot and rollout

Implementation tasks

## 1. Select pilot room/section.

## 2. Load controlled data.

## 3. Train operators.

## 4. Run parallel/manual verification.

## 5. Measure scan/search/issue/return performance.

## 6. Fix pilot findings.

## 7. Roll out room-by-room.

Exit / acceptance gate

Pilot signed off.

SOP and training material approved.

Rollout checklist complete.

## 27. Phase deliverables and acceptance criteria

### 27.1 Minimum production-ready MVP

Authenticated application.

Location hierarchy and visual room map.

File registry with permanent RF IDs.

Barcode creation/scanning.

Search and locate.

Issue/return/move.

Audit trail.

Basic document upload/view.

Core reports.

Role and permission management.

### 27.2 Full target release

Everything in MVP.

Bulk import and batch barcode workflows.

Digitization batches and QC.

OCR/full-text search.

Advanced search.

AI/semantic search.

Reconciliation sessions.

Extended dashboards and retention/disposal workflows.

Production monitoring and DR.

### 27.3 Definition of done for any feature

Requirement implemented.

Authorization rules implemented.

Validation and error cases handled.

Audit behavior implemented.

API documentation updated.

Database migration created.

Unit/integration tests added where applicable.

UI states include loading, empty, error, success and unauthorized cases.

Performance impact considered.

User/admin documentation updated.

## 28. Data migration and cutover

### 28.1 Migration sequence

## 1. Extract current master data and physical inventory.

## 2. Normalize names, codes and departments.

## 3. Map legacy file numbers to RecordFile.FileNumber.

## 4. Assign or import existing identifiers where valid, otherwise generate RF numbers.

## 5. Map room/almirah/shelf relationships.

## 6. Import location records.

## 7. Generate barcodes.

## 8. Perform physical tagging.

## 9. Reconcile barcode scans against imported records.

## 10. Load digitized documents and calculate checksums.

## 11. Run OCR/indexing.

## 12. Perform sample/full reconciliation.

## 13. Freeze/cutover legacy process where approved.

## 14. Start production workflow.

### 28.2 Reconciliation rule

A migration is not complete because row counts match. The implementation must reconcile at least file identity, barcode, department, current location, status and digital-document linkage where applicable.

### 28.3 Rollout strategy

Prefer room/section-based waves over one giant cutover.

Each wave has an opening stock count, import count, barcode count, scan/reconciliation count and exception count.

The system should report unverified records rather than silently accepting them.

## 29. Training, SOPs and handover

### 29.1 Training groups

### 29.2 Required SOPs

File onboarding SOP.

Barcode printing and tagging SOP.

Issue SOP.

Return SOP.

Physical move SOP.

Missing-file SOP.

Digitization SOP.

OCR/QC SOP.

Barcode damage/replacement SOP.

Reconciliation SOP.

Retention/disposal SOP.

Backup/restore SOP.

User provisioning/deprovisioning SOP.

## 30. Risks and mitigations

## 31. Future enhancements

Mobile/PWA companion for camera-based scanning.

RFID for high-volume physical movement where justified.

CCTV event linking for controlled record-room access.

Automated shelf inventory using handheld scanning sessions.

Advanced semantic search with multiple embedding models.

Multi-document semantic comparison and summarization.

Digital signatures/e-sign workflows if mandated.

Integration with e-office, HRMS, dispatch and archival systems.

Predictive storage-capacity planning.

### 3D room visualization only after the 2D physical model is stable.

## 32. Glossary

## 33. Technology references

The technology baseline is aligned to the requested .NET 10 + React architecture. The following official documentation should be treated as the implementation reference set and rechecked during project setup.

Microsoft .NET 10 overview: https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview

Microsoft .NET support policy: https://dotnet.microsoft.com/en-us/platform/support/policy

EF Core 10 what's new: https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-10.0/whatsnew

ASP.NET Core SignalR for .NET 10: https://learn.microsoft.com/en-us/aspnet/core/tutorials/signalr?view=aspnetcore-10.0

Implementation master checklist

[ ] Requirements and physical survey approved

[ ] Identifier/barcode standard approved

[ ] Roles and permissions approved

[ ] Database ERD approved

[ ] Backend solution structure created

[ ] Frontend feature structure created

[ ] CI pipeline active

[ ] Location hierarchy working

[ ] Room visualizer working

[ ] File registry working

[ ] Barcode printing/scanning working

[ ] Issue/return working

[ ] Audit logging working

[ ] Digital document storage working

[ ] OCR pipeline working

[ ] Full-text search working

[ ] AI search permission model validated

[ ] Bulk import validated

[ ] Digitization batch workflow validated

[ ] Reports validated

[ ] Backup/restore tested

[ ] Security test completed

[ ] Performance test completed

[ ] Pilot completed

[ ] Training completed

[ ] SOPs signed off

[ ] Production cutover approved
