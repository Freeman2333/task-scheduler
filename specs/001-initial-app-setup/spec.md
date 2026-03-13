# Feature Specification: Personal Task Scheduler – Initial App Setup

**Feature Branch**: `001-initial-app-setup`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "initial app setup - Build a simple personal task scheduler web app for a single user (no accounts, no login)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Manage a Task List (Priority: P1)

A user opens the app and immediately sees a split-panel layout: the task list on the left and the calendar on the right. Both panels are always visible on the initial screen — there is no switching between views. From the list panel, the user can create new tasks (title required, description optional), edit existing tasks, mark tasks as complete or uncomplete, and delete tasks they no longer need.

**Why this priority**: The task list is the core of the app. Without this, everything else is meaningless. It delivers standalone value even without the calendar.

**Independent Test**: Can be fully tested by opening the app, creating several tasks, editing them, toggling their completed state, and deleting one — delivering a usable to-do manager with persistence.

**Acceptance Scenarios**:

1. **Given** a user opens the app, **When** the page loads, **Then** the task list panel is visible on the left and the calendar panel is visible on the right simultaneously — no navigation required.
2. **Given** the app is open with no tasks, **When** the user creates a task with a title and description, **Then** the task appears in the list immediately.
3. **Given** a task exists, **When** the user triggers edit, **Then** a modal dialog opens with the task's current title and description pre-filled; **When** the user saves, **Then** the modal closes and updated values are shown in the list.
4. **Given** an uncompleted task, **When** the user marks it as complete, **Then** it is visually distinguished from uncompleted tasks (e.g. strikethrough or different style).
5. **Given** a completed task, **When** the user marks it as uncomplete, **Then** it returns to the uncompleted visual style.
6. **Given** a task exists, **When** the user attempts to delete it, **Then** a confirmation prompt appears; if confirmed, the task is removed; if cancelled, it remains.
7. **Given** tasks have been created, **When** the user reloads or revisits the app, **Then** all tasks are still present exactly as left.

---

### User Story 2 – Schedule Tasks on a Calendar (Priority: P2)

The right panel shows a calendar that can be toggled between month view and week view. The user can navigate to previous and next months or weeks. Tasks that have been scheduled for a date appear on the appropriate day cell in both views. The user can drag an unscheduled task from the left panel onto a calendar date to schedule it. They can also drag a scheduled task to a different date to reschedule it, or drag it back to the left panel to unschedule it.

**Why this priority**: The calendar/scheduling feature is what makes this a task *scheduler* rather than just a to-do list. It builds on top of the task list (P1) and adds time awareness.

**Independent Test**: Can be tested by scheduling a task to a date via drag-and-drop, verifying it appears on that date on the calendar, rescheduling it to a different date, and then unscheduling it — with persistence confirmed after reload.

**Acceptance Scenarios**:

1. **Given** an unscheduled task in the list, **When** the user drags it onto a date in the calendar, **Then** the task appears on that date in the calendar view and the task's scheduled date is saved.
2. **Given** a scheduled task on the calendar, **When** the user drags it to a different date, **Then** the task moves to the new date; the old date slot is empty.
3. **Given** a scheduled task, **When** the user drags it off the calendar (back to the list or to an unschedule zone), **Then** the task loses its scheduled date and returns to the unscheduled state.
4. **Given** a completed task that was scheduled, **When** the user views the calendar, **Then** the task still appears on its scheduled date (completed status is visible on the calendar too).
5. **Given** scheduled tasks exist, **When** the user reloads the app, **Then** all tasks appear on the correct calendar dates.

---

### Edge Cases

- What happens if the user creates a task with only a title and no description? → This is fully valid; description is optional and the task is created successfully.
- What happens if the user tries to create a task with no title? → The system prevents creation and shows a clear user-facing error; title is mandatory.
- What happens if a task title or description is very long? → Long text is truncated with an ellipsis in the list and calendar cells; the full text is always visible in the edit/detail view.
- What happens if the user drags a task to a date that already has many tasks? → All tasks are shown on that day cell; if they overflow the cell height, the cell becomes scrollable so no tasks are hidden.
- What happens if the user cancels the delete confirmation? → Nothing changes; the task remains in its current state.

---

## Clarifications

### Session 2026-03-13

- Q: Do scheduled tasks remain visible in the left list, or disappear once placed on the calendar? → A: Scheduled tasks remain in the left list with a visual indicator showing their scheduled date.
- Q: How does task editing work — inline, modal, or side panel? → A: Modal dialog — a centered popup with title and description fields.
- Q: In what order are tasks displayed in the left list? → A: Newest first — reverse creation order, most recently created at top.
- Q: Can users navigate the calendar to other months, and are other calendar views available? → A: Users can navigate to previous/next months and can switch between month view and week view.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display a split-panel layout on the initial screen: task list on the left, monthly calendar on the right — both always visible simultaneously.
- **FR-002**: System MUST allow users to create a task with a title (mandatory) and an optional description.
- **FR-003**: System MUST prevent task creation when the title field is empty and display a clear user-facing error.
- **FR-004**: System MUST display all tasks (completed and uncompleted) in the left-panel list view, including tasks that are scheduled on the calendar. Tasks MUST be ordered newest first (most recently created at the top).
- **FR-004a**: Scheduled tasks in the left list MUST show a visual indicator of their scheduled date (e.g. a date label or badge).
- **FR-005**: System MUST visually distinguish completed tasks from uncompleted tasks in the list view.
- **FR-006**: Users MUST be able to edit a task's title and description after creation via a modal dialog that contains the title and description fields. The split-panel layout behind the modal remains intact while editing.
- **FR-007**: Users MUST be able to toggle a task between completed and uncompleted status.
- **FR-008**: Users MUST be able to delete a task; the system MUST display a confirmation prompt before deleting.
- **FR-009**: System MUST persist all task data (title, description, status, scheduled date) across page reloads and browser restarts.
- **FR-010**: The right-panel calendar MUST show all scheduled tasks on their respective date cells.
- **FR-010a**: The calendar MUST support navigation to the previous and next month (or week, depending on current view).
- **FR-010b**: The calendar MUST allow users to switch between month view and week view via a toggle control. Both views show scheduled tasks on their respective dates.
- **FR-011**: Users MUST be able to schedule a task for a specific date by dragging it from the left list panel onto a calendar date in the right panel (works in both month and week view).
- **FR-012**: Users MUST be able to reschedule a task by dragging it from one calendar date to another (works in both month and week view).
- **FR-013**: Users MUST be able to unschedule a task by dragging it from the calendar back to the left list panel, removing its scheduled date.
- **FR-014**: Each task MUST have at most one scheduled date at any time.
- **FR-015**: Completed tasks with a scheduled date MUST still appear on the calendar on their scheduled date, with their completed status visually indicated.
- **FR-016**: Long task titles and descriptions MUST be truncated with an ellipsis in list and calendar cells; the full text MUST be visible in the edit/detail view.
- **FR-017**: When a calendar date cell contains more tasks than fit its visible height, the cell MUST become scrollable so all tasks are accessible.

### Key Entities

- **Task**: A single unit of work. Has a title (required), description (optional), completed status (boolean, default: false), and an optional scheduled-for date. A task can exist without a scheduled date.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create, edit, complete, uncomplete, and delete a task within 1 minute of opening the app for the first time.
- **SC-002**: All task data (including scheduled dates) is intact after a page reload with no user action required.
- **SC-003**: A user can schedule a task to a calendar date using only drag-and-drop with no extra clicks required.
- **SC-004**: The visual difference between completed and uncompleted tasks is immediately recognizable without reading any labels.
- **SC-005**: A user can reschedule or unschedule a task without navigating away from the calendar view.

---

## Assumptions

- Single user only; no authentication, sessions, or multi-user support in this version.
- The initial screen is a fixed split-panel: list on the left, calendar on the right — no toggling between views required.
- The calendar supports month view and week view; users can toggle between them. Day view is out of scope for v1.
- The calendar opens on the current month/week by default and supports previous/next navigation.
- "Unscheduling" a task means removing the scheduled date; the task returns to the left list panel without a date.
- Completed status and scheduled date are independent; a task can be completed without a scheduled date, or scheduled without being completed.
- Description is optional; a task with only a title is valid.
- Long text (title or description) is truncated in compact views and shown in full in the edit/detail view.
- Tasks in the left list are ordered newest first (reverse creation order); there is no manual reordering in v1.
- Overflowing day cells on the calendar scroll vertically; no tasks are hidden or collapsed.
- The app is a web app accessible via a browser; no mobile-native or offline-first requirements beyond standard browser persistence.

---

## Out of Scope (v1)

- Multiple users, accounts, authentication, or login.
- Recurring tasks or reminders/notifications.
- Task priorities, labels, or categories.
- Day calendar view (month and week views are in scope; day view is not).
- Sharing, exporting, or importing tasks.
