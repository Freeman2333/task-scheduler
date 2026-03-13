# Implementation Plan: Personal Task Scheduler – Initial App Setup

**Branch**: `001-initial-app-setup` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-initial-app-setup/spec.md`

## Summary

Build a single-user personal task scheduler web app using Next.js (App Router) with TypeScript. The app presents a persistent split-panel layout: a task list on the left and a FullCalendar-powered calendar on the right. Tasks are stored in a Neon PostgreSQL database via Drizzle ORM and accessed through Next.js Server Actions. All scheduling interactions (drag-and-drop between list and calendar, month/week view toggling, navigation) are handled in the browser without a separate API layer.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 (via Next.js 15)
**Primary Dependencies**: Next.js 15 (App Router), Tailwind CSS 3, shadcn/ui, Drizzle ORM, @neondatabase/serverless, FullCalendar React (@fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, @fullcalendar/interaction), dnd-kit (@dnd-kit/core, @dnd-kit/modifiers)
**Storage**: PostgreSQL hosted on Neon (serverless, free tier)
**Testing**: None (Constitution IV — No Testing)
**Target Platform**: Web browser, deployed to Vercel (free hobby tier)
**Project Type**: Web application (single-page split-panel)
**Performance Goals**: Standard web responsiveness; drag-and-drop interactions must feel immediate (<100ms visual feedback); page load serves pre-rendered task list via Server Components
**Constraints**: Single user, no auth, no tests; all secrets via environment variables; minimal dependencies per YAGNI
**Scale/Scope**: Single user, personal use; assume up to ~200 tasks max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity (YAGNI) | ✅ PASS | Stack is minimal: Next.js + Tailwind + shadcn/ui + Drizzle + FullCalendar. No extra abstraction layers. |
| II. Code Quality and Structure | ✅ PASS | TypeScript throughout; clear component/db/actions folder separation. |
| III. Configuration and Secrets | ✅ PASS | `DATABASE_URL` in `.env.local` (local) and Vercel env vars (production). Never in source code. |
| IV. No Testing | ✅ PASS | No test files, no testing libraries, no test scripts in `package.json`. |
| V. User Experience | ✅ PASS | shadcn/ui + FullCalendar provide accessible, polished components. Error handling and loading states planned. |
| VI. Security | ✅ PASS | All DB access via Server Actions (server-side only). No connection strings or secrets in client bundle. Input validated server-side before DB writes. |

**Gate result: PASS. Proceeding to Phase 0 research.**

## Project Structure

### Documentation (this feature)

```text
specs/001-initial-app-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── server-actions.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
task-scheduler/
├── app/
│   ├── layout.tsx                  # Root layout (Tailwind, fonts)
│   ├── page.tsx                    # Split-panel root page (Server Component)
│   └── actions/
│       └── tasks.ts                # All Server Actions (CRUD + schedule)
├── components/
│   ├── task-list/
│   │   ├── TaskList.tsx            # Left panel — renders task items
│   │   ├── TaskItem.tsx            # Single task row (draggable source)
│   │   ├── CreateTaskForm.tsx      # Inline form to create new task
│   │   └── EditTaskModal.tsx       # shadcn/ui Dialog for editing
│   └── calendar/
│       └── TaskCalendar.tsx        # FullCalendar wrapper (right panel)
├── db/
│   ├── index.ts                    # Drizzle client (Neon serverless)
│   └── schema.ts                   # tasks table definition
├── lib/
│   └── types.ts                    # Shared TypeScript types (Task)
├── drizzle/
│   └── migrations/                 # Drizzle migration files
├── .env.local                      # DATABASE_URL (gitignored)
├── drizzle.config.ts               # Drizzle Kit config
├── next.config.ts
├── tailwind.config.ts
├── components.json                 # shadcn/ui config
└── package.json
```

**Structure Decision**: Single Next.js project at the repo root. No separate backend. Server Actions in `app/actions/tasks.ts` serve as the data layer. DB logic isolated in `db/`. UI components split by feature panel (`task-list/`, `calendar/`).

## Complexity Tracking

No constitution violations. All dependency choices are directly justified by spec requirements:

| Dependency | Justified By |
|------------|-------------|
| FullCalendar | FR-010, FR-010a, FR-010b, FR-011, FR-012 — month/week views + drag-and-drop |
| dnd-kit | FR-011, FR-013 — dragging from left list panel onto calendar drop targets |
| Drizzle ORM | FR-009 — type-safe DB access, lightweight, Neon-compatible |
| shadcn/ui | FR-006, FR-008 — edit modal (Dialog) and delete confirmation (AlertDialog) |

## Core Implementation

### Phase 0: Research (see research.md)

Key unknowns resolved before design:
1. FullCalendar external drag interop with dnd-kit / HTML5 drag events
2. Drizzle ORM + Neon serverless driver setup in Next.js App Router
3. Server Actions revalidation pattern for optimistic UI updates
4. Drizzle Kit migration workflow for Neon

### Phase 1: Design and Contracts (see data-model.md, contracts/, quickstart.md)

1. Database schema — `tasks` table
2. Server Action signatures
3. Component hierarchy and data flow
4. Quickstart for local dev and Vercel deployment

### Phase 2: Task Breakdown (generated by /speckit.tasks)

Tasks will be ordered:
1. Project scaffolding (Next.js + Tailwind + shadcn/ui init)
2. DB setup (Neon project, Drizzle schema, migration)
3. Server Actions (CRUD + schedule)
4. TaskList + TaskItem components (left panel)
5. CreateTaskForm + EditTaskModal
6. TaskCalendar (FullCalendar integration, month/week views)
7. Drag-and-drop: list → calendar (schedule), calendar → calendar (reschedule), calendar → list (unschedule)
8. Visual polish (completed styling, scheduled date badge, truncation, scrollable day cells)
9. Vercel deployment + environment variable setup
