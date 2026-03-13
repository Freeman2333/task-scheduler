# Tasks: Personal Task Scheduler – Initial App Setup

**Input**: Design documents from `specs/001-initial-app-setup/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: None — Constitution IV explicitly excludes all testing infrastructure.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to ([US1], [US2])
- No story label = Setup or Foundational phase

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Scaffold the project, install all dependencies, and establish the folder structure. Nothing in Phase 2+ can begin until this is complete.

- [X] T001 Scaffold Next.js 15 project at repo root: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"`
- [X] T002 Install database dependencies: `npm install drizzle-orm @neondatabase/serverless` and `npm install -D drizzle-kit`
- [X] T003 [P] Install FullCalendar packages: `npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction` (no `@fullcalendar/timegrid` needed — using `dayGridWeek` not `timeGridWeek`)
- [X] T004 [P] Initialize shadcn/ui (`npx shadcn@latest init`) and add required components: `npx shadcn@latest add button input textarea dialog alert-dialog label badge`
- [X] T005 [P] Create folder structure: `app/actions/`, `components/task-list/`, `components/calendar/`, `db/`, `lib/`
- [X] T006 [P] Create `drizzle.config.ts` at repo root (see quickstart.md for content)

**Checkpoint**: Project scaffolded, all dependencies installed, folder structure in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, schema, shared types, and Server Actions must be ready before any UI work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Create a free Neon project at neon.tech, copy the connection string, and add `DATABASE_URL=<connection-string>` to `.env.local` (gitignored)
- [X] T008 Define the Drizzle tasks table schema in `db/schema.ts` (fields: id UUID, title TEXT NOT NULL, description TEXT, completed BOOLEAN DEFAULT false, scheduled_date DATE, created_at TIMESTAMPTZ DEFAULT now()) — see data-model.md
- [X] T009 Create the Drizzle client in `db/index.ts` using `@neondatabase/serverless` and `drizzle-orm/neon-http` — see research.md Decision 2
- [X] T010 Define shared TypeScript Task type in `lib/types.ts` matching the Drizzle schema — see data-model.md TypeScript Types section
- [ ] T011 Generate and run the initial migration: `npx drizzle-kit generate && npx drizzle-kit migrate`. Verify `tasks` table exists in Neon console.
- [X] T012 Implement all seven Server Actions in `app/actions/tasks.ts`: `getTasks`, `createTask`, `updateTask`, `toggleComplete`, `deleteTask`, `scheduleTask`, `unscheduleTask` — see contracts/server-actions.md for full signatures and validation rules
- [X] T013 Create root layout in `app/layout.tsx` with Tailwind CSS base styles, Inter font, and full-height body
- [X] T014 Create split-panel skeleton in `app/page.tsx` as a Server Component: fetch all tasks using `getTasks()`, render a left panel (fixed width, scrollable) and right panel (remaining width) side-by-side, pass tasks as props to child components (currently empty placeholders)

**Checkpoint**: DB connected, schema migrated, all Server Actions implemented, split-panel skeleton renders in browser at localhost:3000.

---

## Phase 3: User Story 1 – Manage a Task List (Priority: P1) 🎯 MVP

**Goal**: A fully functional task list in the left panel — create, view, edit, complete/uncomplete, delete tasks — with full persistence. No calendar interaction needed.

**Independent Test**: Open the app, create 3 tasks (one title-only, one with description), edit one, complete one, uncomplete it, delete one with confirmation — then reload and verify all changes persisted.

### Implementation

- [X] T015 [P] [US1] Create `components/task-list/CreateTaskForm.tsx`: a controlled form with a title input (required), optional description textarea, and a submit button. On submit, call the `createTask` Server Action. Show a client-side validation error if title is empty. Reset form on success.
- [X] T016 [P] [US1] Create `components/task-list/TaskItem.tsx`: renders a single task row showing title (truncated with ellipsis if long), optional scheduled-date badge (if `scheduledDate` is set), a checkbox to toggle complete, an Edit button, and a Delete button. Apply strikethrough + muted text style when `completed` is true. Accept `task: Task` as prop.
- [X] T017 [US1] Create `components/task-list/EditTaskModal.tsx`: a shadcn/ui `Dialog` containing a pre-filled title input and description textarea. On save, call the `updateTask` Server Action. Close the modal on save and on cancel. Validate title non-empty before submit.
- [X] T018 [US1] Add delete confirmation to `components/task-list/TaskItem.tsx`: wrap the delete button with a shadcn/ui `AlertDialog`. On confirm, call `deleteTask` Server Action. On cancel, do nothing.
- [X] T019 [US1] Create `components/task-list/TaskList.tsx`: renders `CreateTaskForm` at the top, then a scrollable list of `TaskItem` components ordered newest first (tasks already pre-sorted by `getTasks`). Show an empty-state message ("No tasks yet. Create one above.") when the list is empty.
- [X] T020 [US1] Wire `TaskList` into the left panel of `app/page.tsx`, passing the fetched tasks as props.

**Checkpoint**: User Story 1 fully functional. Task list works end-to-end with persistence. Calendar panel is still empty — that is expected.

---

## Phase 4: User Story 2 – Schedule Tasks on a Calendar (Priority: P2)

**Goal**: A FullCalendar-powered right panel showing month and week views with drag-and-drop scheduling from the task list, rescheduling within the calendar, and unscheduling back to the list.

**Independent Test**: Drag an unscheduled task onto a calendar date → verify it appears on that date and shows a date badge in the list. Drag it to a different date → verify it moves. Drag it back to the list panel → verify the scheduled date is removed. Reload and confirm all changes persisted.

### Implementation

- [X] T021 [US2] Create `components/calendar/TaskCalendar.tsx` as a Client Component (`'use client'`): render a `FullCalendar` with `dayGridPlugin` and `interactionPlugin` (no `timeGridPlugin` needed). Set initial view to `dayGridMonth`. Add a view-switch toolbar button toggling between `dayGridMonth` and `dayGridWeek` (date-only week view, consistent with the date-only data model). Enable `prev`/`next`/`today` navigation buttons. Accept `tasks: Task[]` as prop. Map tasks where `scheduledDate !== null` to FullCalendar events (`{ id, title, start: scheduledDate, extendedProps: { completed } }`).
- [X] T022 [US2] In `TaskCalendar.tsx`, style completed events visually (e.g. reduced opacity or strikethrough title) using FullCalendar's `eventClassNames` or `eventContent` callback to read `extendedProps.completed`.
- [X] T023 [US2] In `components/task-list/TaskList.tsx`, attach a `ref` to the task list container and initialise FullCalendar's `Draggable` on it in a `useEffect` (convert `TaskList` to a Client Component). Set `itemSelector: '[data-task-id]'` and `eventData` callback to return `{ id, title }` from the element's data attributes. Add `data-task-id` and `data-task-title` attributes to each `TaskItem` wrapper element.
- [X] T024 [US2] In `TaskCalendar.tsx`, enable `droppable={true}` and implement the `drop` callback (external drop from list): extract `taskId` from `info.draggedEl.dataset.taskId`, extract the dropped date as `YYYY-MM-DD`, call the `scheduleTask` Server Action.
- [X] T025 [US2] In `TaskCalendar.tsx`, implement the `eventDrop` callback (calendar-to-calendar reschedule): extract `event.id` (task id) and `event.startStr` (new date), call the `scheduleTask` Server Action.
- [X] T026 [US2] Implement unscheduling (drag from calendar back to list): add a clearly labelled drop zone div over the left panel in `app/page.tsx`. Use FullCalendar's `eventDragStop` callback — detect if the drag ended outside the calendar bounds (check pointer coordinates against the calendar container rect) and call `unscheduleTask` Server Action if so.
- [X] T027 [US2] Wire `TaskCalendar` into the right panel of `app/page.tsx`, passing the fetched tasks as props.

**Checkpoint**: User Story 2 fully functional. Both panels work end-to-end. All drag-and-drop interactions persist correctly after page reload.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final UX polish affecting both panels, error states, and deployment.

- [X] T028 [P] Add CSS text truncation to task titles and descriptions in `components/task-list/TaskItem.tsx` and FullCalendar event content: use `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` (Tailwind: `truncate`) for single-line truncation. Full text remains visible in `EditTaskModal`.
- [X] T029 [P] Configure FullCalendar day cell overflow in `components/calendar/TaskCalendar.tsx`: set `dayMaxEvents: false` (show all events) and add CSS to make individual day cells scrollable (`overflow-y: auto; max-height: ...`) via FullCalendar's `dayCellClassNames` or global CSS targeting `.fc-daygrid-day-events`.
- [X] T030 [P] Wrap all Server Action calls in `useTransition` (or use form `action=` pending state) in `CreateTaskForm.tsx`, `TaskItem.tsx`, `EditTaskModal.tsx`, and `TaskCalendar.tsx` to show loading/disabled state during mutation. Disable interactive elements while pending.
- [X] T031 [P] Add user-friendly error handling to all Server Action call sites: catch errors and display an inline error message (e.g. a small red text below the form or a shadcn/ui toast) rather than crashing silently.
- [X] T032 Verify split-panel layout proportions in `app/page.tsx`: left panel ~35% width (min 280px), right panel remaining space, both panels full viewport height with internal scroll. Test in Chrome at 1280px and 1440px widths.
- [ ] T033 Set up Vercel deployment: connect repo to Vercel, add `DATABASE_URL` environment variable in Vercel dashboard, trigger a production deploy, run `npx drizzle-kit migrate` against the production Neon DB, and verify the live URL works end-to-end.

**Checkpoint**: App is deployed, polished, and fully functional on production.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **blocks all user story work**.
- **Phase 3 (US1)**: Depends on Phase 2 completion — no dependency on Phase 4.
- **Phase 4 (US2)**: Depends on Phase 2 completion — builds on Phase 3 components (TaskList, TaskItem need `data-task-id` attributes).
- **Phase 5 (Polish)**: Depends on Phase 3 and Phase 4 completion.

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately after Phase 2. Fully independent.
- **User Story 2 (P2)**: Depends on Phase 2. Shares `TaskList` container with US1 (T023 modifies it) — start US2 after US1 is complete to avoid conflict.

### Within Each Phase

- Tasks marked [P] within the same phase have no shared file dependencies and can be worked in parallel.
- Within US1: T015 and T016 [P] → T017 → T018 → T019 → T020.
- Within US2: T021 → T022 → T023 → T024 → T025 → T026 → T027 (mostly sequential due to shared TaskCalendar file).

### Parallel Opportunities

```bash
# Phase 1 parallel group (after T001, T002 complete):
T003 Install FullCalendar    |  T004 Init shadcn/ui
T005 Create folders          |  T006 Create drizzle.config.ts

# Phase 2 parallel group (after T007 DB ready):
T008 db/index.ts             |  T009 lib/types.ts
(T011 migration after T008)

# Phase 3 parallel group:
T015 CreateTaskForm          |  T016 TaskItem (no shared file)

# Phase 5 parallel group:
T028 Truncation              |  T029 Day cell scroll
T030 Loading states          |  T031 Error handling
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: User Story 1 (T015–T020)
4. **STOP and VALIDATE**: Create, edit, complete, delete tasks — reload to confirm persistence
5. Deploy to Vercel as MVP if desired

### Full Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Working task list → Validate independently → Optional MVP deploy
3. Phase 4 (US2) → Working calendar with DnD → Validate independently
4. Phase 5 → Polish and production deploy

---

## Notes

- [P] tasks = different files, no inter-task dependencies — safe to parallelize
- [USx] label maps task to spec.md user story for traceability
- No test tasks generated — Constitution IV: No Testing
- `data-task-id` and `data-task-title` attributes on TaskItem (T016) are required by T023 (Draggable setup) — complete T016 before T023
- FullCalendar's `Draggable` must be initialized in a `useEffect` with a cleanup `draggable.destroy()` call to prevent memory leaks
- All Server Actions use `revalidatePath('/')` — no client-side state manager needed
- `.env.local` must never be committed; it is gitignored by Next.js default
