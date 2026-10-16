# Data Model: Product Attributes

Design date: 2026-10-08. Feature directory: 001-product-attributes; actual Git branch: chore/setup-spec-kit.
Entities and schema migration 1791417600000 are authored; schema application was not verified
in this implementation. The unexecuted authorization migration was removed on 2026-10-13;
catalog setup uses seeders and all feature-role grants are manual.
Read-only historical evidence is in research.md. See [review.md](review.md) for final comparison,
validation and locking details. Design rules below are not a claim of runtime verification.
See [research](research.md), [API contract](contracts/api.md), and [plan](plan.md).
PA-TEST-001 defers automated coverage and test-only setup, not schema/integrity requirements.
Manual checks do not prove concurrency or regression coverage; all constraints/locking remain required.

## Attribute

Entity class ProductAttribute; table product_attributes; extends AuditableEntity.

| Property / database column | Type / default | Rule |
| --- | --- | --- |
| id / id | UUID, generated | Stable PK; reuse repository UUID convention. |
| tenantId / tenant_id | UUID, NOT NULL | FK to tenants.id, ON DELETE RESTRICT / ON UPDATE NO ACTION. |
| name / name | varchar(150), NOT NULL, deterministic C collation | Trimmed display spelling; 1–150 Unicode code points. |
| status / status | product_attribute_status_enum, ACTIVE | ACTIVE or INACTIVE; inactive names remain unique. |
| createdAt / created_at | timestamptz, now() | Existing CreateDateColumn convention. |
| updatedAt / updated_at | timestamptz, now() | Existing UpdateDateColumn convention; ORM updates this field. |

Tenant relation is ManyToOne; values relation is OneToMany. Tenant does not acquire new aggregate
fields or a cascade. No createdBy/updatedBy, deletion timestamp, isDeleted, global role, or assignment.

## AttributeValue

Entity class ProductAttributeValue; table product_attribute_values; extends AuditableEntity.

| Property / database column | Type / default | Rule |
| --- | --- | --- |
| id / id | UUID, generated | Stable PK, never replaced by rename. |
| attributeId / attribute_id | UUID, NOT NULL | FK to product_attributes.id, ON DELETE RESTRICT / ON UPDATE NO ACTION. |
| label / label | varchar(150), NOT NULL, deterministic C collation | Same trimmed/code-point rules as Attribute.name. |
| status / status | shared product_attribute_status_enum, ACTIVE | Independent of parent status. |
| createdAt / created_at | timestamptz, now() | AuditableEntity. |
| updatedAt / updated_at | timestamptz, now() | AuditableEntity. |

No tenant_id on this table. Ownership derives exclusively from the nonnullable, immutable parent.
A value cannot represent conflicting tenant columns; exactly one existing parent is required by FK.
The backend always joins parent.id=attributeId and parent.tenant_id=authenticated tenant, including
value retrieval/update/delete and parent validation. A foreign parent ID is unavailable even if it
exists. Repositories expose scoped methods, not globally searchable value-ID helpers. DTOs cannot
supply tenantId or change attributeId. This is application tenant isolation backed by relational
integrity, not a claim that PostgreSQL independently authorizes authenticated users without RLS.

## Canonical storage and Unicode rules

- Application trim matches ECMAScript String.trim: U+0009–000D, U+0020, U+00A0, U+1680,
  U+2000–200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF.
- Use a fixed character set in database btrim checks, not default btrim (ordinary space only),
  regex locale classes, or a different Unicode White_Space definition. U+0085 and U+200B are not
  automatically stripped. Preserve all internal characters and display capitalization.
- Validate well-formed scalar strings; reject embedded U+0000 and lone UTF-16 surrogates before
  sending PostgreSQL UTF8. Count with code-point iteration; combining sequences count each code
  point, supplementary characters count one. Do not count bytes, UTF-16 units, or graphemes.
- Name/label CHECKs enforce char_length BETWEEN 1 AND 150 and exact equality to btrim using the
  above set. NOT NULL and enum checks reject null/invalid values independently of DTO validation.
- Display columns use deterministic C equality for exact stored-text checks. The existing
  pg_catalog."und-x-icu" collation (provider icu, locale und, deterministic true) controls
  lowercase conversion explicitly, independently of database-default locale.
- Define the comparison key for either display column as:
  `lower(display_column COLLATE pg_catalog."und-x-icu") COLLATE "C"`.
  Conflict queries apply that exact expression to both stored text and bound trimmed candidate.
  Search uses the same key and literal substring escaping. Attribute-name ordering is the owner's
  approved stored-name/database-collation ordering plus id, not this lowercase comparison key.
- No JS lowercase keys, accent stripping, case-fold expansion, or Unicode normalization. Color/COLOR
  collide; É/é collide; é/e remain distinct. Sharp-s and ss remain distinct. Composed é and e+combining
  acute remain distinct. Different internal spaces remain distinct. Pin/verify ICU comparison behavior
  and review collation/index changes when ICU upgrades; no silent fallback if ICU is unavailable.

Sources: [PostgreSQL strings](https://www.postgresql.org/docs/15/functions-string.html),
[collations](https://www.postgresql.org/docs/15/collation.html).

No PostgreSQL 15+ minimum or custom CREATE COLLATION is required by these expressions. Local
PostgreSQL 16.3/UTF8 and the existing root collation passed read-only sample checks. Deployment/manual-verification
targets must pass capability/version/collation-parity checks before rollout; local evidence is not
a deployment certification. Reuse the catalog collation and never drop it during schema recovery.

## Indexes and constraints

| Name | Shape / purpose |
| --- | --- |
| uq_product_attributes_tenant_name_ci | Unique expression index (tenant_id, lowercase-C name key); no status/deletion predicate. |
| uq_product_attribute_values_attribute_label_ci | Unique expression index (attribute_id, lowercase-C label key); no status predicate. |
| idx_product_attributes_tenant_created | (tenant_id, created_at DESC, id DESC), default all-status pages. |
| idx_product_attributes_tenant_status_created | (tenant_id, status, created_at DESC, id DESC), status-filtered pages. |
| idx_product_attribute_values_attribute_created | (attribute_id, created_at DESC, id DESC), parent lists/FK deletion lookups. |
| idx_product_attribute_values_attribute_status_created | (attribute_id, status, created_at DESC, id DESC), value status pages. |
| fk_product_attributes_tenant | Attribute tenant FK; RESTRICT. |
| fk_product_attribute_values_attribute | Value parent FK; RESTRICT. |
| ck_product_attributes_name_length / ck_product_attributes_name_trim | Length and exact trimmed storage. |
| ck_product_attribute_values_label_length / ck_product_attribute_values_label_trim | Same for labels. |

Expression unique indexes are PostgreSQL uniqueness enforcement, not plain column-only @Unique.
They are created explicitly by the feature migration and represented as migration-managed named
indexes in metadata where installed TypeORM supports it; verify inspection doesn't propose index
replacement. Display properties stay unmapped to any client-supplied normalized field.
Search contains a leading wildcard; these B-tree indexes do not make arbitrary substring search
index-backed. No pg_trgm extension or invented scale/SLA is added. Add measured optimization later.

## Lifecycle

Create defaults status to ACTIVE only when omitted; explicit valid INACTIVE is allowed. PATCH accepts
only name/status or label/status and changes supplied fields, with no create defaults. Empty PATCH
is rejected. Renaming INACTIVE records never reactivates them. Setting already-current status is a
valid idempotent semantic update; updatedAt follows normal ORM update behavior, not a new guarantee.

Attribute status and each child status remain independent. Effective value availability is parent
ACTIVE AND value ACTIVE, computed in responses; no persisted effective-status column or selection/
assignment workflow is introduced. Parent changes never rewrite child status, label, or association.
Management lists filter own status and include both by default. Zero values is always allowed.

Deletion is permanent; new same-name creation receives a newly generated UUID. Tenant deletion is
restricted while attributes exist; no feature cascade is added to tenant lifecycle.

## Transactions and concurrent mutation

Use DataSource.transaction at READ COMMITTED; repository methods accept its EntityManager.
Attribute create relies on unique index arbitration; existing-parent mutations select the tenant-
scoped parent FOR UPDATE. All value mutations use parent-first locking, then the route-scoped child
FOR UPDATE when present. Parent/child IDs and tenant are rechecked after obtaining locks.

Attribute deletion: lock parent, explicitly delete its values, delete parent, commit. Parent FK
RESTRICT means a direct parent delete cannot hide child loss. Any statement failure rolls everything
back. Individual value deletion locks its parent then the scoped value and deletes only that value.
Future restrictive child references can stop the transaction with all prior deletes rolled back.

Concurrent create/delete: a value creator waits for the parent lock; after a committed parent delete
it sees no parent and returns 404. If creator commits first, a later parent delete sees its committed
child and includes it. FK checks prevent an orphan even for direct SQL writers outside this protocol.
A create may legitimately succeed and then be deleted by a later authorized deletion; no durable-
retention guarantee is implied. Same-parent value operations serialize; different parents may proceed.

This includes mutations to different child values under one parent: one hot attribute can become
a write bottleneck. Keep the simple parent-first protocol because it coordinates deletion without
new machinery. Do payload validation/permission checks before opening the transaction; perform only
scoped locked reads, necessary writes, and commit inside. Do not hold locks for external calls,
consumer confirmation, sleeps, or unrelated work. Reads remain ordinary MVCC reads. Measure same-
parent wait time/transaction duration before proposing narrower locks; no new mechanism is planned.

Concurrent duplicate creates/renames: indexes decide the winner. On SQLSTATE 23505, roll back first,
classify only known feature uniqueness names, then requery the scoped conflict to emit active/inactive
codes. Winner removal before requery yields a generic concurrent-conflict code, not an invented
reactivation candidate. Unknown constraints/errors are logged generically and are not leaked.
Parent-before-child locking limits deadlocks; 40P01/40001 becomes a retryable 409 code without unbounded
internal retries. No automatic resurrection or merge occurs.

Expected parent FK 23503 on a child creation resolves to scoped parent-unavailable 404 after rollback.
A known restrictive referencing FK in later integration resolves to a deletion conflict offering
Update/deactivation. Current feature does not fake assignments or classify unrelated FK errors as
product references. Future integrations maintain an explicit known-constraint map and tenant-scoped
reason lookup. See [locks](https://www.postgresql.org/docs/15/explicit-locking.html).

## Future relationship boundary

Later category–attribute and product–attribute assignments must reference Attribute with RESTRICT/
NO ACTION; later product/variant value associations must restrict deletion of AttributeValue, including
inactive records. If a later relationship stores its own tenant, it must enforce matching ownership
at its own boundary, for example a valid composite FK; adding that relationship is not this design.
No relation must cascade from attributes/values into products, variants, or transactions.

Later reference-aware rename must discover actual references, warn/confirm use of the new label,
preserve all IDs/associations/SKUs/stock, and protect the referenced/unreferenced transition against
races. That consumer must agree a confirmation protocol before shipping. No confirm flag, fake
reference count, placeholder assignment table, or UI is introduced now. FR-018–020 are recorded
integration contracts, not claims of current executable coverage.
