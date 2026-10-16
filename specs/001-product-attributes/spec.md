# Feature Specification: Reusable Product Attributes and Predefined Values

**Feature Branch**: `001-product-attributes`

**Feature Directory**: `specs/001-product-attributes`

**Created**: 2026-10-08

**Status**: Backend implementation authored; static/build checks passed; runtime and rollout verification pending

**Implementation review (2026-10-12)**: [review.md](review.md) records the completed authored backend
and resolution of post-implementation differences using explicit owner decisions. Requirements
and acceptance below remain the agreed baseline. Task status and static/build evidence are
recorded in tasks.md and quickstart.md. Automated tests remain deferred under PA-TEST-001.

**Input**: Tenant-owned attribute/value management with search, pagination, status management,
permanent deletion, useful validation, and explicit permissions. No plan or implementation is
created by this clarification. Product/category integration and frontend work remain out of scope.

## Clarifications

### Session 2026-10-13

- Owner decision: Product Attributes role permissions are assigned manually for all roles, including
  existing/new tenant administrators. Catalog seeders create the page and four accesses only; remove
  the unexecuted authorization migration and automatic feature grants in seeding/onboarding. This
  supersedes D5's default-grant requirement; route permission enforcement and revocation denial remain.

### Session 2026-10-08

Het Pandya supplied the following confirmed decisions; no approval was requested again.
No additional clarification questions were needed.

- Q: Must attributes have values? → A: Attribute and AttributeValue are separate entities;
  an attribute has zero or many values, each with exactly one parent. Empty creation and ACTIVE
  empty attributes are allowed; emptiness does not enable free-text product values. (D1)
- Q: How are names, uniqueness, and search handled? → A: Trim surrounding whitespace; require
  1–150 characters; preserve display case/internal spaces; compare case-insensitively within
  a tenant for attribute names and within an attribute for labels. Inactive duplicates conflict
  with an Update-permission reactivation message; creation never auto-reactivates. Deleted names
  may be reused with new IDs. Search is a case-insensitive substring with literal percent signs
  and underscores. Self-renames and concurrent conflicts preserve uniqueness. (D2)
- Q: What status/deletion rules apply? → A: Independent ACTIVE/INACTIVE statuses default ACTIVE
  on creation; omitted update fields survive. Parent inactivity suppresses new selection without
  changing child statuses/references. Permanent deletion of attributes with values or individual
  values is atomic and blocked by references, including inactive references. Future consumers
  warn about permanence and affected records; backend checks remain independent of confirmation.
  Blocked deletion explains why and offers deactivation. (D3)
- Q: Can referenced values be renamed? → A: Unreferenced renames need validation/duplicate checks;
  future referenced renames require warning/confirmation that current product/variant displays
  will use the new label. Preserve identity, associations, status, variants, SKU, and stock;
  cancellation changes nothing. Replacement/reassignment is future work. (D4)
- Q: Which permissions apply? → A: Product Attributes maps View/Create/Update/Delete to both
  entities. The original default-administrator grant decision is superseded by the 2026-10-13
  manual-grant decision above. No role receives implicit feature access or an administrator bypass. (D5)
- Q: How are catalogs listed and integration scoped? → A: Both lists paginate, search names/labels,
  filter individual status, and include both statuses by default. Defaults remain page 1/pageSize
  10, newest-created-first with a unique secondary key, and attribute-name sorting. No new global
  limit. Category/product assignments, inheritance, variants, brands, pricing, inventory,
  transaction snapshots, and frontend work remain excluded; future reference/consumer rules
  must be recorded without inventing their tables or claiming existing checks.

## User Scenarios & Testing *(mandatory)*

These are retained acceptance requirements, not executed tests. Owner-approved PA-TEST-001
(2026-10-08) defers automated coverage at this stage; see plan Constitution Check. Future-integration scenarios are
identified separately and do not require assignment tables or a frontend in this feature.

### User Story 1 - Maintain a Tenant's Reusable Attributes (Priority: P1)

An authorized tenant user maintains reusable concepts such as Color/Storage independently of products.

**Why this priority**: Attribute definitions are the foundation for reusable choices.

**Independent Test**: Create an empty attribute, retrieve/rename it, change its status, and permanently
remove it with its values when unreferenced; verify independent parent/child status behavior.

**Acceptance Scenarios**:

1. **US1.1 Given** Create permission, **When** Color is created without values or status, **Then**
   it receives a stable tenant-owned ID, defaults ACTIVE, and has zero values and no global role.
2. **US1.2 Given** View permission and an owned attribute, **When** retrieved, **Then** its approved
   business fields including name/status are returned without authentication secrets.
3. **US1.3 Given** Update permission, **When** a valid non-conflicting name is supplied, **Then**
   rename preserves ID, tenant, associations, status, and omitted fields.
4. **US1.4 Given** Create/Update permission, **When** a supplied name is null, blank, whitespace-only,
   wrong-type, over 150 trimmed characters, or missing on creation, **Then** a field-specific error
   is returned without mutation. Trimmed lengths 1 and 150 succeed; surrounding whitespace is removed.
5. **US1.5 Given** ACTIVE Color, **When** ' color ' is created or another record renamed 'COLOR',
   **Then** a useful conflict is returned. With INACTIVE Color, the conflict explains reactivation
   by Update permission; neither request creates a duplicate or automatically reactivates Color.
6. **US1.6 Given** invalid/unavailable IDs, **When** retrieval/update/deletion is attempted, **Then**
   a validation/unavailable-record error occurs without a replacement record.
7. **US1.7 Given** an INACTIVE attribute, **When** renamed, **Then** it stays INACTIVE. Explicit
   reactivation with Update succeeds even with zero values.
8. **US1.8 Given** mixed child statuses, **When** a parent deactivates/reactivates, **Then** child
   statuses remain unchanged; inactivity suppresses all new selection, and reactivation restores
   availability only for individually ACTIVE values. Existing references remain intact.
9. **US1.9 Given** Delete permission, an attribute with three values, and no blocking references,
   **When** deletion succeeds, **Then** all four records are removed together. Failure removes none;
   later same-name creation receives a new ID.
10. **US1.10 Given** attribute management, **When** it runs, **Then** no product/variant/price/SKU/
    inventory/transaction record is created, regenerated, or removed through this feature.

---

### User Story 2 - Maintain Predefined Values Under an Attribute (Priority: P1)

An authorized user maintains Black/Blue/White under Color and 128 GB/256 GB/512 GB under Storage.

**Why this priority**: Consistent choices make attributes useful without product assignments.

**Independent Test**: Add, retrieve, rename, deactivate/reactivate, and remove an unreferenced value;
removing the last value leaves a valid attribute.

**Acceptance Scenarios**:

1. **US2.1 Given** Create permission and Color, **When** Black/Blue/White are added without status,
   **Then** each gets its own ID, exactly one parent Color, and ACTIVE status; none belongs to Storage.
2. **US2.2 Given** Storage, **When** ' 128 GB ' is added, **Then** '128 GB' is stored for display;
   capitalization/internal spacing is preserved and '128  GB' is distinct. No unit calculation occurs.
3. **US2.3 Given** Update and an unreferenced value, **When** a valid label replaces it, **Then**
   ID/tenant/parent/associations/status/omissions survive; no new value, variant, SKU, or stock change occurs.
4. **US2.4 Given** management permission, **When** the parent is unavailable or a label is missing
   on creation, null/blank/whitespace-only/wrong-type/overlength, **Then** useful errors leave data
   unchanged. Labels with 1 and 150 trimmed characters succeed.
5. **US2.5 Given** Blue under Color, **When** ' blue ' is created or another label renamed 'BLUE',
   **Then** a conflict occurs. INACTIVE Blue still reserves the label and the message explains
   Update-permission reactivation; no auto-reactivation occurs. Blue under another attribute or
   another tenant is allowed.
6. **US2.6 Given** Color's value, **When** retrieved/updated/deleted under Storage, **Then** the
   wrong-parent operation fails without reassignment.
7. **US2.7 Given** Delete and the last unreferenced value, **When** permanently deleted, **Then**
   the parent remains valid with zero values and its prior status unchanged.
8. **US2.8 Given** an INACTIVE value, **When** renamed, **Then** it stays INACTIVE. Reactivating it
   under an INACTIVE parent changes its individual status but does not enable new selection.
9. **US2.9 Given** an INACTIVE parent, **When** permitted management accesses its values, **Then**
   they remain manageable; management visibility is distinct from new-selection availability.

---

### User Story 3 - Find Attributes and Values in the Tenant Catalog (Priority: P2)

Authorized users search/page through both catalogs and filter status, including inactive records.

**Why this priority**: Discovery avoids duplicate definitions as the catalog grows.

**Independent Test**: Browse 23 attributes and separately 23 values under one attribute; search
names/labels and filter statuses without product data.

**Acceptance Scenarios**:

1. **US3.1 Given** View and 23 records in either applicable list, **When** pages 1–3 use size 10,
   **Then** they contain 10/10/3 records, totalItems 23 and totalPages 3, with correct tenant/parent scope.
2. **US3.2 Given** Color/Blue, **When** searching attributes for 'olo' or values for 'LU', **Then**
   case-insensitive substring matches return the appropriate records. Percent signs/underscores
   in search text match literal characters only.
3. **US3.3 Given** no matches or an out-of-range page, **When** either list is requested, **Then**
   a successful empty result and accurate filtered metadata are returned.
4. **US3.4 Given** invalid page/size (zero/negative/fraction/nonnumeric), unsupported sort/direction,
   or a status other than ACTIVE/INACTIVE, **When** listed, **Then** useful validation errors occur.
5. **US3.5 Given** omitted list controls, **When** listed, **Then** page 1/pageSize 10, both statuses,
   and newest-created-first with a unique secondary key apply; equal timestamps yield stable
   ordering of an unchanged result set.
6. **US3.6 Given** mixed statuses, **When** either list is searched and status-filtered, **Then**
   own-status matches and filtered totals are correct. ACTIVE children of INACTIVE parents still
   appear in ACTIVE management filtering.
7. **US3.7 Given** attribute names, **When** name sorting is requested ascending/descending, **Then**
   ordering follows that direction with a unique tie-breaker. Creation-time sorting applies to
   both lists; label sorting need not be added to value lists.

---

### User Story 4 - Protect the Catalog's Tenant and Permission Boundaries (Priority: P1)

Explicit Product Attributes grants control each tenant's catalog without an administrator bypass.

**Why this priority**: Reuse must not permit unauthorized or cross-tenant access.

**Independent Test**: Two tenants and each permission separately, including existing/new tenant
administrators, denied operations, missing-tenant context, and foreign IDs.

**Acceptance Scenarios**:

1. **US4.1 Given** no valid authentication, **When** any operation is attempted, **Then** it is
   rejected without catalog disclosure/mutation.
2. **US4.2 Given** insufficient permissions, **When** an operation is attempted, **Then** it is
   forbidden. View cannot mutate, Create cannot reactivate, Update cannot permanently delete,
   and Delete cannot bypass integrity; permissions do not imply one another.
3. **US4.3 Given** authentication without tenant context, **When** accessed, **Then** rejection
   occurs instead of using a default or client-selected tenant.
4. **US4.4 Given** tenant A's user and B's IDs, **When** listing/retrieval/update/status/deletion is
   attempted, **Then** B is neither disclosed nor changed; direct foreign lookups appear unavailable.
5. **US4.5 Given** A's user, **When** adding a value under B's attribute or using a foreign association,
   **Then** rejection prevents cross-tenant references.
6. **US4.6 Given** ownership overrides in create/update input, **When** submitted, **Then** rejection
   preserves authenticated tenant ownership and immutable IDs/associations.
7. **US4.7 Given** any response, **When** inspected, **Then** it contains no authentication secrets.
8. **US4.8 Given** any role, including existing/new tenant administrators, **When** permissions are
   assigned manually through existing mechanisms, **Then** only explicitly granted feature
   operations are allowed. Seeding/onboarding do not grant or restore feature rights; revoked
   grants deny access instead of triggering a bypass.

### Edge Cases

- Self/case-only/surrounding-whitespace renames exclude their own ID from conflicts. Concurrent
  conflicting writes persist no duplicates; inactive names remain reserved with useful conflicts.
- 'Storage Size' and 'Storage  Size' are distinct. Same names across tenants and same labels under
  different attributes are allowed; display capitalization is preserved.
- Percent/underscore search characters are literal; internal spaces are not collapsed. Surrounding
  search whitespace is trimmed; blank search applies no text filter, following existing conventions.
- Parent inactivity never rewrites child statuses or revokes management permission; ACTIVE
  management filtering is not a selection-availability query.
- Last-value deletion leaves a valid empty parent. Failed child deletion rolls back the entire
  attribute deletion. Deleted-name reuse always uses new IDs.
- Unknown/global static/dynamic/variant-role fields and invalid/null statuses are rejected.
  Omitted updates retain values. Foreign-valid and nonexistent IDs reveal no ownership difference.
- Backend checks do not trust UI warnings/confirmation. Inactive references still block future
  deletion; cancellation of future referenced renames changes nothing, including inactive status.
- Unique secondary ordering resolves ties; concurrent changes can alter pages and no snapshot
  guarantee is introduced. Exact tie-breaker selection is planning work.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Attributes MUST allow zero or many separately owned values, including ACTIVE empty
  attributes and empty creation, without enabling free-text product values.
- **FR-002**: Authorized users MUST retrieve/update attribute names/statuses while preserving ID,
  tenant, associations, and omitted fields.
- **FR-003**: Attribute lists MUST paginate, search names, filter individual ACTIVE/INACTIVE status,
  and include both statuses by default.
- **FR-004**: Authorized users MUST add/list/retrieve/update separate AttributeValue records,
  each with exactly one owning attribute in the same tenant. Value lists MUST paginate, search
  labels, and filter individual status within that parent; both statuses are included by default.
- **FR-005**: Every operation MUST enforce authentication, runtime tenant context, and the mapped
  Product Attributes permission through existing mechanisms, without administrator bypass.
- **FR-006**: Reads/writes/reference validation MUST enforce tenant and correct-parent ownership;
  inputs MUST NOT transfer identities, tenants, or value ownership.
- **FR-007**: Names/labels MUST be strings of 1–150 characters after surrounding-whitespace trimming;
  null/blank/whitespace-only/wrong-type/overlength input MUST yield useful field-specific errors.
  Display case/internal spaces MUST remain intact; invalid supplied statuses MUST fail.
- **FR-008**: Attribute names MUST be case-insensitively unique within a tenant and labels within
  their attribute, including inactive records. Different internal spacing is distinct. Conflicts
  MUST identify the attribute-name/value-label issue; inactive conflicts MUST explain reactivation
  by Update permission. Creates MUST NOT auto-reactivate; self-renames and concurrent writes MUST
  preserve uniqueness without false self-conflicts.
- **FR-009**: Attributes MUST NOT have global static/dynamic or variant-defining roles; per-product
  role selection belongs to a later assignment feature.
- **FR-010**: Responses MUST preserve established success/error/pagination contracts with safe
  explicit business fields and no authentication secrets.
- **FR-011**: Independent ACTIVE/INACTIVE statuses MUST default ACTIVE on creation and preserve
  omissions on update. Parent inactivity MUST suppress new selection without altering individual
  statuses or existing references; reactivating a child alone MUST NOT override parent inactivity.
- **FR-012**: Permanent deletion MUST be atomic: attribute plus all values together, or one value,
  only without blocking references including inactive references. Failure MUST leave data unchanged.
  Products/variants/transaction records MUST never be deleted by these operations.
- **FR-013**: Category/product assignments, category inheritance, product creation, variants, brands,
  pricing/quotations, inventory, transaction snapshots, replacement/reassignment, and frontend
  implementation MUST remain outside this feature.
- **FR-014**: Both lists MUST use page 1/pageSize 10 defaults, newest-created-first with a unique
  secondary key, accurate filtered counts, and no new global limit. Attribute-name sorting MUST
  remain supported. Search MUST be case-insensitive substring with literal percent/underscore.
  Invalid controls MUST fail; empty/out-of-range pages MUST return empty successful results.
- **FR-015**: Unreferenced values MUST be renameable after validation/duplicate checks, preserving
  ID/tenant/parent/associations/status/omissions, without creating replacements, regenerating variants,
  or changing SKU/stock. Referenced renames follow future integration requirement FR-019.
- **FR-016**: Deleted names/labels MUST be reusable through new records with new IDs. Deleting the
  last value MUST leave the parent's status unchanged and its empty state valid.
- **FR-017**: All roles, including existing/new tenant administrators, MUST require manually
  assigned Product Attributes permissions through existing authorization mechanisms. Catalog
  seeders MUST create the page/four accesses without granting role rights. Seeding/onboarding
  MUST NOT implicitly grant or restore feature rights. No authorization backfill migration is used.
- **FR-018**: Future consumers MUST warn that deletion is permanent and identify the attribute and
  affected value count; individual deletion identifies the value/parent and one affected value.
  Backend access/integrity MUST remain independent of UI confirmation. Blocked deletion MUST explain
  why and offer deactivation subject to Update permission.
- **FR-019**: Future referenced-value rename consumers MUST warn explicitly that current product/
  variant displays will use the new label and require confirmation. Cancellation MUST leave data
  unchanged; confirmed rename MUST preserve IDs, associations, status, variants, SKU, and stock.
- **FR-020**: Later integration MUST enforce backend deletion blocks for category/product assignments
  and child-value references, including inactive references, and block referenced-value deletion.
  No assignment tables or existing reference checks MUST be invented or claimed in this feature.

### Tenant Scope and Access Rules *(mandatory for business endpoints)*

The catalog is tenant-wide, without branch-specific ownership or selected-branch restrictions.
AttributeValue belongs to exactly one Attribute in the same tenant. Authentication provides tenant
context, validated at runtime for every operation. No public/platform-only operations are added;
foreign IDs and ownership overrides never establish access.

| Product Attributes permission | Covered attribute and value operations |
| --- | --- |
| View | Listing, searching, retrieving. |
| Create | Creating attributes and adding values. |
| Update | Renaming, activation, deactivation, reactivation. |
| Delete | Permanent deletion, subject to integrity. |

All roles require manual feature grants, including existing and newly onboarded tenant administrators.
Existing mechanisms enforce explicit grants and revoked-grant denial without an administrator bypass.
Catalog seeding creates permission choices only; onboarding and role seeders exclude implicit feature grants.

### Update Semantics and API Compatibility

Editable fields are attribute name/status and value label/status. Omission preserves existing values;
creation's ACTIVE default never resets update fields. Supplied status must be ACTIVE or INACTIVE;
null is invalid. IDs, tenants, and value ownership are immutable through these updates. No optional
business fields or replace-all-values operation is introduced.

Responses preserve existing validation/unavailable/permission/conflict conventions. Both lists use
items/page/pageSize/totalItems/totalPages within the established success format. Positive whole-number
page/pageSize default to 1/10; no new global limit is added. Creation-time sorting in both directions
is supported; default newest-created-first has a unique secondary key. Attribute-name ascending/
descending sorting remains supported and also uses a unique tie-breaker. Value label sorting is not
required. Exact tie-breaker and control names are planning details.

Search trims surrounding whitespace, treats an empty term as no text filter, preserves internal
spaces, and uses case-insensitive substring matching with literal percent signs/underscores. Status
filters match each record's own status, not its parent's selection availability. Existing category
contracts remain unchanged; exact endpoint and response-field design belongs to planning.

### Lifecycle and Integrity Rules *(mandatory for tenant-owned data)*

**D1 - Attributes and values (resolved)**: Attribute and AttributeValue are separate entities.
Attributes have zero or many values; each value has exactly one owner. Empty creation, ACTIVE empty
attributes, and last-value deletion are allowed. Empty definitions do not enable free-text values.

**D2 - Names, duplicates, search (resolved)**: Trim surrounding whitespace and accept 1–150 characters;
preserve display capitalization and internal spaces; compare case-insensitively for uniqueness.
Scope attribute names to tenant and labels to parent attribute, including inactive records. Different
internal spacing is distinct. Active duplicates conflict usefully; inactive conflicts explain Update-
permission reactivation. Creation never automatically reactivates. Deleted-name reuse gets new IDs;
self-renames and concurrent conflicts must not produce false conflicts or persisted duplicates.
Search matches substrings case-insensitively with literal percent signs and underscores.

**D3 - Status and deletion (resolved)**: Both independent statuses default ACTIVE on creation; omitted
update fields survive. New-selection availability requires both the parent and value ACTIVE. Parent
inactivity changes no child status or existing association. Reactivation preserves individual child
statuses; reactivating a child with an INACTIVE parent does not enable selection. Management visibility
includes both statuses by default and remains distinct from selection availability.

Permanent deletion removes an attribute with all its values, or an individual value, atomically and
only without blocking references. References from INACTIVE records also block. Products, variants,
and transaction records are never cascaded into. Blocked deletion explains the reason and offers
deactivation subject to Update. Consumers warn about permanence, attribute identity, and number
of affected values; backend authorization/integrity does not trust consumer confirmation.

**D4 - Renaming (resolved)**: Unreferenced values can be renamed after validation/duplicate checks.
Referenced renames require explicit future-consumer warning/confirmation that current product/variant
displays will use the new label. IDs and associations survive; no new value, variant regeneration,
SKU/stock change, or inactive-value reactivation occurs. Cancellation changes nothing. Dedicated
replacement-value/reassignment behavior is a future enhancement.

**D5 - Permissions (resolved; amended 2026-10-13)**: Product Attributes uses the
View/Create/Update/Delete map above. All roles, including existing/new tenant administrators,
require manual feature grants through existing mechanisms, with no bypass or automatic backfill.

**Current-feature and future-integration acceptance**:

| Coverage | Given / When / Then outcome |
| --- | --- |
| Current management | Given an ACTIVE/INACTIVE empty attribute, when managed with permission, then it stays valid without free-text product values. |
| Current status | Given mixed child statuses, when the parent deactivates/reactivates, then statuses remain unchanged and both remain manageable. |
| Current deletion | Given no blocking references and Delete, when deletion succeeds, then only target attribute/value records disappear; failure removes none and last-value deletion preserves the parent. |
| Future consumer deletion warning (FR-018) | Given an attribute with three values, when a consumer presents deletion, then it identifies the attribute/three values and warns of permanence; individual deletion identifies one affected value and parent. No UI is built now. |
| Future reference checks (FR-020) | Given category/product assignment or child-value references, including inactive ones, when deletion is attempted, then the backend blocks with a reason/deactivation alternative and never removes products/variants/transactions. |
| Future referenced rename (FR-019) | Given a referenced value, when rename is requested, then the consumer warns about current product/variant displays and gets confirmation; cancel changes nothing, confirmed rename preserves ID/associations/status/variants/SKU/stock. |
| Future selection integration | Given an ACTIVE value under an INACTIVE parent, when new selection is attempted, then it is unavailable; old references remain intact. |

Future integration rules are binding requirements for later category/product consumers, not claims
that assignment/reference tables, product selection, or those checks already exist. This feature
implements attribute/value management and real in-scope integrity. Later integration must attach
checks to real references before exposing reference-dependent deletion/rename/selection behavior.
Planning must identify that boundary and unavailable checks without fabricating assignment tables
or silently expanding scope. UI warning requirements do not authorize frontend implementation.

**Remaining material questions**: None identified. D1–D5 and listing/scope decisions are confirmed.
Backend mechanisms, grant application, tie-breaker selection, and future reference integration
are planning details, not requests to repeat owner approval.

### Verification Mapping

| Requirements / acceptance coverage | Intended verification |
| --- | --- |
| FR-001/002/004; US1.1–3, US2.1–3 | Empty creation, separate identities, ACTIVE defaults, correct parents, preserved display/omissions. |
| FR-007/008; US1.4–6, US2.4–5 | Lengths 1/150/151, invalid inputs, active/inactive conflicts, internal-spacing differences, self-renames, concurrent uniqueness. |
| FR-003/014; US3.1–7 | Both lists, literal-wildcard search, own-status filtering, counts/empty pages, defaults/tied timestamps, attribute-name sorting. |
| FR-005/006/017; US2.6, US4.1–6/8 | Every permission, missing tenant, cross-tenant/wrong-parent operations, existing/new admin grants, other-role exclusions and revoked-grant denial. |
| FR-010; US1.2, US3.1–4, US4.7 | Safe fields, established envelopes/pagination, useful errors without secrets or foreign disclosure. |
| FR-011/015; US1.3/7/8, US2.3/8/9 | Independent status/parent availability versus management visibility, omissions and rename preservation. |
| FR-012/016; US1.9, US2.7, deletion edge cases | Atomic success/failure, child removal, last-value deletion, name reuse with new IDs, actual in-scope relationship integrity. |
| FR-009/013; US1.1/10, US2.2/3 | No global role, assignments, variant generation, SKU/stock mutation, unrelated features, or UI implementation. |
| FR-018/019/020; integration table | Recorded warning/confirmation/reference restrictions including inactive references; executable integration verification belongs to later consuming features. |

All scenarios and outcomes above remain requirements. Under owner-approved PA-TEST-001,
automated unit/integration/E2E/concurrency/rollout tests and their infrastructure are deferred,
not completed or passed. Current verification is type checking, non-fixing lint, build, manual API
checks and migration review; record actual results and effects. Manual checks do not prove
concurrency behavior or provide automated regression coverage. Future-only cases remain deferred
to their consuming features. No application checks, migrations, seeds or permission updates ran
in this documentation update; the project-wide constitution testing principle is unchanged.

### Key Entities *(include if feature involves data)*

- **Attribute**: Tenant-owned reusable concept with stable ID, trimmed 1–150-character name,
  ACTIVE/INACTIVE status defaulting ACTIVE, and zero or many AttributeValue records. Name uniqueness
  is case-insensitive within tenant and includes INACTIVE records. No global static/dynamic/variant role.
- **AttributeValue**: Separate tenant-owned choice with stable ID, exactly one Attribute owner,
  trimmed 1–150-character label, and independent ACTIVE/INACTIVE status defaulting ACTIVE. Label
  uniqueness is case-insensitive within parent, including INACTIVE values; display case/internal
  spaces survive. Availability also depends on parent status.
- **Authenticated Tenant User and Operation Permission**: Existing access context and Product
  Attributes grants; no new user/role model or administrator bypass.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create ACTIVE empty Color/Storage, add the six example choices, retrieve
  each correctly, and rename an unreferenced value without identity loss/products. Last-value
  deletion leaves a valid parent with unchanged status.
- **SC-002**: Separate 23-record attribute/value lists produce 10/10/3 records across three pages
  at size 10. Search/status combinations have correct counts and deterministic unchanged-result
  ordering, including tied creation times.
- **SC-003**: Every specified authentication/permission/missing-tenant/cross-tenant/wrong-parent
  denial case leaves records private/unchanged. Existing/new admin grants work, while other roles
  and revoked grants get no implicit access.
- **SC-004**: All invalid-input/active-inactive duplicate cases yield useful errors and unchanged
  prior state. Case duplicates conflict, distinct internal spaces do not, concurrent writes
  produce no duplicates, and creation never auto-reactivates.
- **SC-005**: Updates/status changes preserve IDs/associations/omissions/individual child statuses;
  parent inactivity suppresses selection without removing references; inactive renames stay inactive.
  No global static/dynamic/variant-defining role is stored.
- **SC-006**: Allowed deletion removes only target attribute/value records; failures remove none.
  Reused deleted names get new IDs. No product/variant/SKU/stock/transaction mutation is introduced.

These are targets, not test results. Consumer warnings/confirmation and assignment-reference cases
are future integration acceptance requirements, separate from current implementation targets.
No unsupported performance/load or user-satisfaction target is invented.

## Assumptions

- Tenant-wide reuse rather than branch ownership remains scope; management is distinct from
  availability for new selection. No tenant sharing or ownership transfer is introduced.
- Values are human-readable labels, not typed numeric/unit interpretations; empty attributes
  do not enable free-text product values.
- D1–D5/listing decisions are explicit owner decisions, not inferred defaults. Existing authentication,
  permissions, validation, and response contracts are dependencies; mechanics belong to planning.
- Permanent deletion/status management of attributes/values is in scope. Category–attribute assignments/
  inheritance, product assignments/creation, variants, brands, pricing/quotations, inventory,
  transaction snapshots, replacement/reassignment, and frontend implementation remain excluded.
- Consumer warnings, preserved references, and deletion/rename restrictions are explicit future
  integration requirements. This spec invents no category/product assignment tables or existing
  reference checks. UI confirmation never replaces backend authorization/integrity.
- The 2026-10-13 owner decision requires manual feature-role grants, including for existing/new
  tenant administrators. Future actual references remain a later integration. No grants, migrations
  or seeds were executed by this policy amendment.

**Repository context inspected on 2026-10-08**: Product settings contains categories with explicit
permission checks; the inspected permission catalog has no Product Attributes entry. This is a
source observation, not a deployed-database claim. Existing category lifecycle/validation is
context, not the chosen attribute policy. References prescribe no implementation design and must
be reverified when relied on later:

- [Project constitution](../../.specify/memory/constitution.md)
- [Settings composition](../../src/modules/settings/settings.module.ts)
- [Product-settings catalog](../../src/modules/settings/product-settings/product-settings.module.ts)
- [Existing category operations](../../src/modules/settings/product-settings/category.controller.ts)
- [Existing category validation](../../src/modules/settings/product-settings/dto/category/upsert-category.dto.ts)
- [Existing pagination conventions](../../src/common/dto/pagination-query.dto.ts)
- [Existing response contracts](../../src/common/types/api-response.interface.ts)
- [Existing permission designations](../../src/modules/roles-and-permissions/enums/permissions.enum.ts)
- [Existing permission catalog](../../src/database/seeds/authorization/page.seeder.ts)
