# HTTP Contract: Product Attributes

Feature directory: 001-product-attributes; actual Git branch: chore/setup-spec-kit.
Implemented route contract; base path /api/product-settings/attributes.
All ten routes and their services/mappers are authored and wired as of 2026-10-12.
See [../review.md](../review.md) for final implementation details and owner decisions.
No manual API verification or migration execution is claimed.
Cookie JWT authentication and explicit ProductAttributes permission metadata apply to every route.
No tenantId/branchId override, public route, or administrator bypass. Missing tenant context is 400;
missing authentication 401; insufficient permission 403; unavailable/foreign/wrong-parent IDs 404.
IDs use ParseUUIDPipe; syntactically malformed IDs return 400.

Per the owner decision of 2026-10-13, all feature-role permissions are assigned manually through
existing role-permission mechanisms. Page/access seeders create the catalog only; no backfill migration,
administrator mapping or automatic onboarding/seeder grants are used. Administrator names confer
no access. Route permission checks, tenant ownership and revoked-grant denial remain mandatory.
PA-TEST-001 defers automated verification, not these contracts. Written acceptance remains required;
manual checks do not prove concurrency behavior or provide automated regression coverage.

## Endpoints

| Method / route (relative to base) | Permission | Request / response | Success |
| --- | --- | --- | --- |
| POST / | CREATE | UpsertAttributeDto -> AttributeResponseDto | 201 |
| GET / | VIEW | AttributePaginationQueryDto -> paginated AttributeResponseDto | 200 |
| GET /:attributeId | VIEW | owned ID -> AttributeResponseDto | 200 |
| PATCH /:attributeId | UPDATE | UpdateAttributeDto -> AttributeResponseDto | 200 |
| DELETE /:attributeId | DELETE | owned ID -> data:null | 200 |
| POST /:attributeId/values | CREATE | UpsertAttributeValueDto -> AttributeValueResponseDto | 201 |
| GET /:attributeId/values | VIEW | AttributeValuePaginationQueryDto -> paginated AttributeValueResponseDto | 200 |
| GET /:attributeId/values/:valueId | VIEW | owned parent/child -> AttributeValueResponseDto | 200 |
| PATCH /:attributeId/values/:valueId | UPDATE | UpdateAttributeValueDto -> AttributeValueResponseDto | 200 |
| DELETE /:attributeId/values/:valueId | DELETE | owned parent/child -> data:null | 200 |

No bulk/create-with-values endpoint. Attribute creation is independent and values are added via
nested create. Activation/deactivation/reactivation uses PATCH status; Create never reactivates.
Attribute DELETE removes all child values explicitly/atomically; DELETE never accepts a UI flag
as evidence of authorization. No value-reparenting, assignment, or replacement endpoint.

## Request DTOs

| DTO | Fields |
| --- | --- |
| UpsertAttributeDto | name required; status optional, service default ACTIVE only when omitted. |
| UpdateAttributeDto | name and status optional individually; at least one supplied supported field. |
| UpsertAttributeValueDto | label required; status optional, omitted defaults ACTIVE. |
| UpdateAttributeValueDto | label and status optional individually; at least one supplied supported field. |
| AttributePaginationQueryDto | page, pageSize, sortBy createdAt or name, sortOrder ASC/DESC, search, status. |
| AttributeValuePaginationQueryDto | page, pageSize, sortBy createdAt, sortOrder ASC/DESC, search, status. |

No creation default is assigned in update DTOs. The consolidated upsert files define shared fields
and derived update DTOs; this is an implementation detail, not an HTTP payload change. Supplied null
must fail. Optional writable status uses ValidateIf(value !== undefined); update DTOs use
PartialType(..., { skipNullProperties: false }). Services reject updates with no supported fields.
Transform trims strings only; never converts numbers/objects into names. Standard DTO decorators
can enforce well-formed scalar input, code-point length 1–150 after trim, and NUL rejection; a custom
validator file is not required. Name and label use identical inline IsString/IsNotEmpty/NotContains
and Unicode Matches decorators after trimming. No Unicode normalization or comparison keys are
computed in JavaScript.
No new global validation settings. Global whitelist/forbidNonWhitelisted rejects unrelated properties.

PATCH {} returns 400 errorCode EMPTY_UPDATE; supported unchanged values count as a valid idempotent
semantic request. Unknown-only payloads are validation errors, not empty updates. Identity, owner,
parent, timestamps, arrays of values, and global static/dynamic/variant-role fields are not accepted.

Query strings convert page/pageSize to numbers and validate positive safe integers. Reject unsafe
integer/offset arithmetic instead of rounding it; this technical representability check is not a
new global business page-size limit. Sort/status enums are exact uppercase; default page=1, pageSize=10,
sortBy=createdAt, sortOrder=DESC, status omitted=both. search is optional string, trims surrounding
whitespace, empty=unfiltered. Supplied null/wrong-type/status errors fail rather than being ignored.

## Search and ordering

**Implementation deviation, 2026-10-14:** The owner subsequently requested Find Options only,
removing Raw/QueryBuilder. Current search and duplicate prechecks use escaped ILike under column
collation; the original ICU rule below is no longer guaranteed by application prechecks/search.
The unchanged ICU database unique indexes still reject duplicates. Literal %, _ and backslash
are escaped using PostgreSQL's default backslash escape; ! remains literal. No database check
was executed to establish Unicode equivalence. This records a difference, not a silent change
to the original agreed comparison requirement.

All SQL uses bound parameters. For search choose explicit LIKE ESCAPE '!': escape ! to !!, % to !%,
and _ to !_, then surround the result with the two intended % substring wildcards. Backslash is
literal under this escape choice. Do not interpolate user input, sort identifiers, or escape tokens.
Compare database lower(display COLLATE pg_catalog."und-x-icu") COLLATE "C" with the bound pattern
lowered by that identical expression. No regex interpretation or database-default ILIKE semantics.

This reuses the existing deterministic ICU root collation, verified only in the local database;
no custom collation or feature-specific PostgreSQL 15+ floor. Other targets must pass the comparison
checks in research.md. Endpoint/business rules are unchanged by this technical revision.

Per the owner's approved sorting decision, attribute-name ordering uses the stored name column
with its database collation plus id in the same direction (C collation in the authored schema);
creation-time ordering uses createdAt plus id in the same direction (default both DESC). Map only
allowlisted DTO sort choices to fixed expressions; never accept arbitrary SQL column identifiers.
Values are always nested under tenant-validated parent; status filtering matches own status and
never filters parent inactivity from management. Parent unavailable=404; owned parent with no values
returns an empty page. Pagination counts include the combined search/status predicates. totalPages
is ceil(totalItems/pageSize), zero for no items; a page beyond the last retains requested page and
actual totals. No snapshot guarantee across concurrent catalog changes.

## Response fields and envelopes

| DTO | Explicit mapped fields |
| --- | --- |
| AttributeResponseDto | id:string(UUID), tenantId:string(UUID), name:string, status:ACTIVE/INACTIVE, createdAt/updatedAt:ISO timestamps, valueCount:integer >=0. |
| AttributeValueResponseDto | id:string(UUID), attributeId:string(UUID), label:string, status:ACTIVE/INACTIVE, createdAt/updatedAt:ISO timestamps, isAvailableForSelection:boolean. |

valueCount counts all child statuses, not just current search filters. Listing uses one tenant-scoped
grouped query for the returned page IDs; detail retrieval uses a scoped count. No N+1 list calls;
count is advisory for future consumer warning and can
change concurrently. isAvailableForSelection is computed from parent ACTIVE and own ACTIVE, not an
assignment or new-selection API. No persisted effective-status field. Neither response embeds raw
Tenant/User/authentication objects, normalized keys, secrets, internal SQL, or a product role.

Implementation update, 2026-10-14: valueCount now uses Find Options selecting attribute IDs and
counts the returned values in memory, in batches of up to 1000 requested attributes. It remains
tenant-scoped, includes both statuses and avoids one query per attribute, but transfers more rows
than the originally described grouped query. Response fields and metadata remain unchanged.

All success responses use ApiResponseUtil.success with existing convention:

```json
{
  "success": true,
  "message": "Attributes fetched successfully.",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

Create/get/PATCH use one mapped DTO as data. DELETE uses data:null and an explanatory success message.
Add feature message constants only; do not change category messages or the global response filter.

## Errors and inactive duplicate information

Keep IApiErrorResponse unchanged: success=false, message:string, errors?:string[], errorCode?:string.
DTO validation keeps the existing validation message plus field-specific errors array. Expected
feature errors are Nest exceptions with this compatible object response; unknown failures stay
safe generic 500 logged by the existing filter. Do not add details/data fields that the filter drops.

| Status | errorCode | Meaning |
| --- | --- | --- |
| 400 | TENANT_CONTEXT_REQUIRED | Authenticated request lacks required tenant context. |
| 400 | EMPTY_UPDATE | PATCH has no supported supplied field. |
| 404 | ATTRIBUTE_NOT_FOUND / ATTRIBUTE_VALUE_NOT_FOUND | Unavailable/foreign parent or child, without ownership disclosure. |
| 409 | ATTRIBUTE_NAME_DUPLICATE_ACTIVE | Active same-tenant attribute-name collision. |
| 409 | ATTRIBUTE_NAME_DUPLICATE_INACTIVE | Inactive same-tenant name collision; Update can reactivate. |
| 409 | ATTRIBUTE_VALUE_LABEL_DUPLICATE_ACTIVE | Active same-parent value-label collision. |
| 409 | ATTRIBUTE_VALUE_LABEL_DUPLICATE_INACTIVE | Inactive same-parent collision; Update can reactivate. |
| 409 | ATTRIBUTE_NAME_CONFLICT / ATTRIBUTE_VALUE_LABEL_CONFLICT | Concurrent conflict where winner is no longer visible after rollback. |
| 409 | ATTRIBUTE_WRITE_RETRYABLE | 40P01/40001 collision; retry request, no uncontrolled loop. |

Example inactive conflict, usable by a future UI without a shared contract change:

```json
{
  "success": false,
  "message": "An inactive attribute with this name already exists. A user with Update permission can reactivate it.",
  "errorCode": "ATTRIBUTE_NAME_DUPLICATE_INACTIVE"
}
```

The enum-like code encodes entity/conflict/inactive status; reactivation requires a separate authorized
PATCH. No auto-reactivation, other-role grant, foreign candidate ID, or secret is disclosed. Clients
with View may use existing scoped search/status lists to locate the candidate. A user without View
gets no candidate ID; Create does not imply Update. Active errors contain no reactivation suggestion.
Self-renames exclude own ID; inactive records reserve names. DB 23505 fallback uses known constraint
names and requery after transaction rollback, never inside an aborted transaction.

## Deletion and future consumer contracts

Current deletion authorizes independently, locks parent first, explicitly deletes children and parent
in one transaction, and translates only known feature constraints. Expected parent disappearance
returns 404; unexpected FK/constraint errors are not exposed as SQL or fake product-reference counts.

All same-parent mutations serialize, including different value IDs. Transactions contain only short
database operations, never confirmation or network work. This can cause contention on hot attributes;
retain the simple protocol unless measurements justify a change. Ordinary listing/retrieval does not
acquire mutation locks. Retryable conflict codes remain as defined above.

When real future assignment/reference constraints are introduced, add known mappings for
ATTRIBUTE_DELETE_BLOCKED_REFERENCE and ATTRIBUTE_VALUE_DELETE_BLOCKED_REFERENCE (409), with a safe
reason and deactivation alternative requiring Update. No current endpoint claims those nonexistent
checks run. Inactive referencing rows block identically. Restrictive FKs stop any deletion race;
never cascade into product/variant/transaction records.

Future consumers must warn about permanence, attribute identity and affected value count, and for
individual deletion the value plus parent and one affected value. Counts can change; the later
consumer integration must resolve warning freshness against concurrent changes before shipping.
UI confirmation is neither authorization nor integrity evidence. No frontend is built now.

Future referenced renames must warn that current product/variant displays use the new label and
obtain explicit confirmation; cancellation is no mutation. The later reference-aware backend/consumer
must define and enforce its race-safe confirmation protocol when references exist. This v1 contract
adds no unsupported confirm flag, assignment table, replacement workflow, variant regeneration,
SKU/stock mutation, or transaction snapshot behavior.
