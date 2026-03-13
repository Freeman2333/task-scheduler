<!--
Sync Impact Report:
- Version change: (none) → 1.0.0 (initial ratification)
- Modified principles: N/A (initial)
- Added sections: Core Principles (6), Scope, Development Workflow, Governance
- Removed sections: N/A
- Templates: ✅ plan-template.md (Constitution Check remains generic); ✅ spec-template.md; ✅ tasks-template.md — no structural changes required
- Follow-up TODOs: None
-->
# Task Scheduler Constitution

## Core Principles

### I. Simplicity (YAGNI)
Build only what the specification requires. Avoid extra libraries, features, or abstraction until needed. Prefer simple, readable code over clever solutions. Rationale: keeps the codebase maintainable and reduces long-term cost.

### II. Code Quality and Structure
Use clear naming, consistent file and folder structure, and small focused modules. Keep duplication low. Code must be easy for one developer to understand and change. Rationale: supports fast iteration and handoff.

### III. Configuration and Secrets
All environment-dependent configuration (e.g. database connection) MUST use environment variables. No secrets, API keys, or connection strings in source code or committed files. Rationale: security and portability across environments.

### IV. No Testing
Do not add unit tests, integration tests, or test infrastructure. No test files, testing frameworks, or test-related tasks. Implementation is code-only; validation is manual. Rationale: project scope explicitly excludes automated testing.

### V. User Experience
Interfaces must be clear and predictable. Errors must be shown in user-friendly language with a path to recover. The app must feel responsive for normal use. Rationale: ensures the product is usable without documentation.

### VI. Security
No sensitive or secret data in client-side bundles. Validate and sanitize user input. Follow safe practices for data access and storage as appropriate for the chosen stack. Rationale: protects users and the system from common threats.

## Scope

- Features and behavior are defined by the specification; do not implement unspecified behavior.
- No testing tooling or test suites; manual verification only.
- Technology choices (framework, database, hosting) are decided in the implementation plan, not in the constitution.

## Development Workflow

- Follow the Spec Kit flow: specification → plan → tasks → implementation.
- Each feature branch has one spec; implementation must stay within that spec.
- Complexity or new dependencies must be justified against the specification and YAGNI.

## Governance

This constitution supersedes ad-hoc preferences for this project. All implementation and plan decisions must comply with these principles. Amendments require updating this file, incrementing the version (MAJOR.MINOR.PATCH), and setting Last Amended to the change date. Use the spec and plan artifacts under `.specify/` and `specs/` for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-03-13 | **Last Amended**: 2025-03-13
