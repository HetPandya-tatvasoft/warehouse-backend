# Research: Product Attributes

Date: 2026-10-08. Feature directory: 001-product-attributes; actual Git branch: chore/setup-spec-kit.
Scope: planning review plus read-only database audit; no DDL, migrations, seeds, or grant execution.
Source findings describe this inspection, not deployed state. Owner decisions D1–D5 are fixed inputs.

## Implementation follow-up — 2026-10-12

The owner resolved the partial-code review: restore literal substring search, identical ICU
uniqueness comparisons, supplied-null rejection, empty-update rejection, scalar/code-point text
validation, safe pagination and scoped batch counts. Normal stored-name/id ordering remains the
explicitly approved sorting choice. Standard repository methods are preferred; targeted predicates
and one grouped count query are allowed for correctness/efficiency. Automated tests remain deferred.

Installed TypeORM 1.0.0 supports parameterized Raw Find Options, nested relation filters, Not,
manager-aware repository methods, count and pessimistic findOne locks. Installed mapped-types
supports PartialType's skipNullProperties:false option. The implementation uses those APIs,
keeps locks inside transactions and runs post-rollback conflict classification outside the failed
transaction. See [review.md](review.md) and [quickstart.md](quickstart.md) for final authored scope,
actual static checks and remaining operational checks; no new database evidence was collected.

Source inspection also found AuthorizationSeeder runs PageSeeder before PermissionSeeder.
Feature page seeding therefore ensures missing active standard permissions and its four accesses
in the same transaction, while rejecting deleted/catalog collisions. The generic PageAccessSeeder
loop needed a feature-only restriction to avoid granting nonstandard permission accesses. Tenant
onboarding already discovers active accesses; no onboarding or RoleService rewrite was required.

## Repository evidence

| Confirmed finding | Source |
| --- | --- |
| ProductSettingsModule directly wires category controller/service/repository; no attribute implementation. | src/modules/settings/product-settings/product-settings.module.ts |
| BaseRepository accepts EntityManager; response wrapping/filter are explicit and shared. | src/common/repositories/base.repository.ts; src/common/utils/api-response.util.ts; src/common/filters/http-exception.filter.ts |
| Filter forwards only success=false, message, errors:string[], errorCode:string; extra exception details would be lost. | src/common/types/api-response.interface.ts; src/common/filters/http-exception.filter.ts |
| UUID IDs and timestamptz createdAt/updatedAt, no actor-audit fields. | src/common/entities/auditable.entity.ts |
| JWT reads access-token cookies; permissions query live tenant-scoped rights and active users. | src/modules/auth/strategies/jwt.strategy.ts; src/modules/roles-and-permissions/repositories/role-page-right.repository.ts |
| Onboarding creates tenant-owned ADMIN; a current role with that name is only an administrator candidate, not identity proof. | src/common/enums/role.enum.ts; src/modules/tenants/services/tenant.service.ts |
| ADMIN names are mutable; source has no immutable administrator discriminator. | src/modules/roles-and-permissions/entities/role.entity.ts; services/role.service.ts |
| Onboarding grants its new ADMIN every active page-access combination. | src/modules/tenants/services/tenant.service.ts |
| Tenant-user seed reruns fill missing rights on an existing ADMIN role, including revoked rights. | src/database/seeds/tenant-users.seed.ts |
| TypeORM 1.0.0 installed; synchronize=false; CLI uses an explicit entity list. | package.json; pnpm-lock.yaml; node_modules/typeorm/package.json; src/database/data-source.ts |
| products exists in migration history but has no entity in CLI metadata. | src/database/migrations/1786689041665-CreateProductsTable.ts; src/database/data-source.ts |
| No test files found; unit Jest supports @ alias; existing e2e config roots at test and lacks alias mapping. | package.json; test/jest-e2e.json; inspected src/test file inventory |
| IsOptional skips both undefined and null. | node_modules/class-validator/cjs/decorator/common/IsOptional.js |

## Decisions and alternatives

### Module boundary

Decision: add feature-specific controller/service/repository/DTO/mapper files within the existing
product-settings directory and register them in ProductSettingsModule. Preserve category files.
Rationale: matches current composition with the smallest registration change.
Alternative: a new nested module adds little value for these two tightly related entities; no
reorganization of category/infrastructure is justified.

### Tenant ownership

Decision: Attribute owns tenantId; AttributeValue derives tenant solely through attributeId.
Every value query joins the parent and checks tenantId plus route parent/value IDs. No global-value
endpoint, reassignment endpoint, or unchecked persistence helper is exposed.
Rationale: ownership cannot disagree across two columns; NOT NULL parent FK prevents orphan values.
Alternatives: a value tenantId plus composite FK adds redundant data and indexes. Database RLS would
require new infrastructure and session handling, outside scope. Tenant scoping remains server-side.

### Text equality, Unicode, and length

Decision: display text uses ECMAScript trim, no interior-space collapse, NFC/NFKC normalization,
accent removal, or JavaScript case conversion. Valid Unicode scalar strings count code points,
not UTF-16 units/grapheme clusters. Reject NUL/unpaired surrogates with validation errors.
Database UTF8 char_length and identical explicit trim-character checks enforce 1–150 characters.

Reuse the existing deterministic root collation pg_catalog."und-x-icu", locale und; do not create
a custom collation. Uniqueness/prechecks use lower(display COLLATE pg_catalog."und-x-icu") COLLATE "C";
search lowers both operands with the same database expression, then uses LIKE with explicit ESCAPE.
PostgreSQL is the case-comparison authority; the app never independently approximates it with
JavaScript toLowerCase. Equality after lowercase conversion is exact code-point equality.

Thus Color/COLOR collide, accented letters retain accents, composed/decomposed spellings remain
distinct, different interior spaces remain distinct, and German sharp-s is not folded into 'ss'.
This is locale-neutral lowercase comparison, not linguistic full case-folding. ICU version changes
need comparison verification and reviewed index rebuilds; automated equality regression coverage is
deferred under PA-TEST-001. Never silently change collation.

Rationale: explicit locale prevents server-default drift, while deterministic comparison preserves
spacing/punctuation and allows portable pattern matching. Alternatives: citext adds an extension
and uses database locale; nondeterministic collation can introduce normalization equivalences and
pattern restrictions; ASCII-only C lower cannot provide useful Unicode lowercase behavior.
The prior PostgreSQL 15+ floor was unjustified: the used collation/lower/expression-index capabilities
predate 15. No feature-specific server upgrade or CREATE COLLATION privilege is required. The local
database is verified as 16.3/UTF8 with this existing collation. A target environment must expose the
same deterministic root collation and pass the comparison corpus; if absent, stop for measured
alternative evaluation rather than creating an alias or silently falling back. This is capability
validation, not proof that all deployed environments share the local environment.
Documentation demonstrating pre-15 capabilities: [PostgreSQL 12 collation support](https://www.postgresql.org/docs/12/collation.html).
See [collation](https://www.postgresql.org/docs/15/collation.html) and
[string functions](https://www.postgresql.org/docs/15/functions-string.html).

### Integrity and concurrency

Decision: tenant FK and value-parent FK use RESTRICT; explicitly delete children then parent in one
transaction. All existing-parent mutations lock the tenant-scoped parent FOR UPDATE first, then
child where applicable. This serializes child create/update/delete and parent deletion. The FK
remains an independent orphan safeguard. Unique expression indexes include ACTIVE and INACTIVE.

It also serializes mutations to DIFFERENT values under the SAME attribute. This deliberately
trades same-parent write throughput for simple deletion coordination; other attributes remain
independent and normal reads use MVCC without FOR UPDATE. Validate inputs/authorization before
opening the transaction, then lock, recheck scoped existence, mutate, and commit immediately.
No mail, HTTP calls, user confirmation, sleeps, or unrelated work while holding locks. Observe lock
waits and transaction duration when investigating measured contention; automated concurrency
verification is deferred, and manual checks do not prove concurrency behavior.

Prechecks give useful errors; unique violations are caught after rollback and translated by known
constraint names. Requery only the authorized scope in a fresh transaction/connection to classify
active/inactive conflict; if the winner disappeared, use a generic concurrent-name conflict.
No querying within an already-aborted PostgreSQL transaction. Unexpected DB errors stay generic.
Rationale: parent-first ordering avoids service-created lock-order cycles; future RESTRICT references
can abort the whole delete without cascade into products/transactions. Alternative CASCADE simplifies
child deletion but hides the intended sequence and future restrictions. No fake reference checker.
See [constraints](https://www.postgresql.org/docs/15/ddl-constraints.html),
[row locks](https://www.postgresql.org/docs/15/explicit-locking.html), and
[expression indexes](https://www.postgresql.org/docs/15/indexes-expressional.html).

### API validation and errors

Decision: separate create/update DTOs without update defaults or automatic PartialType/IsOptional
null skipping. Optional means ValidateIf(value !== undefined), followed by field validation.
Creation service applies ACTIVE only for omitted status. Empty PATCH is 400 EMPTY_UPDATE.
Feature-scoped errorCode strings distinguish entity, duplicate status, and action; preserve errors
as strings and keep the shared filter/interface unchanged. Inactive duplicate codes tell a client
that Update can reactivate; locating the record uses authorized View/search, not leaked exception IDs.

Decision: explicit LIKE ESCAPE '!' and parameter binding. Escape ! as !!, % as !%, _ as !_; backslash
is literal because it is not the chosen escape character. Apply database lowercase, not ILIKE under
an unspecified deployment locale. See [pattern matching](https://www.postgresql.org/docs/15/functions-matching.html).

### Authorization rollout and revocations

The owner superseded automatic administrator defaults/backfill on 2026-10-13: all Product Attributes
role permissions are manually assigned. The unexecuted authorization migration was removed.
Page/access seeders create catalog choices only. Tenant and platform role seeders and new-tenant
onboarding exclude implicit feature rights; explicit rights remain unchanged and revoked rights
are not restored. Existing live permission checks remain mandatory with no administrator bypass.
No role identity mapping or grant ledger/backfill is needed. No role grants or seeds were executed.
### Migration safety and verification scope

Decision: retain one hand-authored additive schema migration; use catalog seeders and manual role grants; register metadata but do not use a global
schema-generated diff to fix products metadata. Expression indexes/checks are migration-owned;
verify installed TypeORM handling, and review any later generated diff before use.
There is no authorization migration rollback. Manual grant changes use existing role management;
schema down requires export/recovery agreement before losing catalog data.

Decision superseded by owner approval PA-TEST-001 (2026-10-08): defer automated unit/integration/
E2E/concurrency/rollout coverage and all test-only fixtures, database setup and Jest configuration.
Keep written acceptance, static/build checks and manual API verification; see plan's Constitution
Check for the exception and its impacts. Manual checks do not prove concurrency or provide
regression coverage. Security, constraints, transactions and migration safeguards are unchanged.

## Unverified conditions and operational questions

All feature-role grants are manual under the 2026-10-13 owner decision; no automatic target-role mapping is needed. See the verified local audit below and the deployment/recovery sequence in
[plan.md](plan.md). Target-environment parity remains pending; test-tool setup is deferred.

## Verified local database audit (2026-10-08)

The .env-configured host is loopback. The repository forces TLS in application/CLI configuration;
its probe failed because this local server does not support SSL. A loopback-only non-TLS probe then
connected. No application configuration was modified and this is not a remote TLS downgrade policy.
Every successful query ran inside BEGIN READ ONLY with transaction_read_only=on and ROLLBACK;
connection credentials, host values, database names, and raw error messages were not printed.

Verified: PostgreSQL 16.3; server encoding UTF8; database libc locale English_India.1252; deterministic
pg_catalog."und-x-icu" (ICU locale und, catalog and actual version both 153.14), plus C/default and
unicode collations. No feature custom collation is needed. Read-only checks confirmed database CREATE,
public CREATE/USAGE, pg_catalog USAGE/SELECT, role/tenant/user/membership SELECT, authorization-table
INSERT privileges, and uuid_generate_v4 presence. Catalog checks do not prove DDL/DML execution will
succeed; no such operations were attempted. PostgreSQL's collation catalog reflects the local instance.

ASCII SQL Unicode escapes avoided shell encoding ambiguity. Under the selected lower/root/C key,
É/é and capital/small sharp-s compare equal; sharp-s/ss, composed/decomposed accents, and single/double
internal spaces compare distinct; one supplementary scalar has char_length=1. Earlier non-ASCII
stdin comparison output is discarded as encoding-unsafe, not evidence of database behavior.

Local ledger includes CreatePasswordResetTokenEntity1790834276194 and the products/category migrations.
The bounded role query was checked against a total count: all four tenant roles were returned, all
currently named ADMIN and nondeleted, with assigned-user counts 2/1/1/1. No names/emails/hashes from
users were needed. These are candidates only; this does not prove administrator identity or production state.

| Local candidate role UUID | Tenant UUID | Assigned users |
| --- | --- | --- |
| ef613450-d7f6-464a-bc59-1e29a0670800 | 5c95583f-2b8d-4c51-b4a6-6fe08b33619d | 2 |
| a2325b60-6369-40f1-ba65-68652aa794d0 | 677bd0e3-edd1-4b37-a8b5-816242964102 | 1 |
| d28e074c-6905-43ea-ad0a-a949343f6367 | 79204396-0510-4c90-84b5-7f68df3e3925 | 1 |
| 37fe1c98-3c7d-4253-8664-6bac89180d61 | 9664d634-cac4-4aad-bcd6-5e55a9247db0 | 1 |

## Exact pending target checks

- Repeat read-only server_version/server_encoding, pg_database locale/provider, pg_collation
  provider/determinism/root locale/catalog-versus-actual version and the Unicode comparison corpus
  on each deployment/manual-verification target. Local verification does not certify a deployment target.
- Verify migration-runner public CREATE/USAGE, required SELECT/INSERT rights on authorization tables,
  uuid_generate_v4, and existing migration ledger/order there; no custom-collation permission needed.
- Audit ALL tenant roles/memberships (including non-ADMIN and deleted records) and tenant coverage.
  Check trusted onboarding records/operational ownership records if available; source contains no
  immutable discriminator/history proving that an old role is still the intended administrator.
- Het Pandya must confirm complete tenantId/roleId mapping for the target. Names, earliest users,
  descriptions, or broad permissions alone are not proof; never copy the local candidate list to
  another environment as approved identities. Existing recorded approval of a specific mapping
  remains valid; do not ask again. D5 approval alone does not identify individual role UUIDs.
- Verify old application's permission-editor compatibility, maintenance controls, transaction/ledger
  behavior, and recovery sequence through operational review and manual compatibility checks.
Automated rollout tests and test-stack setup remain deferred, not prerequisites.
