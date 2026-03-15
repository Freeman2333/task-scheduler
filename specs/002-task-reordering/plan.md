# Implementation Plan: Task Reordering

**Branch**: `002-task-reordering` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-task-reordering/spec.md`

## Summary

Add drag-and-drop reordering to two contexts: (1) reorder tasks within the left-panel task list to set a custom display order, and (2) reorder tasks within a single calendar date to control the display order of tasks sharing the same day. Both orderings are persisted in the database and are independent of each other. Uses `@dnd-kit/sortable` for the reorder interaction, coexisting with FullCalendar's existing `Draggable` for list→calendar scheduling.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 (via Next.js 15)
**Primary Dependencies**: Next.js 15 (App Router), Tailwind CSS 3, shadcn/ui, Drizzle ORM, @neondatabase/serverless, FullCalendar React (@fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/interaction), **@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @dnd-kit/modifiers** (new)
**Storage**: PostgreSQL (Neon serverless)
**Testing**: None (Constitution IV)
**Target Platform**: Web browser (Vercel deployment)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Reorder operations must feel instant (<100ms visual response); DB persistence is async
**Constraints**: Single user, <200 tasks, no concurrent editing
**Scale/Scope**: Single table, ~6 files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity (YAGNI) | ✅ Pass | dnd-kit is the minimum viable library for sortable lists. Integer ordering is the simplest data model. No over-engineering. |
| II. Code Quality | ✅ Pass | Small focused changes: 2 new columns, 2 new server actions, 4 modified actions, drag handle + sortable wrappers in existing components. |
| III. Configuration | ✅ Pass | No new secrets or configuration. Uses existing `DATABASE_URL`. |
| IV. No Testing | ✅ Pass | No tests added. Manual validation only. |
| V. User Experience | ✅ Pass | Drag handle provides clear affordance. Visual indicators during drag. Instant feedback with async persistence. |
| VI. Security | ✅ Pass | Server-side validation on all new actions. No sensitive data exposed client-side. |

**Pre-design gate: PASS**
**Post-design gate: PASS** — No violations introduced during Phase 1 design.

## Project Structure

### Documentation (this feature)

```text
specs/002-task-reordering/
├── plan.md              # This file
├── research.md          # Phase 0: DnD library choice, ordering strategy
├── data-model.md        # Phase 1: Schema changes (list_order, calendar_order)
├── quickstart.md        # Phase 1: Setup instructions
├── contracts/
│   └── server-actions.md # Phase 1: New and modified server action contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
db/
└── schema.ts                          # Add listOrder, calendarOrder columns

lib/
└── types.ts                           # Add listOrder, calendarOrder to Task type

app/
├── page.tsx                           # No changes (getTasks already called here)
└── actions/
    └── tasks.ts                       # Modify getTasks, createTask, scheduleTask, unscheduleTask
                                       # Add reorderListTasks, reorderCalendarTasks

components/
├── task-list/
│   ├── TaskList.tsx                   # Wrap with DndContext + SortableContext for list reorder
│   ├── TaskItem.tsx                   # Add drag handle, use useSortable hook
│   ├── CreateTaskForm.tsx             # No changes
│   └── EditTaskModal.tsx              # No changes
├── calendar/
│   └── TaskCalendar.tsx               # Add DndContext for intra-day reorder, eventOrder prop
└── layout/
    └── ResponsiveLayout.tsx           # No changes

drizzle/
└── migrations/
    └── 0001_task_reordering.sql       # Add list_order, calendar_order + backfill
```

**Structure Decision**: No new directories or structural changes. All modifications are in existing files, plus one new migration file. The architecture remains a single Next.js App Router application with Server Components + Server Actions.
