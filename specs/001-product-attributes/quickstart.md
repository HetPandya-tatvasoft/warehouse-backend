# Verification Guide: Product Attributes

Feature: `001-product-attributes`; actual Git branch: `chore/setup-spec-kit`.
Static/build checks were run on 2026-10-12 and 2026-10-13 as recorded below. Manual API and deployment checks
remain pending. Earlier read-only local database evidence is dated in [research.md](research.md).
Final implementation details and resolved behavioral decisions are in [review.md](review.md).

## Current scope and limitations

Het Pandya approved PA-TEST-001 on 2026-10-08: defer automated unit, integration, E2E,
concurrency and rollout tests, and all test-only fixtures, database infrastructure and Jest
configuration. See [plan Constitution Check](plan.md#constitution-check). Written acceptance
in [spec.md](spec.md) remains mandatory. Deferred coverage is not completed or passed.
Manual checks do not prove concurrency behavior or provide automated regression coverage;
static checks/build also do not prove runtime tenant isolation, constraints or transaction rollback.
Deferral does not waive validation, authorization, constraints, locking, transactions or migration
safeguards. The owner's final decisions and their implementation are recorded in review.md.

## Type checking, non-fixing lint, and build

Run from repository root after implementation. Use existing locked dependencies; add no test setup.

```powershell
pnpm exec tsc --noEmit --incremental false -p tsconfig.build.json
pnpm exec eslint "src/modules/settings/product-settings/**/*.ts" "src/database/migrations/179141760000*-*.ts" "src/database/data-source.ts" "src/database/seeds/authorization/page.seeder.ts" "src/database/seeds/authorization/page-access.seeder.ts" "src/database/seeds/tenant-users.seed.ts" "src/database/seeds/super-admin.seed.ts" "src/modules/roles-and-permissions/enums/permissions.enum.ts" "src/modules/tenants/services/tenant.service.ts" "src/common/constants/messages.constants.ts"
pnpm build
```

The compiler check emits no output/cache; lint has no `--fix` (tool caching may write if configured).
Build writes/replaces `dist` and compiler artifacts. Require successful exit/no diagnostics and record
actual outcomes. `pnpm lint` uses `--fix`; `pnpm format` writes files. Neither is a read-only substitute.
Do not run Jest as this feature's acceptance gate or cite a zero-test result as coverage.

Implementation completion requires these static/build checks only. The developer-run environment,
manual API checklist and deployment sections below are separate operational guidance. Their absence
or pending status does not block implementation completion or local static/build verification.

## Developer-run environment preparation

When manual verification is desired, prepare an explicitly approved non-production environment:

1. Configure the built application with non-production credentials and the environment's approved
   TLS policy. Confirm the target is not production before any write.
2. Complete the read-only capability checks under Deployment checks below.
   Review the feature schema migration and unrelated-table allowlist before applying it.
3. Apply the reviewed schema migration with one migration runner. Do not enable
   synchronization, rewrite historical migrations, or use broad seeds to repair migration failures.
4. Start the API normally and establish controlled tenant users/roles with the required permissions.
   Create the feature catalog through the approved seed path and assign role permissions manually.
   Use disposable attribute/value records and record cleanup.

These steps mutate the selected environment. They are not automated test infrastructure and remain
pending until someone deliberately performs and records them.

### Runtime seeder inspection

Do not execute seeds merely to complete implementation. In a clean non-production setup where seed
execution is already approved, inspect that ProductAttributes creates exactly View/Create/Update/Delete
page accesses, and all roles (including new tenant administrators) get no implicit feature access.
Assign intended permissions manually through existing role management. On an existing-role setup,
confirm rerunning the scoped seed path does not
restore a revoked feature right. Stop on deleted/catalog collisions; do not reactivate them or run the
general production seed as repair. Automated fresh-path and revocation regression coverage remains
deferred under PA-TEST-001.

## Concise manual API checklist

After the optional preparation above, use normal authenticated sessions and known tenant/role
memberships. Do not disable guards, use an admin bypass, or create test-only infrastructure.
Follow [contracts/api.md](contracts/api.md) for payloads, permissions, status/error codes and envelopes.
All items start pending and are checked only after recording an actual result.

- [ ] Create empty Color and Storage attributes, then add example values; verify UUIDs, ACTIVE defaults,
  explicit fields, all-status value counts and correct nested ownership. (FR-001/002/004/010)
- [ ] Reject null/blank/type/overlength names/labels and invalid statuses; accept 1/150 code points,
  trim only surrounding whitespace, preserve case/internal spaces; PATCH `{}` fails. (FR-007)
- [ ] Check active/inactive case-insensitive duplicates, useful conflict/reactivation messages,
  no automatic reactivation, valid self-renames, and separate tenant/parent uniqueness. (FR-008)
- [ ] PATCH one field on an inactive record; omitted fields/status and identity remain unchanged.
  Parent/child activation is independent; effective availability follows both statuses. (FR-011/015)
- [ ] Browse both lists with defaults 1/10, name/label substring search, literal `%`, `_`, `!` and
  backslash, own-status filters, empty/out-of-range pages, attribute-name sorting and stable tied
  timestamps. Reject invalid controls; verify counts and pagination envelopes. (FR-003/004/014)
- [ ] Exercise every route with no session, each missing permission, missing tenant, foreign tenant
  IDs and wrong parent/value IDs. Confirm 401/403/400/404 as contracted, no foreign disclosure or
  denied mutation, and independently granted View/Create/Update/Delete. (FR-005/006/010/017)
- [ ] Rename/delete unreferenced values; delete the last value without changing parent status;
  delete an attribute with its values and recreate the name with a new ID. This observes successful
  deletion only; it does not prove failure rollback or concurrent atomicity. (FR-012/015/016)
- [ ] In the rollout validation environment, inspect intended manual grants and retained revocations.
  Verify tenant/platform seeding and new tenant onboarding do not implicitly grant feature rights.
  Confirm permission editors preserve feature rights; no broad reseeding for role-grant repair.
  (FR-005/017; owner decision 2026-10-13)

Missing suitable sessions/data/environment means the corresponding manual check is not run;
record the limitation without blocking implementation completion. Written concurrent-conflict,
rollback-failure and automated rollout acceptance
remain requirements with verification deferred. Future FR-018–020 consumer warnings/referenced
renames/assignment restrictions belong to later integrations; no UI or reference tables are created.

## Deployment checks and recovery

These are rollout gates, not implementation prerequisites or automated test infrastructure.
Use [plan.md](plan.md#deployment-and-recovery-sequence) for schema rollout, catalog setup, manual
role-permission assignment and recovery. Review additive SQL and metadata registrations; compare
schema/catalog changes against the allowlist, especially the unrelated products table. Never rewrite
applied migrations, enable synchronization, run broad seeds as repair, or remove a committed ledger.

Read-only preflight must confirm target version/UTF8, existing deterministic root ICU collation and
catalog/actual versions, Unicode comparison corpus, UUID function, required privileges and baseline
ledger. Local PostgreSQL 16.3 evidence is not target certification. No custom collation or 15+ upgrade
is required. Retain approved TLS policy; local loopback probe behavior does not authorize remote
TLS changes. These example probes are read-only; use an approved connection without printing secrets:

```sql
BEGIN READ ONLY;
SHOW server_version;
SHOW server_encoding;
SELECT collprovider, collisdeterministic, colliculocale, collversion,
       pg_collation_actual_version(oid)
FROM pg_collation WHERE collname='und-x-icu';
SELECT to_regprocedure('uuid_generate_v4()') IS NOT NULL AS uuid_available,
       has_schema_privilege(current_user,'public','CREATE') AS public_create;
SELECT char_length(U&'\+01F600') AS supplementary_code_points,
       lower(U&'\00C9' COLLATE pg_catalog."und-x-icu") COLLATE "C"
         = lower(U&'\00E9' COLLATE pg_catalog."und-x-icu") COLLATE "C" AS accent_case_pair,
       lower(U&'\00DF' COLLATE pg_catalog."und-x-icu") COLLATE "C"
         = lower('ss' COLLATE pg_catalog."und-x-icu") COLLATE "C" AS sharp_s_expansion;
ROLLBACK;
```

Unicode sample expects 1/true/false; also inspect sharp-s case equality, distinct composed/decomposed
accents and internal spaces per data-model. This is capability checking, not regression coverage.

Role permissions are assigned manually for all roles, including existing/new tenant administrators,
per the owner decision of 2026-10-13. After approved catalog setup, use existing role-permission
management to assign the required ProductAttributes accesses. No role mapping environment variable,
authorization migration or automatic backfill is needed. Confirm tenant/platform seeds and tenant
onboarding do not add feature rights, and existing explicit grants/revocations survive reruns.
Automated revocation and grant verification remains deferred under PA-TEST-001.
## Evidence

### Initial partial-source review — 2026-10-12 (historical)

Ran from the repository root using installed dependencies. `pnpm.cmd` is the Windows executable
equivalent of the documented `pnpm` commands; no execution-policy change was made.
Versions: Node v22.17.0, pnpm 11.6.0, TypeScript 5.9.3, ESLint 9.39.4, TypeORM 1.0.0.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/**/*.ts" "src/database/migrations/179141760000*-*.ts" "src/database/data-source.ts" "src/database/seeds/authorization/page.seeder.ts" "src/database/seeds/tenant-users.seed.ts" "src/database/seeds/super-admin.seed.ts" "src/modules/roles-and-permissions/enums/permissions.enum.ts" "src/common/constants/messages.constants.ts"` | 1; ten prettier line-ending errors: data-source.ts lines 23–25/64–67 and permissions.enum.ts lines 7–9. No fixing flags. |
| `pnpm.cmd build` | 0; Nest build succeeded and wrote build artifacts. |

No automated tests, migrations, seeds, database probes, deployment or manual API requests were run.
Passing TypeScript/build does not establish feature completion: missing planned files are not
compiled, and no attribute routes are wired. All manual checkboxes above remain pending.

### Final implementation checks — 2026-10-12

The earlier partial-source gaps are now resolved in authored code. No runtime verification is claimed.
Installed versions remain Node v22.17.0, pnpm 11.6.0, TypeScript 5.9.3, ESLint 9.39.4 and TypeORM 1.0.0.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/**/*.ts" "src/database/migrations/179141760000*-*.ts" "src/database/data-source.ts" "src/database/seeds/authorization/page.seeder.ts" "src/database/seeds/authorization/page-access.seeder.ts" "src/database/seeds/tenant-users.seed.ts" "src/database/seeds/super-admin.seed.ts" "src/modules/roles-and-permissions/enums/permissions.enum.ts" "src/common/constants/messages.constants.ts"` | 0; no diagnostics, no fixing flags. |
| `pnpm.cmd build` | 0; Nest build succeeded; dist/compiler artifacts written. |
| `pnpm.cmd exec eslint "{src,apps,libs,test}/**/*.ts"` (additional project-wide check) | 1; two pre-existing prettier errors in app.module.ts lines 37–38, left unchanged. |
| `git diff --check` | 0; no whitespace errors; ordinary Git line-ending notices only. |

Prettier was run only on feature implementation files and touched registration/enum files to resolve
the earlier line-ending errors. This is distinct from the non-fixing lint commands above. Existing
RoleService SHA256 remains 3C35FD31111F8595BDCE11384A4390AE4C4A7593718946C0EAF2D8EB915C1A1C.
The schema migration 1791417600000 and historical migrations were not rewritten. Authorization
migration 1791417600001 is authored but was not executed. No tests or test infrastructure were added;
no Jest, migrations, seeds, database probes, deployment or manual API requests were run. All manual
checkboxes remain pending. No extension hooks were configured at implementation start or completion.

For manual verification, use the approved non-production setup described above. Review/apply only
the schema migration through the normal single runner with transaction protection; configure no
administrator mapping. Create the permission catalog through the approved seed path, then assign
intended role permissions manually. Start the API and exercise the ten routes, denial, status,
literal-search, uniqueness and deletion cases above. Do not run broad seeds as schema repair or
role-grant repair. Capture actual results before checking any manual item. Database concurrency/
rollback assurance remains limited while automated coverage is deferred.

### Manual-grant policy update — 2026-10-13

Owner decision: remove the unexecuted authorization migration; all Product Attributes role grants,
including existing/new administrators, are manual. Catalog seeders remain; tenant seeding and
onboarding now skip automatic feature grants. This supersedes the earlier migration/mapping setup.
The schema migration remains unchanged; rebuilding removed the obsolete compiled authorization migration.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/**/*.ts" "src/database/migrations/179141760000*-*.ts" "src/database/data-source.ts" "src/database/seeds/authorization/page.seeder.ts" "src/database/seeds/authorization/page-access.seeder.ts" "src/database/seeds/tenant-users.seed.ts" "src/database/seeds/super-admin.seed.ts" "src/modules/roles-and-permissions/enums/permissions.enum.ts" "src/modules/tenants/services/tenant.service.ts" "src/common/constants/messages.constants.ts"` | 0; non-fixing lint, no diagnostics. |
| `pnpm.cmd build` | 0; build succeeded. |

No automated tests, migration/seed execution, role-grant changes, deployment or manual API checks
were performed. Existing explicit permissions were not removed or changed in a database.

Record exact commands, exit codes, tool/database/ICU versions, manual request/result summaries,
SQL/migration review and deployment audit results, cleanup, and checks not run with reasons.
Keep automated coverage explicitly deferred; do not describe manual checks as equivalent proof.
No checks listed here have passed merely because this guide or implementation tasks exist.

### Repository convention alignment — 2026-10-14

Validation and transaction ownership now reside in services. Repositories return entity pages,
use optional managers last and provide sort defaults. Batch value counts belong to the value
repository and are combined with attributes in the service. Parent locks are acquired once;
value-row locks use Find Options with only the value table selected for locking. Attribute
deletion validates/locks ownership before child-then-parent deletion in one transaction.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/repositories/attribute*.ts" "src/modules/settings/product-settings/services/attribute*.ts"` | 0; non-fixing lint, no diagnostics. |
| `pnpm.cmd build` | 0; build succeeded. |

Automated tests remain deferred under PA-TEST-001. No migrations, seeds, deployment or manual
API/database checks were executed. Manual follow-up: check foreign-tenant/wrong-parent denials,
page ordering and all-status counts, invalid/unsafe pagination, and concurrent value changes
versus parent deletion including rollback. Existing search and status checklists still apply.

### Find Options only follow-up — 2026-10-14

Both repositories now use escaped ILike rather than Raw and Find Options selected-row batches
rather than grouped QueryBuilder counts, as explicitly requested by the owner. No Raw or
QueryBuilder remains in either repository. T008 is reopened for the original ICU parity rule:
search/prechecks now use column collation while database uniqueness still uses the ICU key.
Counts remain tenant-scoped and all-status but require loading matching value IDs into memory.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/repositories/attribute*.ts"` | 0; non-fixing lint, no diagnostics. |
| `pnpm.cmd build` | 0; build succeeded. |

Automated tests remain deferred under PA-TEST-001. No database or manual verification was run.
Manual checks must include literal backslash/%/_/! searches, non-ASCII case pairs against the
unchanged unique indexes, and row-count correctness/memory use on large value collections.

### Service convention alignment — 2026-10-14

Descriptive CRUD names/repository fields, centralized messages and direct exceptions, create/save,
destructured pagination and DTO mapping after commit now follow existing service conventions.
Controller service calls were updated without changing routes, permissions or response fields.
Value labels again reject NUL, invalid Unicode scalars and more than 150 scalar code points after
trimming. Tenant/list/null/empty-update validation and parent-first transactions remain in place.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/services/attribute*.ts" "src/modules/settings/product-settings/controllers/*.ts" "src/modules/settings/product-settings/dto/attribute-value/upsert-attribute-value.dto.ts" "src/common/constants/messages.constants.ts"` | 0; non-fixing lint, no diagnostics. |
| `pnpm.cmd build` | 0; build succeeded. |

No automated tests, manual API/database checks, migrations, seeds or deployment were executed.
PA-TEST-001 remains in force. Manual follow-up includes all ten routes, existing response envelopes,
omitted/null/empty updates, label scalar/length/NUL cases, tenant/parent denials and transactional
deletion/rollback. T008's original ICU-parity requirement remains unresolved by this style refactor.

### Strict typing pass — 2026-10-14

Controller envelopes and parent lookup return types are explicit; DTO transformations use typed
JSON values while preserving non-string values for validation. The database-error cast is removed.
No explicit any/unknown or type assertions remain in the attribute feature source.

| Actual command / audit | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/**/*attribute*.ts"` | 0; non-fixing lint, no diagnostics. |
| `pnpm.cmd build` | 0; build succeeded. |
| Node/TypeScript compiler API audit via stdin, using the build config with strict, noImplicitAny and strictBindCallApply enabled; diagnostics classified by attribute-feature filenames | 0 feature errors; 23 errors outside the feature. This is not a passing project-wide strict compilation. |

External strict-mode failures include missing pg type declarations in database.config.ts and
uninitialized reference-data entity fields. Global compiler flags and unrelated code were not
changed. Automated tests remain deferred under PA-TEST-001; no DB or manual checks were run.

### Unsafe-type enforcement follow-up — 2026-10-14

Explicit unsafe assignment/argument/call/member-access/return checks initially reported zero
diagnostics in the saved workspace. Attribute-specific ESLint rules now enforce these checks
plus unsafe-type-assertion checks as errors. Transaction result generics, EntityManager callback
parameters and callback return types are explicit in both services. No suppressions or broad
casts were added, and existing unrelated ESLint configuration changes were preserved.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/**/*.ts" --max-warnings 0` | 0; zero errors and zero warnings, non-fixing lint. |
| `pnpm.cmd build` | 0; build succeeded. |

Automated tests remain deferred under PA-TEST-001. No database, seed, migration or deployment
actions were performed. These checks do not establish that unrelated modules compile in strict mode.

### Compiler-level catch typing correction — 2026-10-14

A TypeScript compiler API trace of variable/parameter declarations found six implicit-any catch
variables even though lint was clean. The compiler option useUnknownInCatchVariables is now true
in tsconfig.json; catches require narrowing before use, and the existing instanceof Error guards
provide it. A repeat trace under the saved compiler settings reports zero any/error-typed
attribute variables/parameters and six compiler-checked catch clauses. No type assertions or
lint suppressions were used. This supersedes the earlier statement that all compiler flags stayed
unchanged: only this catch-safety flag was enabled; full project strict mode remains unchanged.

| Actual command / audit | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics across the build project. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/**/*.ts" --max-warnings 0 --no-cache` | 0; zero errors and warnings. |
| `pnpm.cmd build` | 0; build succeeded. |
| Node/TypeScript compiler API declaration trace using the saved build config | 0 any/error-typed attribute variables/parameters; six checked catches. |

Automated tests remain deferred under PA-TEST-001. No database or manual API verification was run.

### Mapper consistency follow-up — 2026-10-14

Both attribute mappers now instantiate response DTO classes and assign Date timestamps, matching
category/warehouse implementations. ISO timestamp representation in JSON remains unchanged;
internal response DTO types are Date. Current user edits to value-label validation were preserved;
T006 is reopened because length/scalar/NUL checks differ from the agreed name/label rules.

| Actual command | Exit / result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false -p tsconfig.build.json` | 0; no diagnostics. |
| `pnpm.cmd exec eslint "src/modules/settings/product-settings/**/*attribute*.ts" --no-cache --max-warnings 0` | 0; zero errors and warnings. |
| `pnpm.cmd build` | 0; build succeeded. |

No automated tests or manual API/database checks were run. PA-TEST-001 remains in force.
