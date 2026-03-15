# Research: Task Reordering

**Date**: 2026-03-15
**Branch**: `002-task-reordering`

This document resolves key technical unknowns for the task reordering feature.

---

## Research 1: DnD Library for List Reordering

**Decision**: Use `@dnd-kit/core` + `@dnd-kit/sortable` for reordering tasks within the list panel.

**Rationale**:
- The current list→calendar drag uses FullCalendar's `Draggable` from `@fullcalendar/interaction`, which only supports dragging items *out* of a container onto the calendar. It does not support reordering items *within* the same list.
- `@dnd-kit/sortable` is purpose-built for sortable lists in React. It provides `SortableContext`, `useSortable` hook, and `arrayMove` utility out of the box.
- dnd-kit uses the PointerSensor by default, which works via pointer events (not the HTML5 Drag API). FullCalendar's `Draggable` uses the HTML5 Drag API. Because they operate on different event systems, they can coexist on the same elements without conflict.
- A dedicated drag handle (grip icon) on each task triggers dnd-kit reordering. The rest of the task body triggers FullCalendar's scheduling drag. This separation is natural and intuitive for users.

**Dependencies to add**:
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities` (for `CSS.Transform` in drag overlays)
- `@dnd-kit/modifiers` (for `restrictToVerticalAxis` — constrains list reorder to vertical movement)

**Alternatives considered**:
- `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd): Good for vertical lists, but its HTML5 backend would conflict with FullCalendar's `Draggable` on the same elements. Also heavier.
- Native HTML5 Drag and Drop: Too much manual work for visual feedback (placeholders, animations). No built-in sortable strategy.
- FullCalendar `Draggable` with custom sort logic: `Draggable` does not support intra-list reordering. Not designed for this use case.

---

## Research 2: Calendar Date Reordering Strategy

**Decision**: Use `@dnd-kit/sortable` for reordering tasks within a calendar day cell, combined with FullCalendar's `eventOrder` prop for display ordering.

**Rationale**:
- FullCalendar's dayGrid view renders events as a vertical stack within each day cell. It does not natively support reordering events within a single day — dragging an event always moves it to a different date.
- To enable intra-day reordering, we render custom event content via FullCalendar's `eventContent` prop. Each event's custom content uses dnd-kit's `useSortable` hook with a drag handle.
- Events sharing the same date are grouped into a `SortableContext` (keyed by date string). dnd-kit's sortable strategy uses bounding rects, so it works regardless of DOM hierarchy.
- A drag handle on each calendar event triggers dnd-kit reordering within the day. The event body (outside the handle) still triggers FullCalendar's native drag for cross-date rescheduling.
- FullCalendar's `eventOrder` prop sorts events within each day by the `calendarOrder` field stored in `extendedProps`.

**Coexistence with FullCalendar DnD**:
- dnd-kit PointerSensor activates on the drag handle element only (using `activators` or handle-based activation).
- FullCalendar's HTML5-based drag activates on the event wrapper element. Since the handle prevents propagation to the HTML5 drag layer via `event.preventDefault()` on `dragstart`, only one system activates at a time.
- If edge cases arise during implementation, a `MouseSensor` with activation constraint (e.g., 5px distance) can be used instead of `PointerSensor` to further avoid accidental triggers.

**Alternatives considered**:
- Up/down arrow buttons: Simpler to implement but violates the spec requirement for drag-based reordering.
- Modal/popup sortable list per day: Clean separation but adds an extra click and breaks the "direct manipulation" feel specified.
- Custom HTML5 DnD within day cells: Would conflict with FullCalendar's own HTML5 DnD on the same elements.

---

## Research 3: Ordering Data Model Strategy

**Decision**: Add two integer columns to the `tasks` table: `list_order` (global list position) and `calendar_order` (per-date position).

**Rationale**:
- The spec requires list order and calendar order to be independent (FR-009). Two separate columns cleanly model this.
- Integer-based ordering with sequential values is simple and efficient for a single-user app with a small number of tasks (~200 max). No need for fractional indexing or linked-list approaches.
- On reorder, we batch-update the `list_order` (or `calendar_order`) for all affected items in a single database round-trip.
- New tasks get `list_order = 0` and all existing tasks are shifted up by 1 — preserving the "newest at top" behavior from v1 as a natural default.
- When scheduling a task to a date, `calendar_order` is set to `MAX(calendar_order for that date) + 1`, placing it at the bottom of the day's list (FR-010).

**Alternatives considered**:
- Fractional indexing (e.g., Lexorank): Avoids batch updates but adds complexity. Overkill for <200 tasks and a single user.
- Linked list (next_id pointer): More complex queries and updates. No benefit over integers at this scale.
- Separate ordering table: Adds a join. Unnecessary when two columns on the existing table suffice (YAGNI).

---

## Research 4: Server Action Batch Update Pattern

**Decision**: Use a single `reorderListTasks(orderedIds: string[])` action that receives the full list of task IDs in the desired order, and a `reorderCalendarTasks(date: string, orderedIds: string[])` action for per-date reordering.

**Rationale**:
- Receiving the full ordered array is the simplest contract: the server assigns `list_order = index` for each ID. No diff calculation needed.
- For calendar reorder, scoping by date makes the update efficient and isolated.
- Both actions use a single SQL `UPDATE ... CASE WHEN` statement (or a loop of updates within a transaction) to batch-update positions in one round-trip.
- `revalidatePath('/')` is called once after the batch update for consistency.

**Alternatives considered**:
- Sending only the moved item + new index: Requires server-side array manipulation. More complex contract for marginal bandwidth savings.
- Individual `UPDATE` per task: Multiple round-trips to the DB. Slower and risks partial updates on failure.

---

## Summary of Decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | List reorder DnD | `@dnd-kit/core` + `@dnd-kit/sortable` with drag handles |
| 2 | Calendar date reorder | `@dnd-kit/sortable` within `eventContent` + FullCalendar `eventOrder` |
| 3 | Ordering data model | Two integer columns: `list_order`, `calendar_order` |
| 4 | Server action pattern | Batch update via ordered ID array |

**All NEEDS CLARIFICATION items resolved. Proceeding to Phase 1 design.**
