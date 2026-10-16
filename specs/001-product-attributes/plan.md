# Implementation Plan: Reusable Product Attributes and Predefined Values

**Feature context**: `001-product-attributes` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

**Git branch inspected**: `chore/setup-spec-kit`. Spec Kit reports the feature-directory context as
001-product-attributes; this planning invocation did not create/switch a Git branch.
The specification's Feature Branch label is a feature identifier, not evidence of a Git checkout.
Use chore/setup-spec-kit as actual-branch metadata in these artifacts; keep the feature directory
independent. Do not move, reset, overwrite, or discard the unrelated RoleService edit.

**Input**: Approved specification at specs/001-product-attributes/spec.md.
**Status**: Backend implementation authored; target-environment comparison checks, manual role
permission assignment, schema migration execution and rollout/recovery verification remain operational gates.

**Implementation review (2026-10-12)**: Services, routes, mappers, conflict handling and authorization
catalog/seeder changes are authored; role grants are manual. See [review.md](review.md) for final details and explicit
owner decisions. The compliance table describes design/source review, not runtime certification.
Static/build evidence is recorded in quickstart.md; automated tests remain deferred under PA-TEST-001.

## Summary

Extend existing ProductSettingsModule with Attribute/AttributeValue management. Attribute has tenantId;
values derive ownership through their immutable parent. Reuse AuditableEntity, BaseRepository,
DTO validation, ApiResponseUtil, the exception filter, JWT guard, and live page/permission checks.
Implement explicit safe mappers, feature-only transaction/query helpers, one additive schema migration,
catalog-only seed setup and scoped exclusions of automatic feature-role grants.
No category refactor, Product entity reconciliation, infrastructure/dependency/CI work, frontend,
assignment tables, or automated test implementation is included. See [research](research.md),
[data model](data-model.md), [contract](contracts/api.md), and [validation guide](quickstart.md).

## Technical Context

**Language/Version**: TypeScript; lockfile resolves 5.9.3, package range ^5.7.3; Docker Node 22.
**Primary Dependencies**: NestJS 11, installed TypeORM 1.0.0, pg 8.22.0, pnpm, existing class-validator/
class-transformer and Passport/JWT. Existing test dependencies are unchanged and unused in this scope.
**Storage**: PostgreSQL; local read-only probe verified 16.3/UTF8 and existing deterministic ICU
pg_catalog."und-x-icu". Reuse it, with no custom collation or feature-specific 15+ minimum. Target
environment parity is pending. Explicit CLI/application registration; synchronize stays false.
**Verification**: Owner-approved exception PA-TEST-001 defers automated tests and their infrastructure.
Current scope retains type checking, non-fixing lint, build, manual API checks and migration review.
**Target Platform**: Existing Nest service and container environment; no new deployment provider.
**Project Type**: Multi-tenant backend API in a single existing repository.
**Performance Goals**: No new throughput/latency SLA. Stable offset pagination, no N+1 counts,
B-tree scope/status/order indexes; no unrequested trigram extension or global page-size limit.
**Constraints**: Tenant-wide (no branch restriction), inactive uniqueness, trimmed/code-point lengths,
DB-authoritative Unicode comparison, RESTRICT FKs, atomic deletion, revocation-preserving grants.
**Scale/Scope**: Two business entities, ten endpoints, one authored schema migration. Catalog
volume/production database configuration not supplied; do not claim measured performance.

## Constitution Check

Initial assessment: PASS before research; approved spec resolves all owner decisions. Post-design:
Principles I–V and VII retain design compliance; VI has the owner-approved exception below.
These are design assessments, not runtime proofs.

| Principle | Before / after | Evidence |
| --- | --- | --- |
| I Architecture/scope | PASS / PASS | Existing module extended; thin controllers, service rules, manager-aware repositories; exact file inventory below; category untouched. |
| II Tenant/authorization | PASS / PASS | Runtime tenant assertion; every value query joins owned parent; route permissions; no public/platform route or bypass. |
| III Validation/contracts | PASS / PASS | Explicit request/response DTOs, null-safe optional validation, empty PATCH rejection, safe errorCode strings within unchanged envelope. |
| IV Integrity/migrations | PASS / PASS | FK/check/unique indexes, controlled text comparison, parent-first transactions, manual additive migrations, both entity registrations, rollback limits and products safeguards. |
| V Lifecycle | PASS / PASS | Independent statuses, permanent atomic deletion, empty attributes, inactive reservations; future references/warnings separated; no actor audit invention. |
| VI Verification | PASS / APPROVED EXCEPTION | PA-TEST-001: automated coverage deferred; written acceptance, manual checks and static/build verification retained. |
| VII Governance | PASS / PASS | D1–D5 retained; dated evidence and legacy debt separated; no repeat approvals; conditional deployment identity audit documented. |

Het Pandya approved PA-TEST-001 on 2026-10-08 in the conversation; no repeat approval is required. The limited seed changes are feature-required
because otherwise revoked grants are restored or unrelated roles gain implicit access. Future-only
consumer/reference scenarios are not claimed implemented, and do not authorize assignment tables.

## Verification and Migration Evidence

### Schema and manual authorization setup

Owner decision (2026-10-13): all Product Attributes role permissions are assigned manually,
including for existing/new tenant administrators. The unexecuted authorization migration has been
removed. No administrator mapping, automatic backfill, startup reconciliation or feature default
role grant is required.

The only feature migration is 1791417600000-CreateProductAttributes.ts: create the two tables,
status enum, restrictive FKs, checks, ICU uniqueness and ordering indexes. Do not modify applied
migrations, enable synchronization or use global generation; preserve the products-table safeguard.

PageSeeder and PageAccessSeeder create the ProductAttributes page and exactly four active standard
accesses. Deleted/unexpected catalog collisions fail rather than silently reactivate rows. These
catalog rows offer permission choices; they do not grant role access. TenantUserSeeder and
SuperAdminSeeder skip implicit feature grants, preserving existing explicit rights and revocations.
TenantService onboarding filters this feature from its otherwise unchanged administrator defaults.
Manual role assignment continues through existing permission management, with no administrator bypass.

### Deployment and recovery sequence

This runbook is guidance, not executed work:

1. Confirm the approved target, UTF8/ICU/UUID capabilities, backup, migration history and allowlist.
2. Deploy corrected seed/onboarding code; keep old seed jobs disabled. Apply only the schema
   migration through the normal single runner with transaction/ledger protection.
3. Use an explicitly approved catalog seed path to create the page/four accesses. Do not use broad
   production seeds as schema recovery. Catalog setup does not assign role rights.
4. Assign intended Product Attributes permissions manually through existing role management. Check
   each role's explicit grants and retained revocations; test without an administrator bypass.
5. Verify API ownership, permissions and lifecycle behavior in the approved non-production setup.
   Permission editors must preserve feature rights on replacement before their writes are enabled.

If catalog setup fails, resolve the measured collision through reviewed recovery; do not reactivate
or grant rights automatically. Schema rollback loses attribute/value data, so requires export and
reference checks; drop children before parent/type and never cascade into unrelated objects.
Manual authorization changes must be reviewed separately; schema rollback does not delete role grants.
No database, migration, catalog seed or role-permission operation was executed for this policy change.
### Products metadata safeguard

ProductsModule is empty and CLI DataSource lacks Product, although 1786689041665 creates products.
Use manually authored, allowlisted feature SQL instead of global migration generation; inspect any
candidate generated SQL without running it. Reject drops/alterations of products, its enum/index/FK,
categories, addresses, tenants, or any unrelated table. This feature does not repair that mismatch.
Register the new entities in module/CLI only. Keep migration-owned expression/check objects stable;
verify TypeORM 1 metadata introspection before accepting any later generated diff. Deployment
before/after schema snapshots must show changes only on feature schema/auth rows; this is an
operational safeguard, not a test-harness implementation requirement.

### Verification design and approved exception PA-TEST-001

Het Pandya's 2026-10-08 instruction approves a feature-specific exception to constitution VI:
automated unit, integration, E2E, concurrency and rollout tests, including test-only fixtures,
database harnesses, Jest configuration and test implementation, are deferred at this stage.
The project-wide principle remains unchanged. No deferred check is completed or passed.

Reason: the owner explicitly chose to defer automated test implementation for this feature.
Alternative considered: the previous automated suite/harness plan; it is deferred rather than
replaced by equivalent coverage. Compensating measures are retained acceptance scenarios,
type checking, non-fixing lint, build, manual API verification and schema/authorization review.
Validation, tenant checks, permissions, constraints, parent-first locking, atomic transactions,
compatibility and migration/recovery safeguards remain mandatory.

Impact: security, data integrity and API compatibility have reduced verification assurance.
Manual checks do not prove concurrency behavior or provide automated regression coverage;
rollback failure injection and automated rollout recovery verification also remain unproven.
Deferred regression work must cover the spec verification matrix, including concurrent uniqueness,
delete/create races and rollback, and manual feature grants with revocation persistence.
No test infrastructure or test files are in the current implementation inventory or dependencies.
No date for resuming automated coverage has been agreed; record it as deferred work.

Current verification commands and the concise manual checklist are in [quickstart.md](quickstart.md).
Record only checks actually run, results and limitations. Static checks and build do not prove runtime
behavior. Deployment comparison/privilege/identity checks and manual compatibility/recovery review
remain separate gates; never rewrite historical migrations or use general seeding to repair rollout.

Planning-stage evidence (2026-10-08): source/metadata review, artifact validation, branch/hash checks, and local READ ONLY
catalog/role/comparison probes. No application build/lint/test, DDL, migrations, seeds, or grants ran.
The first TLS probe failed locally; loopback-only non-TLS read-only access verified local 16.3/UTF8,
ICU root/version 153.14, available privileges/UUID function and four candidate roles. Initial raw
non-ASCII shell probes are discarded; ASCII Unicode-escape probes supply valid comparison evidence.
The forced-TLS/local-non-TLS mismatch is existing configuration debt, not a feature change. Local
manual verification uses environment-appropriate TLS settings; no application setting was modified.

## Project Structure

### Documentation (this feature)

Design artifacts: plan.md, research.md, data-model.md, contracts/api.md, quickstart.md in
specs/001-product-attributes/. tasks.md records implementation and static/build verification;
quickstart.md contains non-blocking developer environment, manual verification and rollout guidance.
The specification/checklist record verification deferral; the project constitution remains unchanged.

### Source Code (repository root)

Target implementation inventory, updated for owner-requested DTO/repository structure changes.
Entities, DTOs, repositories, the schema migration, services/controllers, response mappers, conflict
translation and scoped authorization seeder changes below are authored. Runtime rollout is pending.
Existing feature root: src/modules/settings/product-settings/.

New feature files:

- controllers/attributes.controller.ts; controllers/attribute-values.controller.ts
- services/attribute.service.ts; services/attribute-value.service.ts
- types/attribute-input.type.ts (JSON request values used by DTO transforms before validation)
- repositories/attribute.repository.ts; repositories/attribute-value.repository.ts
- entities/attribute.entity.ts; entities/attribute-value.entity.ts
- enums/attribute-status.enum.ts
- dto/attribute/upsert-attribute.dto.ts (UpsertAttributeDto and UpdateAttributeDto)
- dto/attribute/attribute-pagination.dto.ts; dto/attribute/attribute-response.dto.ts
- dto/attribute-value/upsert-attribute-value.dto.ts (UpsertAttributeValueDto and UpdateAttributeValueDto)
- dto/attribute-value/attribute-value-pagination.dto.ts; dto/attribute-value/attribute-value-response.dto.ts
- mappers/attribute.mapper.ts; mappers/attribute-value.mapper.ts
- Standard validation decorators and string trimming live directly in the request DTOs;
  removed text-validator/input-utility files are not required implementation artifacts.
- errors/attribute-conflict.util.ts (typed feature SQLSTATE/constraint translation after rollback)
- Repository conditions use escaped ILike directly; service methods validate tenant context,
  safe pagination and list controls. No shared query utility file or repository pagination validation.
- Controllers use JWTAuthGuard and PermissionsGuard; tenant context is checked in services.
  Per the owner's 2026-10-13 request, the separate tenant guard was removed. Permission
  rejection can precede the service's missing-tenant 400 response.

New repository-level files:

- src/database/migrations/1791417600000-CreateProductAttributes.ts
- Authorization catalog uses seeders; no role-grant migration is retained.

Existing files to modify during implementation:

- src/modules/settings/product-settings/product-settings.module.ts: TypeOrmModule.forFeature entities,
  both controllers/services/repositories; export manager-aware repositories/services as appropriate.
- src/database/data-source.ts: import/register Attribute and AttributeValue explicitly.
- src/modules/roles-and-permissions/enums/permissions.enum.ts: Page.ProductAttributes='ProductAttributes'.
- src/database/seeds/authorization/page.seeder.ts: insert ProductAttributes catalog entry for clean setup.
- src/database/seeds/authorization/page-access.seeder.ts: restrict only ProductAttributes to its four
  active standard permissions; required to prevent the existing all-page/all-permission loop from
  inventing additional feature accesses. PageSeeder supports the current page-before-permission order.
- src/database/seeds/tenant-users.seed.ts: exclude automatic feature grants for both new/existing roles.
- src/database/seeds/super-admin.seed.ts: skip feature's implicit platform grants.
- src/common/constants/messages.constants.ts: add feature success/validation/conflict messages only.

TenantService onboarding excludes automatic feature grants (owner decision 2026-10-13). No changes to SettingsModule/AppModule or shared guards/filter/envelope,
BaseRepository, global pagination, existing e2e config, dependencies, CI, or category implementation.
No changes to existing RoleService: its current user edit is preserved; admin renaming debt is separate.

**Structure Decision**: thin guarded controllers call feature services; services assert tenant and own
business transactions and request locks; scoped repositories own query/count implementations and accept EntityManager.
Current owner-requested repository implementation reuses BaseRepository Find Options pagination,
findOne/delete, nested tenant relation filters, ILike, In, Not and pessimistic lock options.
Per the owner's 2026-10-14 instruction, no repository uses Raw or QueryBuilder. Escaped ILike
preserves literal substring matching but uses column collation, so it does not guarantee the
original ICU uniqueness-comparison parity. The unchanged database index remains authoritative.
AttributeValueRepository selects attribute IDs in tenant-scoped batches and counts rows in memory.
Each repository queries its own entity; relation filters/joins enforce tenant ownership. Both
pagination methods return entity pages and provide default sorting. Services combine attributes
and batch counts into response DTOs. Optional managers are last in custom repository signatures.
Parent and child locks use separate manager-scoped calls in service-owned transactions, with the
value lock restricted to the value table. Each mutation locks its parent once. Attribute deletion
validates and locks the parent, then uses inherited delete methods for values and parent in the
same transaction; no repository starts a transaction or repeats the parent lookup.
Name ordering now uses the database column plus id, explicitly approved in the conversation.
Attribute counts use tenant-scoped batch reads rather than per-attribute calls; reads are chunked
at 1000 requested IDs to bound IN parameters. This transfers one row per matching value and uses
more memory than SQL aggregation. Writable null
rejection, empty updates, scalar/code-point validation and safe arithmetic controls are implemented.
The owner's latest instruction removes targeted queries; the ICU search/uniqueness parity gap is
recorded as a behavioral difference rather than silently revising the original requirement.
No shared base behavior or schema was changed.

Service convention alignment (2026-10-14): descriptive create/get/update/delete method names and
repository field names match existing services; controller calls follow the renamed methods.
Creation uses repository create then save. Pagination destructures defaults and separates items
from metadata. Service error messages use MESSAGES and direct exceptions instead of notFound
factories. DTO mapping happens after transaction completion; the required count/parent data is
returned from the transaction. Private tenant/list validators remain feature-specific because
safe offsets, sort allowlists and explicit-null rejection are still required, and the owner
removed the shared query utility. Both name and label DTOs enforce the agreed scalar/length/NUL
rules; the missing label decorators were restored. Transactions, locks and response fields remain.

Strict typing pass (2026-10-14): controller response envelopes and parent lookup results have
explicit return types. DTO callbacks use a JSON input union rather than any/unknown; database
driver errors are narrowed with instanceof Error rather than asserted. No explicit any/unknown
or type assertions remain in attribute feature files. A compiler API audit with strict,
noImplicitAny and strictBindCallApply enabled produced zero attribute-file errors and 23 errors
elsewhere in the project. Global compiler settings remain unchanged. This pass preserves the
current workspace validation behavior and does not resolve the documented ICU parity gap.

Unsafe-type enforcement: attribute-file ESLint overrides treat unsafe assignment, argument,
call, member access, return and type assertion as errors. Service transactions explicitly declare
their result generic, callback EntityManager type and callback return type, including write-result
interfaces for the entity/count and value/parent combinations. No rules are disabled or weakened.

Compiler follow-up: declaration-level tracing found six implicit-any catch variables despite the
clean lint result. tsconfig.json now enables useUnknownInCatchVariables, requiring the existing
instanceof Error guards before the caught values reach write-error handlers. This is the only
global compiler-setting change; the whole project type-check/build passes with it. A subsequent
trace found zero any/error-typed attribute variables or parameters and six checked catch clauses.

## Complexity Tracking

PA-TEST-001 is the sole owner-approved exception; its scope, rationale, impacts, alternatives and
compensating measures are recorded in the Constitution Check and verification section above.
ICU comparison and scoped catalog/tenant/platform seeder adaptations are
justified feature requirements, not unrelated dependency/infrastructure refactors. No new package.

## Open Technical Checks and Decision Questions

Business rules remain approved. Local environment capability is verified only as documented above;
automated test-tool compatibility and test database setup are deferred, not implementation gates;
target-environment parity, explicit manual role assignments, old permission-editor compatibility, and
maintenance/recovery rehearsal remain rollout gates. ADMIN names alone never
authorize a permission grant, even when no rename is observed. If prerequisites fail, stop and document the
measured failure before proposing a scoped
alternative; do not silently weaken Unicode, grant custom roles, rewrite old migrations, or upgrade
dependencies. See tasks.md for the dependency-ordered work and deployment-only gates.
