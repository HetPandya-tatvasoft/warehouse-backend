# Tasks: Product Attributes

Feature: `001-product-attributes`. Actual Git branch: `chore/setup-spec-kit`.
Final source and documented checks reviewed 2026-10-12: T001â€“T019 are complete as authored
implementation/static verification work. Automated tests remain deferred under PA-TEST-001;
manual/runtime/database/deployment verification is not claimed.
No migrations, seeds or permission updates were executed. Preserve unrelated work, especially
`RoleService` edits. See [review.md](review.md) for behavioral decisions and [quickstart.md](quickstart.md)
for actual check results. Checked tasks do not certify runtime or deployment verification.

References: [specification](spec.md) FR/US identifiers; [plan](plan.md) module inventory and recovery;
[data model](data-model.md) schema/comparison/locking; [API contract](contracts/api.md) DTOs/envelopes;
[research](research.md) evidence and decisions; [quickstart](quickstart.md) static/build commands.
`F/` in paths expands to `src/modules/settings/product-settings/`; all other paths are repository-relative.
`[P]` means independent files can be worked on concurrently once listed dependencies are complete.
Story labels retain acceptance traceability. Developer-run environment preparation, manual API
verification and deployment are maintained in quickstart.md and do not gate these tasks.

## 1. Execution scope and prerequisites

Owner-approved PA-TEST-001 (Het Pandya, 2026-10-08) defers automated unit/integration/E2E/
concurrency/rollout tests and all test-only fixtures, database infrastructure and Jest configuration.
They are not current tasks, prerequisites, completed work or passed checks. Acceptance requirements
remain in spec.md; see plan Constitution Check for impact and compensating measures. The project-wide
principle remains unchanged. Manual checks do not prove concurrency or provide regression coverage.
Use existing toolchain/conventions. Production role mapping/database checks remain deployment gates
in quickstart.md and do not block implementation completion or local static/build checks.

## 2. Entities, schema migration, and registration

- [x] T001 Create `F/enums/attribute-status.enum.ts`, `F/entities/attribute.entity.ts`, and `F/entities/attribute-value.entity.ts` using `AuditableEntity` UUID/timestamps. Match data-model tables: required tenant/parent IDs; name/label `varchar(150), NOT NULL`, â€œ1â€“150 Unicode code pointsâ€; statuses â€œACTIVE or INACTIVEâ€ default ACTIVE; values derive ownership from immutable parent without `tenantId`. No role, assignment, actor-audit, or soft-delete fields. Refs: FR-001/004/007/009/011/013; data-model â€œAttributeâ€/â€œAttributeValueâ€.
- [x] T002 Author `src/database/migrations/1791417600000-CreateProductAttributes.ts` after checking timestamp order: additive enum/tables, restrictive FKs, exact trim/length checks, named expression uniqueness including inactive records, and ordering indexes from data-model. Reuse existing root ICU collation; preflight capabilities, never create a custom collation or use global generation. Review up/down allowlist and products metadata safeguard; review SQL/metadata against the schema allowlist; deployment snapshot checks remain rollout work. Depends: T001. Refs: FR-007/008/012/016; plan â€œProducts metadata safeguardâ€ and rollback limits.
- [x] T003 Register entities in `F/product-settings.module.ts` and `src/database/data-source.ts`; add `Page.ProductAttributes='ProductAttributes'` in `src/modules/roles-and-permissions/enums/permissions.enum.ts` as the typed controller prerequisite. Verify CLI/application metadata agree and synchronization remains disabled; provider/controller wiring follows T014. Depends: T001/T002. Refs: FR-005/017; plan â€œProject Structureâ€.

## 3. DTOs, repositories, services, controllers, and response mapping

- [x] T004 Complete inline DTO trim/scalar/code-point validation and agreed literal search handling. Both DTOs use identical standard decorators; private repository methods contain bound ICU predicates with literal escaping, and private service methods validate tenant context, safe pagination and list controls. The shared query utility was removed at the owner's request. Removed custom validator/input-utility files remain removed. Depends: T001. Refs: FR-007/008/014; data-model â€œCanonical storage and Unicode rulesâ€; contracts â€œSearch and orderingâ€.
- [x] T005 [P] [US1] Complete `F/dto/attribute/upsert-attribute.dto.ts` containing UpsertAttributeDto and UpdateAttributeDto; validate name/status, reject supplied null/types, preserve omitted PATCH fields, and reject empty updates in the service without inheriting create defaults. PartialType explicitly uses skipNullProperties:false. Depends: T004. Refs: FR-002/007/011; contracts â€œRequest DTOsâ€.
- [ ] T006 [P] [US2] Complete `F/dto/attribute-value/upsert-attribute-value.dto.ts` containing UpsertAttributeValueDto and UpdateAttributeValueDto with equivalent label/status/null rules and no client-supplied ownership/reparenting fields. Empty updates are rejected by the service. Depends: T004. Refs: FR-004/006/007/011/015; contracts â€œRequest DTOsâ€.
- [x] T007 [P] [US3] Create `F/dto/attribute/attribute-pagination.dto.ts` and `F/dto/attribute-value/attribute-value-pagination.dto.ts`; enforce page 1/pageSize 10 defaults, safe integer/offset controls, permitted sorts, trimmed search and own-status filtering including both statuses by default. Add no global page-size limit. Depends: T004. Refs: FR-003/004/014; contracts â€œRequest DTOsâ€/â€œSearch and orderingâ€.
      Completed: inherited defaults and allowlists, feature-specific safe bounds, service safe-offset/control validation and explicit supplied-null rejection. Shared/global pagination remains unchanged.
- [ ] T008 Implement manager-aware `F/repositories/attribute.repository.ts` and `F/repositories/attribute-value.repository.ts`: tenant-scoped queries, joined parent/value ownership, identical database comparison for duplicates/search, allowlisted deterministic sorts/counts, and parent-first locks for mutations. Preserve existing pagination envelope; no unscoped value helpers. Depends: T003/T004/T007. Refs: FR-003/004/006/008/012/014; data-model â€œIndexes and constraintsâ€ and locking design.
      Current implementation (2026-10-14): BaseRepository/Find Options only, entity-page results, default sorting, optional managers last, escaped ILike and tenant-scoped batch reads counted in memory; no per-attribute count queries or access to another entity's repository. Services own validation, response/count composition, parent-first locks and transactions. Inherited deletion follows one owned-parent lock. Outstanding difference against the original task: ILike uses column collation and is not guaranteed to match the unchanged ICU uniqueness key. This parity requirement remains unresolved; the owner explicitly requested removing Raw/QueryBuilder.
- [x] T009 Implement `F/errors/attribute-conflict.util.ts` for known unique/FK conflicts and retryable transaction conflicts using existing error envelope. Classify active/inactive duplicates by authorized requery after rollback; inactive codes explain Update/reactivation without leaked IDs. Propagate unexpected failures safely. Depends: T008. Refs: FR-008/010/012; contracts error contract and plan concurrency design.
- [x] T010 [P] [US1] Implement `F/services/attribute.service.ts`: runtime tenant assertion, creation defaults/empty attributes, selective rename/status updates, self-rename handling, scoped retrieval, and atomic explicit child-then-parent deletion. Keep parent-lock transactions short; no future-reference placeholders. Depends: T005/T008/T009. Refs: FR-001/002/006/008/011/012/016; US1; data-model lifecycle/locking.
- [x] T011 [P] [US2] Implement `F/services/attribute-value.service.ts`: scoped correct-parent CRUD, independent status/availability, ID-preserving rename, last-value deletion and parent-first locking for all value mutations. No reparenting, implicit reactivation, or external work inside transactions. Depends: T006/T008/T009. Refs: FR-004/006/008/011/012/015/016; US2; data-model lifecycle/locking.
- [x] T012 Create `F/dto/attribute/attribute-response.dto.ts`, `F/dto/attribute-value/attribute-value-response.dto.ts`, `F/mappers/attribute.mapper.ts`, and `F/mappers/attribute-value.mapper.ts`; map only contracted fields, aggregate all-status valueCount and compute effective selection availability without exposing auth data. Depends: T010/T011. Refs: FR-010/011; contracts â€œResponse fields and envelopesâ€.
- [x] T013 [US4] Create `F/controllers/attributes.controller.ts` and `F/controllers/attribute-values.controller.ts` for all ten contracted routes with explicit JWT/permission metadata, UUID parsing, DTO binding and existing response wrapping. View/Create/Update/Delete remain independent; deletion accepts no authorization substitute from UI. Depends: T003/T005/T006/T007/T010/T011/T012. Refs: FR-002â€“006/010/012/017; contracts endpoint table.
- [x] T014 Wire controllers/services/repositories in `F/product-settings.module.ts` and feature messages in `src/common/constants/messages.constants.ts`; verify existing settings imports expose routes without changing category, global guards/filter, repositories or pagination. Depends: T013. Refs: FR-009/010/013; plan exact file inventory.

## 4. Permission catalog, manual role assignment, and scoped seeder changes

- [x] T015 [P] [US4] Superseded by owner decision 2026-10-13: remove the unexecuted authorization migration and require manual feature-role assignments. Catalog setup is covered by T016; no administrator mapping/backfill is required. Existing explicit grants remain intact. Refs: FR-005/017; spec clarification 2026-10-13.
- [x] T016 [P] [US4] Add ProductAttributes to `src/database/seeds/authorization/page.seeder.ts` using existing catalog mechanisms; implement exactly the four expected accesses and planned collision handling, then review the scoped diff without executing seeds. Runtime seeder inspection belongs to `specs/001-product-attributes/quickstart.md`. Depends: T003. Refs: FR-005/017; research â€œAuthorization rollout and revocationsâ€.
      Completed: page seeding also ensures missing standard permissions for the existing page-before-permission order. `page-access.seeder.ts` restricts only this feature to four active standard accesses, so its generic all-page loop cannot add unexpected rights. No seed execution occurred.
- [x] T017 [P] [US4] Per owner decision 2026-10-13, exclude all implicit feature grants in `src/database/seeds/tenant-users.seed.ts` and `src/modules/tenants/services/tenant.service.ts` onboarding, for both new and existing administrators. Assign feature permissions manually through existing role management. Leave unrelated default grants and existing explicit rights unchanged. Depends: T016. Refs: FR-017; spec clarification 2026-10-13.
- [x] T018 [P] [US4] Update `src/database/seeds/super-admin.seed.ts` to exclude ProductAttributes from implicit fresh/existing platform-role grants while retaining any explicit grants and unrelated behavior. Depends: T016. Refs: FR-005/017; research scoped seeder decision.

## 5. Static and build verification

- [x] T019 Run quickstart's no-emit TypeScript check, non-fixing lint and build; record actual commands, versions, exit codes and limitations in `specs/001-product-attributes/quickstart.md`. Check command syntax/paths and review the full diff for security, constraints/transactions, migration scope, and preserved `RoleService` work. No manual environment, Jest discovery or test setup is required. Depends: T014â€“T018. Refs: FR-005â€“008/010â€“017; constitution VI exception PA-TEST-001.
      Completed: final documented TypeScript/scoped non-fixing lint/build passed. Registration/enum line endings were corrected without changing behavior. Additional project-wide lint reports two unrelated existing app.module.ts formatting errors, left unchanged. RoleService hash is unchanged; actual results/limitations are in quickstart.md.

## Dependencies, acceptance, and parallel work

Flow: T001â€“T003 persistence/typed page key â†’ T004â€“T014 APIs plus T015â€“T018 authorization â†’
T019 local static/build verification.
Explicit dependencies govern work; API and authorization work can proceed independently after T003.
No implementation task depends on deferred tests, developer-run environments, manual API checks,
deployment actions or manual role-permission assignment.

| Story    | Retained acceptance                                                                      | Parallel opportunity after prerequisites |
| -------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| US1 (P1) | Owned attributes CRUD, empty ACTIVE records, selective updates; US4 protection required. | T005 with T006/T007; T010 with T011.     |
| US2 (P1) | Correct-parent values CRUD, independent status, retained rename identity.                | T006 with T005/T007; T011 with T010.     |
| US3 (P2) | Literal search, own-status filtering and deterministic pagination.                       | T007 with create/update DTOs.            |
| US4 (P1) | Permission/tenant/wrong-parent denial, manual feature grants and preserved revocations.  | T015 with T016; T017 with T018.          |

An initial US1 increment requires US4 protection; all stories and T019 remain needed for implementation
completion. Avoid simultaneous edits to shared module files. Deferred regression coverage must later address the spec verification
matrix, including concurrent uniqueness, create/delete races, failure rollback, grants and revocations;
resumption timing is not agreed. No deferred test implementation is scheduled by this task list.

Future FR-018â€“020 consumer warnings, referenced renames and assignment deletion restrictions stay
in spec/data-model/contracts; they do not authorize UI, assignment tables or fake reference checks.
No dependency/CI changes or unrelated cleanup is tasked.
