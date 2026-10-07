# Warehouse Inventory Backend Constitution

## Core Principles

### I. Architecture and Scope

- Changes MUST preserve the existing NestJS modular architecture.
- Controllers MUST handle HTTP routing, guards, DTO binding, and response wrapping.
  Services MUST own business rules and orchestration. Repositories MUST handle persistence
  and support transaction managers for operations participating in a transaction.
- Implementations MUST reuse existing abstractions where they fit the feature, including
  BaseRepository, ApiResponseUtil, shared pagination, and address services.
- Unrelated refactors and dependency changes MUST remain outside feature scope. Any necessary
  shared-infrastructure change MUST be justified in the plan and included in review scope.

These boundaries keep changes reviewable within an existing application.

### II. Tenant Isolation and Authorization

- Tenant-owned operations MUST derive tenant context from the authenticated user and validate
  required context at runtime. TypeScript non-null assertions are not runtime validation.
- Reads, writes, and referenced-entity validation MUST be scoped to the correct tenant.
  Client-supplied IDs or tenant values MUST NOT establish ownership or access.
- Features requiring branch access MUST validate the branch's tenant ownership and the user's
  branch access for each applicable operation. A selected-branch cookie is not authorization.
- Protected business endpoints MUST explicitly enforce authentication and permissions through
  the existing JWT guard and page/permission system. Missing permission metadata MUST NOT be
  treated as an approved authorization pattern for business endpoints.
- Public and platform-only endpoints MUST be intentional and documented with their access
  rules. Platform-only operations MUST enforce their documented platform authorization.
- Authorization MUST be enforced on the backend, independently of frontend checks.

### III. Validation and API Contracts

- Requests MUST use DTOs and the existing global validation pipeline for input validation.
  Business and referenced-entity validation MUST also occur in the service layer.
- Business APIs MUST preserve the established success, error, and pagination contracts:
  success has success=true, optional message, and data; errors have success=false, message,
  and optional errors/errorCode; paginated data has items, page, pageSize, totalItems,
  and totalPages. Intentional endpoint exceptions MUST be documented.
- New business endpoints MUST use explicit response DTOs/mappers. Responses MUST NOT expose
  password hashes, token hashes, or other authentication secrets.
- Specifications and contracts MUST define update semantics, including omitted fields,
  explicit nulls, defaults, and replacement behavior. Omission MUST NOT unexpectedly reset
  existing values; create defaults MUST NOT silently become update defaults.
- Existing API compatibility MUST be preserved unless a change is agreed and its consumer
  impact and transition are documented.

### IV. Database Integrity and Migrations

- Schema changes MUST use TypeORM migrations; synchronize MUST remain disabled.
- Agreed relational and uniqueness rules MUST be enforced in PostgreSQL where expressible,
  alongside application validation. Features MUST specify uniqueness scope, case sensitivity,
  normalization, and behavior for nullable or deleted records before implementing constraints.
- Multi-write operations that must succeed or fail together MUST use transactions. Participating
  persistence operations MUST use the transaction manager rather than an unrelated repository.
- New business entities MUST reuse AuditableEntity where its UUID and timestamp fields fit.
  Any alternative MUST be explained in the data model.
- New entities MUST be registered through relevant application TypeOrmModule configuration
  and the CLI data source's explicit entity list; seed registration MUST be updated if applicable.
- Generated SQL MUST be reviewed for unrelated drops, changes, or data loss. In particular,
  the existing products table lacks matching ORM metadata and MUST NOT be accidentally removed.
- Migration documentation MUST describe existing-data impact, constraint prerequisites,
  backfills where needed, and rollback or recovery limitations. Already-applied migrations
  MUST NOT be rewritten; subsequent changes MUST use new migrations.

### V. Explicit Lifecycle Rules

- Each feature specification MUST define activation, deactivation, deletion, and reference
  behavior, or explicitly state why a lifecycle operation is inapplicable.
- Rules MUST describe effects on children, dependent records, existing references, visibility,
  uniqueness reuse, and retention where applicable.
- A single deletion strategy MUST NOT be imposed on every existing module. The feature MUST
  select and justify its lifecycle behavior while respecting existing contracts.
- createdBy/updatedBy MUST NOT be presented as existing conventions. New actor-audit fields
  require an explicit feature requirement and schema/contract design.

### VI. Verification

- New or changed business rules MUST have meaningful tests. Authorization, tenant isolation,
  branch access, API contracts, and database constraints MUST be tested as appropriate to the
  change. Database constraint claims MUST have database-level verification where applicable.
- Verification MUST map to feature acceptance scenarios, including relevant rejection and
  cross-tenant cases. Tests MUST exercise behavior rather than merely mirror implementation.
- Plans and task lists MUST identify verification work and any unavailable prerequisites.
  Completion reports MUST record checks actually run, results, test counts where available,
  and checks not run with reasons. A successful zero-test command is not coverage evidence.
- Read-only checks MUST be distinguished from commands that modify files, generated output,
  or databases. Here pnpm lint uses --fix, pnpm format writes files, builds write dist, and
  migration/seed commands modify a database; these effects MUST be identified when selecting
  checks. Test coverage and compiler caches can also write artifacts.

### VII. Governance and Legacy Code

- Documentation MUST distinguish confirmed repository conventions from requirements newly
  adopted by this constitution. Existing inconsistencies are technical debt, not approved
  patterns or automatic exceptions.
- These principles MUST apply to new and modified code. Unrelated legacy cleanup MUST be
  separately scoped; this constitution does not authorize implementation of that cleanup.
- Any justified exception MUST document the affected principle, reason, alternatives considered,
  security/data/compatibility impact, compensating measures, and owner-approved disposition.
  Exceptions MUST be recorded in the plan's Constitution Check and Complexity Tracking.

## Confirmed Repository Baseline (2026-10-07 Source Inspection)

The following findings describe the source inspected on 2026-10-07, not runtime correctness
or a continuously current repository state. They MUST be reverified against relevant source
when relied upon for later work; they are not automatically current forever.

- Stack: NestJS, TypeORM, PostgreSQL via pg, and pnpm (package.json and pnpm-lock.yaml).
- Modules compose in src/app.module.ts; feature modules use TypeOrmModule.forFeature.
- src/main.ts installs ValidationPipe with transform, whitelist, and forbidNonWhitelisted,
  a global HTTP exception filter, cookie parsing, and the /api prefix.
- Shared contracts and persistence are in src/common/types/api-response.interface.ts,
  src/common/utils/api-response.util.ts, and src/common/repositories/base.repository.ts.
- src/common/entities/auditable.entity.ts supplies UUID id and timestamptz createdAt/updatedAt;
  it supplies no createdBy/updatedBy. Reference-data entities use numeric bigint IDs.
- JWT authentication reads cookies. Permission checks use database-backed role/page rights
  under src/modules/auth and src/modules/roles-and-permissions.
- src/database/data-source.ts explicitly lists CLI entities; application configuration loads
  registered entities automatically. Both disable synchronize.
- Lifecycle conventions vary: roles/branches use isDeleted, users use isActive, and categories
  and warehouses use physical deletion. These facts do not prescribe new feature behavior.
- ProductsModule is empty although migration 1786689041665-CreateProductsTable.ts creates a
  products table. The table has no matching entity in CLI metadata.
- Test commands exist but no test files were found during the baseline inspection;
  pnpm test includes --passWithNoTests. Build, lint, and runtime health were not verified.

Newly adopted requirements include uniform runtime tenant validation, complete operation-level
access checks, explicit response DTOs/mappers for new business endpoints, documented update and
lifecycle semantics, database-backed integrity, and acceptance-linked verification. The baseline
does not establish that legacy code already satisfies them.

Known-debt observations from the 2026-10-07 source inspection are listed below. They describe
that inspection and MUST be reverified before treating them as current unresolved issues.
Debt to track separately includes category PATCH defaults and required-name semantics;
category integrity enforced only in application code; inconsistent warehouse branch-assignment
checks and unscoped contact-user reference checks; raw primaryAdmin user serialization that may
expose passwordHash; user-status input without a validation DTO; incomplete role rename protection;
non-atomic branch/address writes; differing post-commit email failure behavior; port/configuration
inconsistencies; and absent test coverage. Migration execution ownership and products metadata
reconciliation remain operational/design decisions rather than assumed solutions.

## Delivery and Review Workflow

1. Specifications MUST identify tenant/branch scope, endpoint access, acceptance and rejection
   scenarios, lifecycle/reference behavior, uniqueness/normalization, update semantics, and
   compatibility expectations. Unresolved material decisions MUST be explicit.
2. Plans MUST evaluate all seven principles before research and again after design, identify
   reuse and module boundaries, outline response contracts and atomic writes, review entity
   registration/migration impact, and map verification to acceptance scenarios.
3. Tasks MUST include applicable verification and migration review/documentation work.
   Existing foundations MUST be reused; generic template setup examples do not authorize
   rebuilding authentication, persistence, or application architecture.
4. Reviews MUST check the Constitution Check, scoped changes, sensitive-field exclusions,
   access/tenant boundaries, SQL effects, compatibility, and actual verification evidence.
   Unrun checks and technical debt MUST remain visible rather than be described as passing.

## Governance

This constitution governs new and modified backend work and takes precedence over conflicting
generic Spec Kit template examples. It does not retroactively certify existing modules or approve
unrelated remediation. Het Pandya is the project owner for this project and MUST approve
exceptions and compatibility changes. An explicit owner decision already recorded in the
conversation or plan satisfies approval for that decision; the same approval MUST NOT be
requested again. Routine work within an approved scope requires no additional approval.

Amendments MUST describe the proposed rule change, rationale, affected workflows/templates,
transition impact, and approval. Approved changes MUST update this file, its version and amendment
date, and any dependent templates requiring synchronization. Ratification date remains the date
of first adoption. Constitution compliance MUST be reviewed in feature plans and change reviews.

Versioning uses semantic versions: MAJOR for incompatible principle removal or redefinition;
MINOR for new principles or materially expanded requirements; PATCH for clarifications without
semantic change. Version 1.0.0 is the first adopted constitution, replacing an unratified scaffold.

**Version**: 1.0.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-07
