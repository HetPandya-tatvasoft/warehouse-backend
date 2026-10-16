# Implementation Review: Product Attributes

Final implementation source review, 2026-10-12, updated for the owner's manual-grant decision on
2026-10-13. The earlier partial-delivery findings are superseded
by the owner's explicit implementation decisions and the changes below. This records authored code
and static/build checks, not executed migrations, manual API results or database concurrency proof.
Automated tests and test infrastructure remain deferred under PA-TEST-001.

## Completed implementation

- Both services, ten guarded API routes, request/response DTOs, explicit mappers, conflict handling
  and module wiring are present. Each route uses JWT authentication, runtime UUID tenant-context
  validation and its independent ProductAttributes permission. No administrator bypass is added.
- Name and label rules are identical: string-only trim, 1–150 Unicode scalar code points, no NUL,
  preserved display case/internal spaces. Optional writable nulls fail; empty updates return
  EMPTY_UPDATE. PartialType uses skipNullProperties:false and no creation defaults.
- Search escapes literal !/%/_ with ESCAPE '!'; backslash stays literal. Find Options Raw predicates
  use the exact ICU lowercase-C key from database uniqueness for search and conflict comparisons.
  BaseRepository handles ordinary reads, relations, pagination, scoped writes and locks.
- Positive safe-integer controls and safe offset arithmetic are checked. Defaults stay 1/10,
  createdAt/id DESC, with own-status filtering and both statuses by default. Normal name/id sorting
  is the explicit owner-approved exception to the original lowercase name-ordering design.
- Attribute list value counts use one tenant-scoped grouped query for page IDs, not N+1 reads;
  details use a scoped count. Counts include all statuses. Ordinary reads have no snapshot promise.
- Parent and child statuses stay independent. Response selection availability requires both ACTIVE.
  Renames preserve IDs and ownership; inactive duplicates explain Update-permission reactivation.
- Mutations use READ COMMITTED transactions and parent-first locking. Attribute deletion removes
  values then parent in the same transaction; individual deletion leaves parent/status intact.
  Conflict requery occurs only after rollback; only known unique/FK constraints are translated,
  and deadlock/serialization errors return a retryable 409. Unknown failures remain safely generic.
- The unexecuted authorization migration is removed. Catalog seeders ensure the page and four active
  accesses; role permissions are assigned manually. Existing schema migration was not rewritten and
  no migration was executed.
- Feature page seeding supports the existing page-before-permission order. Generic access seeding
  excludes nonstandard feature permissions. Tenant and platform role seeders skip all implicit
  feature grants while retaining explicit grants. Tenant onboarding excludes this feature from its
  default grants. RoleService remains unchanged; manual assignment uses existing authorization tools.
- Entity metadata now records C display collation and migration-managed expression indexes with
  synchronize:false. Global synchronization remains disabled. No products/category/assignment schema,
  actor fields, UI, dependencies or test infrastructure were added.

## Remaining verification and rollout work

Full-feature consistency follow-up, 2026-10-14: both attribute mappers now follow CategoryMapper
and WarehouseMapper by constructing response DTO instances and assigning entity Dates directly.
Response DTO timestamps are Date internally; JSON responses still serialize timestamps as ISO
strings. This removes a remaining structural mismatch without changing response field names.
The current onboarding source already uses the original unfiltered pageAccessIds mapping and was
left unchanged. Remaining necessary differences include explicitly typed response envelopes/input
boundaries, parent-first locking, conflict translation and value-count/availability fields.
Current workspace validation gap: the value DTO lacks the name DTO's length/scalar/NUL decorators;
the latest user DTO edits were preserved rather than silently restoring those rules. T006 is
reopened for this gap. T008's original ICU-parity gap remains as previously documented.

Strict typing update, 2026-10-14: all ten controller response signatures and the parent lookup
return type are explicit. DTO transform inputs/outputs use a shared JSON-value type, including
invalid non-string inputs that must reach normal validation. Database errors use runtime Error
narrowing without a cast. The attribute source scan contains no explicit any/unknown or type
assertions. Normal type-check, attribute non-fixing lint and build passed. A stricter compiler
API audit found zero attribute-file errors and 23 external errors (including missing pg types and
reference-data entity initialization); these external issues and global compiler flags are unchanged.
No automated tests, database operations or manual verification were performed for this pass.

Service convention alignment, 2026-10-14: both services now use descriptive CRUD names and
repository field names, centralized service messages/direct exceptions, create-before-save,
destructured pagination and DTO mapping after transactions. Controllers call the renamed methods
without route or permission changes. Required service tenant/list/null/empty-update checks remain;
their feature-specific allowlists are retained without reintroducing a shared utility. Value-label
length/scalar/NUL validation was restored to match attribute-name validation. This corrects the
validation gap and preserves the agreed rules. No change resolves the separately recorded ICU gap.

Latest implementation update, 2026-10-14: at the owner's explicit request, both repositories now
use Find Options exclusively. ILike replaces ICU Raw predicates; backslash/%/_ are escaped to
preserve literal searches. Database ICU uniqueness indexes remain unchanged, so Unicode search
and duplicate precheck parity with those indexes is an unresolved behavioral difference against
the original requirement. Value counts use scoped selected-row batches and in-memory counting,
preserving totals while transferring more data than the previous grouped query. The historical
ICU/grouped-query descriptions above and below are superseded by this update. No database or
manual API verification was performed.

Repository alignment, 2026-10-14: pagination validation is service-owned; repositories return
entity pages with sort defaults and optional managers last. AttributeValueRepository owns the
scoped batch count query; AttributeService combines counts with response DTOs. Repositories no
longer access another entity's repository or start transactions. Services lock the owned parent
once before mutations, then lock only the value table when needed. Attribute-plus-values deletion
uses inherited delete methods under the same service-owned transaction. These are structural
changes; tenant isolation, literal ICU search, all-status counts and pagination metadata remain.
Runtime concurrency/rollback verification remains pending under the existing manual checklist.

See [quickstart.md](quickstart.md) for exact check results and the pending manual checklist.
Static/build checks do not establish runtime authorization, Unicode parity, uniqueness arbitration,
rollback, concurrent create/delete behavior, seeder idempotency or successful deployment.

Before exposure, the operator must confirm target UTF8/ICU/UUID/catalog capability, use corrected
seed/onboarding code, apply the schema migration through the normal runner, create the catalog via
the approved seed path, assign intended role permissions manually, and verify all API denial/
lifecycle cases. Do not use broad seeding as schema recovery or automatic role-grant repair.

Future assignment/reference constraints, reference-aware warnings and rename confirmation remain
intentionally outside this feature. No current fake reference checks or deletion conflicts are claimed.
The existing unrelated RoleService edit is byte-for-byte preserved. No manual checks were claimed.
