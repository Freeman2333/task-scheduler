# Feature Specification: Task Reordering

**Feature Branch**: `002-task-reordering`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "I want to reorder tasks within the task list by dragging them up and down to set a custom display order. I also want to reorder tasks on the calendar within a specific date, so when multiple tasks are scheduled on the same day, I can drag them to change their order for that day."

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Reorder Tasks in the List (Priority: P1)

A user opens the app and sees their task list in the left panel. They want to prioritize their work by arranging tasks in a custom order. The user grabs a task by its drag handle and drags it up or down within the list. As they drag, a visual indicator shows where the task will land. When they drop the task, it settles into its new position and the list reflects the updated order. The next time the user opens the app, the custom order is preserved exactly as they left it.

**Why this priority**: List reordering is the more frequently used interaction — users see and interact with the task list constantly. It delivers standalone value by letting users organize and prioritize their work in a personal order, independent of creation date.

**Independent Test**: Can be fully tested by creating several tasks, dragging them into a custom order, reloading the page, and confirming the custom order is preserved.

**Acceptance Scenarios**:

1. **Given** a list with multiple tasks, **When** the user drags a task from one position to another, **Then** the task moves to the new position and all other tasks shift accordingly.
2. **Given** a list with a custom order, **When** the user reloads the page, **Then** the tasks appear in the same custom order.
3. **Given** a list with a custom order, **When** the user creates a new task, **Then** the new task appears at the top of the list without disturbing the relative order of existing tasks.
4. **Given** a task being dragged, **When** the user is mid-drag, **Then** a visual indicator shows the current drop target position.
5. **Given** a task is dragged and dropped back to its original position, **When** the drop completes, **Then** nothing changes and no unnecessary save occurs.

---

### User Story 2 – Reorder Tasks Within a Calendar Date (Priority: P2)

A user looks at the calendar and sees several tasks scheduled on the same day. They want to arrange those tasks in a specific order — for example, the task they plan to do first should appear at the top. The user drags a task within that day cell (or within the day column in week view) to change its position among the other tasks on the same date. The reordered per-date arrangement is saved and preserved on reload.

**Why this priority**: Calendar reordering builds on the list reordering concept (P1) and extends it to the calendar view. It is less frequently used since it only applies when multiple tasks share a date, but it adds meaningful control over daily planning.

**Independent Test**: Can be tested by scheduling three or more tasks to the same date, dragging them into a custom order within that date cell, reloading the page, and confirming the per-date order is preserved.

**Acceptance Scenarios**:

1. **Given** a calendar date with multiple scheduled tasks, **When** the user drags a task to a different position within the same date, **Then** the task moves to the new position among that date's tasks.
2. **Given** a custom per-date order on the calendar, **When** the user reloads the page, **Then** the tasks on that date appear in the saved order.
3. **Given** a calendar date with only one task, **When** the user views it, **Then** no drag reorder affordance is shown (there is nothing to reorder).
4. **Given** a task is reordered within a calendar date, **When** the user views the same task in the list panel, **Then** the list order is unaffected — list order and calendar date order are independent.

---

### Edge Cases

- What happens when a task is deleted that was in the middle of a custom order? → The remaining tasks close the gap and maintain their relative order; no positions are left empty.
- What happens when a task is unscheduled from a date where it had a per-date order? → The task loses its per-date position for that date; remaining tasks on that date keep their relative order.
- What happens when a task is moved to a new calendar date (rescheduled)? → It appears at the end (bottom) of the tasks on the new date; the old date's order is unaffected.
- What happens when the user rapidly reorders several tasks in succession? → Each reorder is processed and saved; the final state reflects all changes accurately.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to reorder tasks in the list panel by dragging a task up or down to a new position.
- **FR-002**: The system MUST persist the custom list order so it survives page reloads and browser restarts.
- **FR-003**: The system MUST provide a visible drag handle or affordance on each task item in the list to indicate it is draggable for reordering.
- **FR-004**: The system MUST show a visual indicator during drag (e.g., a placeholder or insertion line) so the user knows where the task will be placed.
- **FR-005**: When a new task is created, it MUST appear at the top of the list without changing the relative order of existing tasks.
- **FR-006**: When a task is deleted, the remaining tasks MUST maintain their relative order with no gaps.
- **FR-007**: Users MUST be able to reorder tasks within a single calendar date by dragging a task to a different position among the tasks on that same date.
- **FR-008**: The system MUST persist the per-date task order on the calendar so it survives page reloads and browser restarts.
- **FR-009**: List order and calendar per-date order MUST be independent — changing one does not affect the other.
- **FR-010**: When a task is rescheduled to a different date, it MUST appear at the end (bottom) of the target date's task list.
- **FR-011**: When a task is unscheduled, it MUST be removed from the per-date order of the date it was on; remaining tasks on that date keep their relative order.

### Key Entities

- **Task** (extended): In addition to existing attributes (title, description, completed, scheduledDate), a task now carries ordering information: a global list position (determines display order in the left-panel task list) and a per-date calendar position (determines display order among tasks sharing the same scheduled date).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can rearrange tasks in the list via drag-and-drop and see the updated order immediately, with no perceptible delay.
- **SC-002**: Custom list order is fully preserved after a page reload — tasks appear in the exact same order the user set.
- **SC-003**: A user can rearrange tasks within a single calendar date via drag-and-drop and see the updated order immediately.
- **SC-004**: Custom per-date calendar order is fully preserved after a page reload.
- **SC-005**: Reordering tasks in the list does not alter the order of tasks on any calendar date, and vice versa.

---

## Assumptions

- The existing drag-and-drop for scheduling/unscheduling tasks (list ↔ calendar) continues to work as before; this feature adds reordering *within* each context.
- List order replaces the current "newest first" default. Once reordering is available, the list is ordered by the user's custom position. New tasks are inserted at the top (position 0) to match the previous "newest first" behavior as a sensible default.
- Calendar per-date order applies within a single date only; it does not affect how tasks are ordered across different dates.
- Single user only; no concurrent editing or conflict resolution is needed.
- The reorder interaction uses drag-and-drop; there is no alternative reorder mechanism (e.g., arrow buttons) in this version.
