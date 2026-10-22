# Feature Specification: Category–Attribute Assignment with Hierarchical Inheritance

**Feature Branch**: `002-category-attributes`

**Feature Directory**: `specs/002-category-attributes`

**Created**: 2026-10-19

**Status**: Draft (Specification complete; clarifications confirmed by project owner)

**Input**: User description: "Assign reusable attributes to categories and make ancestor-assigned attributes available to descendant categories without copying them. Clothing directly assigns Material. Shirts, under Clothing, directly assigns Size and Colour. Shirts therefore has Material, Size, and Colour available."

---

## Clarifications

### Session 2026-10-19

Het Pandya (project owner) reviewed repository conventions and confirmed the following decisions:

- **Q1 (Category Deletion Behavior)**: How should category deletion behave when a category has direct attribute assignments?
  - **Decision**: Automatically remove direct category-attribute assignments when the category is deleted (cascade-delete assignment mapping records). The reusable attributes and their predefined values themselves remain intact in the tenant catalog. (D1)
- **Q2 (Inactive Ancestor Inheritance)**: When an ancestor category is INACTIVE, do descendant categories continue to inherit its directly assigned attributes?
  - **Decision**: Yes, descendants inherit attributes regardless of ancestor category status. The structural taxonomy hierarchy governs inheritance; whether an attribute can be selected is independently governed by the attribute's own `ACTIVE`/`INACTIVE` status (inactive attributes remain visible in management views but marked unavailable for selection). (D2)
- **Q3 (Permission Mapping)**: Which page and permission rights authorize category-attribute assignment operations?
  - **Decision**: Governed entirely under existing `Page.ProductCategories` permissions: `ProductCategories:VIEW` is required to view assigned and effective attributes of a category; `ProductCategories:UPDATE` is required to assign or unassign attributes on a category. No new permission page or cross-module permission check is introduced. (D3)

---

## User Scenarios & Testing *(mandatory)*

Automated tests remain deferred under project convention (owner decision PA-TEST-001); acceptance criteria below define the functional verification baseline.

### User Story 1 - Direct Category Attribute Assignment & Listing (Priority: P1)

An authorized catalog manager assigns reusable product attributes directly to a specific product category so that products in that category can leverage those attribute definitions. The user can view directly assigned attributes and remove direct assignments when no longer applicable.

**Why this priority**: Direct assignment is the foundational building block required before inheritance and downstream product usage can function.

**Independent Test**: Directly assign active attributes to a root category, retrieve the category's direct attributes, and unassign an attribute; verify unassignment leaves the reusable attribute and its predefined values intact in the tenant catalog.

**Acceptance Scenarios**:

1. **US1.1 Given** an authenticated tenant user with `ProductCategories:UPDATE` permission, an existing category, and an ACTIVE attribute within the same tenant, **When** the attribute is assigned to the category, **Then** the direct assignment is persisted and returned with direct assignment metadata.
2. **US1.2 Given** an attribute that has no predefined values, **When** it is assigned to a category, **Then** the assignment succeeds without requiring predefined values.
3. **US1.3 Given** an attribute that is INACTIVE, **When** a user attempts to newly assign it to a category, **Then** the system rejects the assignment with a validation conflict explaining that only active attributes can be assigned.
4. **US1.4 Given** an attribute that is already directly assigned to Category A, **When** a user attempts to directly assign the same attribute to Category A again, **Then** the request is rejected as a duplicate assignment.
5. **US1.5 Given** an existing direct assignment of Attribute X on Category A, **When** an authorized user unassigns Attribute X from Category A, **Then** only the direct mapping is removed; Attribute X and all its predefined values remain intact in the tenant attribute catalog.
6. **US1.6 Given** a category with multiple direct attribute assignments and a user with `ProductCategories:VIEW` permission, **When** the user requests the category's assigned attributes, **Then** the response returns the directly assigned attributes including their ID, name, status, value count, and direct assignment source.

---

### User Story 2 - Hierarchical Attribute Inheritance & Category Movement (Priority: P2)

A catalog manager organizes categories into ancestor-descendant hierarchies (e.g., Clothing -> Shirts -> Formal Shirts). Descendant categories automatically have all ancestor-assigned attributes available as inherited attributes without duplicating records. Moving a category within the hierarchy recalculates inherited attributes dynamically.

**Why this priority**: Inheritance eliminates repetitive configuration across deep category trees and enables consistent attribute availability across catalog taxonomy.

**Independent Test**: Assign Material to Clothing; assign Size and Color to Shirts (child of Clothing). Request effective attributes for Shirts to verify all three attributes appear, with Material marked as inherited (source: Clothing) and Size/Color marked as direct (source: Shirts). Reparent Shirts to a new root and verify inherited attributes update immediately.

**Acceptance Scenarios**:

1. **US2.1 Given** Category "Clothing" with directly assigned attribute "Material", and child Category "Shirts" with directly assigned attributes "Size" and "Color", **When** effective attributes for "Shirts" are requested, **Then** the response returns "Material" (inherited, source Category: Clothing), "Size" (direct, source Category: Shirts), and "Color" (direct, source Category: Shirts).
2. **US2.2 Given** an attribute already inherited from an ancestor category, **When** a user attempts to directly assign that same attribute to a descendant category, **Then** the request is rejected because the attribute is already available via inheritance.
3. **US2.3 Given** an inherited attribute on Category B (sourced from ancestor Category A), **When** a user attempts to unassign that attribute at Category B, **Then** the request is rejected with an error stating inherited mappings must be managed at their source category (Category A).
4. **US2.4 Given** Category B with direct attribute "Fit", and Category A (separate branch) that later assigns "Fit", **When** Category B is moved under Category A (reparented) creating an overlap, **Then** existing direct mappings on Category B are preserved, and the effective attribute response deduplicates "Fit" so it appears exactly once with direct mapping preserved.
5. **US2.5 Given** Category B under Category A, inheriting Category A's attributes, **When** Category B is moved to root (parentId set to null) or under Category C, **Then** effective attributes for Category B and all its descendants immediately reflect the new ancestor hierarchy without manual data migration.

---

### User Story 3 - Lifecycle, Inactivity & Referential Integrity (Priority: P3)

A catalog manager deactivates attributes or categories, deletes categories with direct assignments, or attempts to delete attributes referenced by category mappings. The system ensures mappings are preserved during deactivation, flags unavailable attributes clearly in management views, cascade-removes mappings upon category deletion, and strictly prevents deletion of attributes that are mapped to any category.

**Why this priority**: Prevents orphaned mappings, broken taxonomy definitions, and inconsistent catalog state across lifecycle transitions.

**Independent Test**: Deactivate an assigned attribute and verify it remains visible in category management responses marked unavailable for selection; attempt to permanently delete an attribute that is assigned to any category and verify deletion is blocked with a descriptive error. Delete a leaf category with assignments and verify mappings are cleaned up while attributes survive.

**Acceptance Scenarios**:

1. **US3.1 Given** an attribute assigned to one or more categories, **When** the attribute is deactivated (`status: INACTIVE`), **Then** all existing category assignments remain intact; category attribute management responses return the attribute clearly marked as INACTIVE and unavailable for new product selection.
2. **US3.2 Given** an attribute assigned to any category (active or inactive category), **When** a user attempts to permanently delete the attribute via the attribute management endpoint, **Then** the deletion is rejected because the attribute is referenced by existing category mappings.
3. **US3.3 Given** an attribute with zero category assignments, **When** permanent deletion is requested and no other references block it, **Then** deletion proceeds according to the existing attribute deletion rules.
4. **US3.4 Given** a category with direct attribute assignments (and no child categories), **When** the category is deleted, **Then** the system automatically removes all direct category-attribute assignment records for that category; the associated attributes and their predefined values in the attribute catalog remain intact.
5. **US3.5 Given** an ancestor category with status `INACTIVE` having directly assigned attributes, **When** effective attributes are requested for an active descendant category, **Then** the attributes from the inactive ancestor category are included in the effective list (governed by taxonomy hierarchy), with individual attribute availability reflecting each attribute's own active status.

---

### Edge Cases

- **Circular category hierarchy attempt**: Moving a category to create a cycle is already prevented by existing category service validation (`CIRCULAR_DEPENDENCY`); attribute resolution relies on an acyclic tree.
- **Deep category hierarchy (e.g., 10+ levels)**: Effective attribute resolution traverses ancestor chains efficiently within tenant boundaries and deduplicates attributes by attribute ID.
- **Concurrent assignment of identical attribute**: Database uniqueness constraint prevents duplicate direct assignment of the same attribute to the same category.
- **Cross-tenant entity references**: Attempting to assign an attribute belonging to Tenant B to a category belonging to Tenant A is rejected with a 404 Not Found error without revealing cross-tenant entity presence.
- **Attribute with zero predefined values**: Successfully assigned and inherited; predefined values are not required for category assignment.
- **Category reparenting with multiple overlaps**: When moving a category introduces multiple attributes already assigned directly in the moving subtree, all direct assignments in the subtree are preserved and deduplicated in effective output.
- **Unassignment of non-existent assignment**: Attempting to unassign an attribute that is not directly assigned to the category returns a 404 Not Found error.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authorized user to assign one or more existing active attributes directly to a specified category within the authenticated tenant.
- **FR-002**: The system MUST allow a single attribute to be assigned to multiple categories across the tenant catalog.
- **FR-003**: The system MUST enforce that both the category and the attribute belong to the authenticated user's tenant at runtime; cross-tenant assignments MUST be rejected.
- **FR-004**: The system MUST reject direct assignment of an attribute that is currently `INACTIVE`.
- **FR-005**: The system MUST permit direct assignment of active attributes that have zero predefined values.
- **FR-006**: The system MUST reject a new direct assignment if the attribute is already directly assigned to the target category.
- **FR-007**: The system MUST reject a new direct assignment if the attribute is already available on the target category via inheritance from an ancestor category.
- **FR-008**: The system MUST provide an endpoint to list the direct attribute assignments of a specified category.
- **FR-009**: The system MUST provide an endpoint to list the effective (direct plus ancestor-inherited) attributes of a specified category, where each attribute appears exactly once.
- **FR-010**: The effective attribute response MUST distinguish direct assignments from inherited assignments and identify the source category (`sourceCategoryId`, `sourceCategoryName`, `assignmentType: DIRECT | INHERITED`) for each attribute.
- **FR-011**: The system MUST allow an authorized user to unassign a directly assigned attribute from a specified category, removing only the mapping record.
- **FR-012**: Unassignment of a direct category-attribute mapping MUST NOT delete or alter the underlying attribute or its predefined values.
- **FR-013**: The system MUST reject attempts to unassign an inherited attribute at a descendant category, requiring unassignment to be performed at the source category where it is directly assigned.
- **FR-014**: When a category's parent is updated (category movement/reparenting), effective attributes for the category and its descendants MUST dynamically reflect the new ancestor hierarchy.
- **FR-015**: If a category movement causes an ancestor's assigned attribute to overlap with an existing direct assignment on a descendant, the system MUST preserve the descendant's direct mapping and deduplicate the effective attribute list.
- **FR-016**: Deactivation of an attribute MUST preserve existing category assignments; management responses MUST include inactive attributes and clearly flag them as unavailable for selection (`isSelectable: false`).
- **FR-017**: The system MUST block permanent deletion of an attribute if it is referenced by any category assignment mapping (regardless of whether the category or attribute is active or inactive).
- **FR-018**: Category-attribute assignments MUST use the attribute's existing predefined values; category-specific value subsets, restrictions, and overrides are excluded from this feature.
- **FR-019**: When a category is deleted, the system MUST automatically remove all associated direct category-attribute assignment records in a cascade manner, leaving the underlying attributes and their values intact.
- **FR-020**: Descendant categories MUST inherit attributes directly assigned to ancestor categories regardless of whether an ancestor category is `ACTIVE` or `INACTIVE`; attribute availability for product use remains governed by the individual attribute's active status.
- **FR-021**: Access to category-attribute assignment endpoints MUST be governed by `Page.ProductCategories`: `VIEW` permission to inspect direct and effective category attributes, and `UPDATE` permission to assign or unassign category attributes.

---

### Tenant Scope and Access Rules *(mandatory for business endpoints)*

- **Tenant Isolation**: All operations MUST extract `tenantId` exclusively from the verified JWT payload (`user.tenantId`). Client-supplied tenant IDs in request bodies or query parameters MUST NOT be accepted or trusted.
- **Referenced Entity Verification**: Any category or attribute referenced in an assignment or retrieval operation MUST be verified to exist within the authenticated tenant. If an entity does not exist or belongs to a different tenant, the system MUST return a 404 Not Found error without revealing cross-tenant existence.
- **Branch Access**: Category and attribute configurations are tenant-wide catalog definitions and do not require individual branch scoping.
- **Permissions**:
  - Viewing direct or effective attributes of a category (`GET /product-settings/categories/:id/attributes`, `GET /product-settings/categories/:id/attributes/effective`) requires authenticated tenant access and `Permissions(Page.ProductCategories, Permission.VIEW)`.
  - Assigning attributes to a category (`POST /product-settings/categories/:id/attributes`) requires authenticated tenant access and `Permissions(Page.ProductCategories, Permission.UPDATE)`.
  - Unassigning attributes from a category (`DELETE /product-settings/categories/:id/attributes/:attributeId`) requires authenticated tenant access and `Permissions(Page.ProductCategories, Permission.UPDATE)`.

---

### Update Semantics and API Compatibility

- **Assignment Endpoint**: Direct assignment endpoint accepts one or more attribute UUIDs (`{ attributeIds: string[] }`). The operation is additive for newly specified attributes and MUST validate each attribute against assignment rules.
- **Unassignment Endpoint**: Unassignment removes the specific category-attribute mapping by category ID and attribute ID.
- **Idempotency & Rejection**: Attempting to assign an already directly assigned or inherited attribute MUST return a clear 409 Conflict error specifying the offending attribute and source category.
- **Response Format**: Responses MUST follow the standard `ApiResponseUtil` envelope (`success: true`, `message`, `data`).
- **No Impact on Existing Category APIs**: Existing category CRUD endpoints (`GET /product-settings/categories`, `POST`, `PATCH`, `DELETE`, `GET /product-settings/categories/tree`) retain their current contracts and response schemas.

---

### Lifecycle and Integrity Rules *(mandatory for tenant-owned data)*

- **Mapping Table Uniqueness**: A composite unique constraint on `(tenant_id, category_id, attribute_id)` MUST prevent duplicate direct assignments.
- **Attribute Deletion Protection**: Permanent deletion of an attribute in `ProductAttributeService.deleteAttribute` MUST check for references in category-attribute mappings and reject deletion with a descriptive conflict error if any mapping exists.
- **Attribute Deactivation**: When an attribute's status transitions to `INACTIVE`, existing category mappings remain intact. The attribute continues to appear in category attribute management endpoints with `status: INACTIVE` and an availability indicator (`isSelectable: false`).
- **Category Deletion**: When a category is deleted, its direct category-attribute mapping records are removed automatically (foreign key `ON DELETE CASCADE` or transactional cleanup), while the referenced attributes and their values remain intact in the catalog.
- **Category Deactivation**: Deactivating a category preserves all its direct attribute assignments and does not sever attribute inheritance for descendant categories.
- **Database Constraints**: Foreign keys from the category-attribute assignment table MUST reference `product_categories(id)` and `product_attributes(id)`.
- **Atomic Operations**: Assignment, unassignment, and category deletion operations modifying mappings MUST execute inside database transactions to ensure consistency.

---

### Verification Mapping

- **Direct Assignment**: Verified by attempting assignment of active, inactive, duplicate, and non-existent attributes, confirming appropriate success and rejection responses.
- **Hierarchy & Inheritance**: Verified by creating multi-level category hierarchies (Root -> Child -> Grandchild), assigning attributes at different levels, and verifying effective attribute responses accurately aggregate and attribute source categories.
- **Category Reparenting**: Verified by reparenting a category with direct assignments under an ancestor with overlapping assignments, confirming direct assignments survive and effective output deduplicates.
- **Unassignment Rules**: Verified by unassigning direct mappings (success), attempting to unassign inherited mappings (rejected), and confirming attribute and values survive in catalog.
- **Category Deletion Cascade**: Verified by assigning attributes to a leaf category, deleting the category, and asserting that category-attribute mappings are cleanly removed while attributes and values remain intact.
- **Attribute Deletion Blocking**: Verified by assigning an attribute to a category and asserting that `DELETE /product-settings/attributes/:id` returns a conflict error.
- **Inactive Ancestor Inheritance**: Verified by deactivating an ancestor category and asserting that child categories continue to inherit its assigned attributes.
- **Tenant Isolation**: Verified by attempting to assign an attribute belonging to Tenant B to a category belonging to Tenant A, asserting 404 rejection.

---

### Key Entities *(include if feature involves data)*

- **CategoryAttributeMapping (new join entity)**: Represents the direct assignment of a reusable attribute to a product category.
  - Attributes: `id` (UUID, primary key), `tenantId` (UUID, tenant partition), `categoryId` (UUID, foreign key to category), `attributeId` (UUID, foreign key to attribute), `createdAt` (timestamp).
- **ProductCategory (existing entity)**: Represents a hierarchical category node in the product catalog taxonomy.
  - Relationship: Has zero or many directly assigned attributes via CategoryAttributeMapping.
- **ProductAttribute (existing entity)**: Represents a reusable specification definition (e.g., Material, Color, Size).
  - Relationship: Has zero or many category assignments via CategoryAttributeMapping.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Catalog managers can view all available attributes for any category (including all inherited ancestor attributes) in a single unified response without manual aggregation.
- **SC-002**: 100% of newly created direct assignments are validated against tenant boundary, attribute active status, and hierarchy inheritance rules before persistence.
- **SC-003**: Reparenting a category immediately updates effective attribute availability for that category and all descendants without requiring background re-indexing or manual attribute updates.
- **SC-004**: Zero orphaned assignments can be created: attempting to permanently delete an attribute mapped to any category is 100% blocked until all category assignments are removed.
- **SC-005**: Effective attribute responses unambiguously identify whether each attribute is direct or inherited and specify the exact source category name and ID.
- **SC-006**: Deleting a category automatically and cleanly removes its direct assignment mappings without leaving orphaned foreign key references or deleting reusable catalog attributes.

---

## Assumptions

- **Existing Data Compatibility**: Existing categories and attributes in the database require no data backfill; existing categories simply start with zero direct attribute assignments.
- **Values Reusability**: All predefined values of an assigned attribute are available wherever the attribute is available; category-level value filtering or restrictions are out of scope.
- **No Product Linkage in This Feature**: Products and product variants referencing category attributes are strictly out of scope for this feature.
- **Tree Structure Acyclicity**: Existing category tree validation guarantees no cyclic parent-child category relationships exist.
- **Single Inheritance Path**: A category has at most one parent (`parentId`), forming a strict tree/forest hierarchy (no multiple inheritance/DAG).
- **Automated Tests**: Formal automated test suite creation remains deferred per project owner decision PA-TEST-001.
- **Permissions Baseline**: Category-attribute operations are managed under `ProductCategories` permissions (`VIEW` for listing, `UPDATE` for assigning/unassigning) without modifying the permission enum or seeders.
