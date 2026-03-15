# Tasks: Task Reordering

**Input**: Design documents from `/specs/002-task-reordering/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 = list reorder, US2 = calendar date reorder)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Install new dependencies required for drag-and-drop reordering

- [x] T001 Install @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, and @dnd-kit/modifiers via npm in package.json

---

## Phase 2: Foundational (Data Layer)

**Purpose**: Schema changes, type updates, and server action modifications that MUST be complete before any user story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Add listOrder (integer, not null, default 0) and calendarOrder (integer, not null, default 0) columns to the tasks table in db/schema.ts
- [x] T003 [P] Add listOrder (number) and calendarOrder (number) fields to the Task type in lib/types.ts
- [x] T004 Generate database migration with `npm run db:generate`, then apply with `npm run db:migrate`, then run backfill SQL to set initial list_order values from created_at DESC ordering and calendar_order values per scheduled_date group (see data-model.md for backfill SQL)
- [x] T005 Modify getTasks to order by listOrder ASC instead of createdAt DESC and include listOrder and calendarOrder in the response mapping in app/actions/tasks.ts
- [x] T006 Modify createTask to increment all existing tasks' listOrder by 1 (UPDATE tasks SET list_order = list_order + 1) before inserting the new task with listOrder 0, and when scheduledDate is provided also set calendarOrder to MAX(calendar_order for that date) + 1, in app/actions/tasks.ts

**Checkpoint**: Data layer is ready — tasks now carry ordering fields, are fetched in list_order order, and new tasks are inserted at the top

---

## Phase 3: User Story 1 – Reorder Tasks in the List (Priority: P1) 🎯 MVP

**Goal**: Users can drag tasks up and down in the left-panel list to set a custom display order that persists across reloads

**Independent Test**: Create several tasks, drag them into a custom order using the drag handle, reload the page, and confirm the order is preserved

### Implementation for User Story 1

- [x] T007 [US1] Add reorderListTasks(orderedIds: string[]) server action that validates the input array is non-empty and batch-updates list_order = index for each task ID in app/actions/tasks.ts
- [x] T008 [P] [US1] Add a grip drag handle icon (using lucide-react GripVertical) to TaskItem, integrate useSortable hook from @dnd-kit/sortable, apply transform and transition styles, and prevent FullCalendar HTML5 dragstart from firing on the handle via onDragStart preventDefault in components/task-list/TaskItem.tsx
- [x] T009 [US1] Wrap the task list in TaskList with DndContext (PointerSensor, restrictToVerticalAxis modifier) and SortableContext (verticalListSortingStrategy), manage local task order state with useState, and call reorderListTasks server action on handleDragEnd using arrayMove to compute the new order in components/task-list/TaskList.tsx
- [x] T010 [US1] Add a DragOverlay in TaskList that renders a styled clone of the dragged task item during drag for clear visual feedback in components/task-list/TaskList.tsx

**Checkpoint**: List reordering is fully functional — users can drag tasks by handle, see visual feedback, drop to reorder, and order persists after reload

---

## Phase 4: User Story 2 – Reorder Tasks Within a Calendar Date (Priority: P2)

**Goal**: When multiple tasks are scheduled on the same day, users can drag them within the day cell to change their display order for that date

**Independent Test**: Schedule three or more tasks to the same date, drag them into a custom order within the day cell using the drag handle, reload the page, and confirm the per-date order is preserved

### Implementation for User Story 2

- [x] T011 [US2] Modify scheduleTask to query MAX(calendar_order) WHERE scheduled_date = target date and set calendarOrder to max + 1 (or 0 if no tasks exist on that date) in app/actions/tasks.ts
- [x] T012 [US2] Modify unscheduleTask to also reset calendarOrder to 0 alongside setting scheduledDate to null in app/actions/tasks.ts
- [x] T013 [US2] Add reorderCalendarTasks(date: string, orderedIds: string[]) server action that validates date format and batch-updates calendar_order = index for each task ID scoped to that date in app/actions/tasks.ts
- [x] T014 [US2] Pass calendarOrder in FullCalendar event extendedProps and configure the eventOrder prop to sort events within each day by calendarOrder ascending in components/calendar/TaskCalendar.tsx
- [x] T015 [US2] Add DndContext with PointerSensor and restrictToVerticalAxis modifier, and per-date SortableContext groupings to TaskCalendar, render a drag handle (GripVertical icon) inside eventContent using useSortable only when the date has more than one task (hide handle for single-task dates per US2-AS3), and prevent FullCalendar HTML5 dragstart on the handle via onDragStart preventDefault in components/calendar/TaskCalendar.tsx
- [x] T016 [US2] Add DragOverlay for calendar events and implement handleDragEnd that detects intra-day reorder (same date), computes new order with arrayMove, and calls reorderCalendarTasks server action in components/calendar/TaskCalendar.tsx

**Checkpoint**: Calendar date reordering is fully functional — users can reorder tasks within a day cell by handle, per-date order persists after reload, and list order is unaffected

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification and edge case handling

- [x] T017 Verify that FullCalendar list-to-calendar scheduling drag (task body drag) and dnd-kit reorder drag (handle drag) coexist without interference on both TaskItem and calendar events, and fix any event propagation conflicts in components/task-list/TaskItem.tsx and components/calendar/TaskCalendar.tsx
- [x] T018 Run all quickstart.md validation steps: confirm list_order and calendar_order columns exist in Drizzle Studio, verify list ordering matches previous created_at DESC after backfill, test list reorder + reload, test calendar date reorder + reload, test scheduling/rescheduling/unscheduling still works correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion (can run in parallel with Phase 3 if desired)
- **Polish (Phase 5)**: Depends on Phase 3 and Phase 4 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependency on US2
- **User Story 2 (P2)**: Can start after Phase 2 — no dependency on US1. However, sequential execution (US1 → US2) is recommended since the dnd-kit patterns established in US1 will be reused in US2

### Within Each User Story

- Server actions before UI components (data layer first)
- Component hook integration (useSortable) before context wrappers (DndContext/SortableContext)
- Context wrappers before drag overlay and visual polish

### Parallel Opportunities

- T002 and T003 can run in parallel (different files: db/schema.ts vs lib/types.ts)
- T008 can run in parallel with T007 (different files: TaskItem.tsx vs tasks.ts)
- T011 and T012 can be done together (small changes in the same file, same logical unit)
- Once Phase 2 is complete, US1 and US2 could theoretically start in parallel

---

## Parallel Example: User Story 1

```text
# After Phase 2 is complete, launch in parallel:
Task T007: "Add reorderListTasks server action in app/actions/tasks.ts"
Task T008: "Add drag handle and useSortable to TaskItem in components/task-list/TaskItem.tsx"

# Then sequential:
Task T009: "Wrap TaskList with DndContext + SortableContext" (depends on T007 + T008)
Task T010: "Add DragOverlay for visual feedback" (depends on T009)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install dnd-kit dependencies
2. Complete Phase 2: Schema + type + server action foundations
3. Complete Phase 3: List reordering with drag handles
4. **STOP and VALIDATE**: Manually test list reorder + persistence + coexistence with calendar drag
5. Deploy/demo if ready — list reordering delivers standalone value

### Incremental Delivery

1. Setup + Foundational → Data layer ready
2. Add User Story 1 → List reordering works → Validate → Deploy (MVP!)
3. Add User Story 2 → Calendar date reordering works → Validate → Deploy
4. Polish → Coexistence verified, edge cases handled → Final deploy

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Constitution IV: No automated tests. All validation is manual per quickstart.md
- Total file modifications: ~6 existing files + 1 new migration file
- New npm dependencies: 4 (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @dnd-kit/modifiers)
