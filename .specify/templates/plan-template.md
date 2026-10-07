# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluate `.specify/memory/constitution.md` and record PASS, an unresolved decision, or a
documented exception for every applicable gate. Re-check after design; do not claim that
legacy behavior complies merely because it already exists.

- **Architecture and scope**: Preserve NestJS module boundaries and controller/service/repository
  responsibilities; identify reused abstractions and justify shared changes within feature scope.
- **Tenant and access boundaries**: Validate authenticated tenant context at runtime; scope all
  reads, writes, and references; enforce required branch access and explicit authentication and
  permissions. Document intentional public/platform endpoints.
- **Validation and contracts**: Use request DTOs and explicit response DTOs/mappers for new
  business endpoints; preserve response/pagination contracts; exclude secrets; define omitted/null
  update behavior and document any agreed API compatibility change.
- **Database integrity**: Specify PostgreSQL constraints, uniqueness scope and normalization,
  atomic transaction boundaries, AuditableEntity reuse, and application/CLI entity registration.
  Review generated SQL against the products table without ORM metadata; document data impact
  and rollback/recovery limits; do not rewrite applied migrations or enable synchronize.
- **Lifecycle**: Define activation, deactivation, deletion, and reference rules or mark operations
  inapplicable; do not assume uniform deletion or existing createdBy/updatedBy conventions.
- **Verification**: Map meaningful business-rule, authorization, tenant/branch, and constraint
  tests to acceptance scenarios. Identify prerequisites and command effects; zero tests is not
  coverage. Record actual results separately from planned checks.
- **Governance**: Separate confirmed conventions, new requirements, and unrelated legacy debt;
  record justified exceptions and impact in Complexity Tracking for project-owner approval.

## Verification and Migration Evidence

[Map acceptance scenarios to checks and planned test files. Identify database/test prerequisites,
read-only versus file/database-modifying commands, and unavailable checks. For schema changes,
document SQL review, existing-data impact/backfills, entity registration, rollback/recovery limits,
and protection of existing tables absent from ORM metadata. Record actual results only after execution.]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
