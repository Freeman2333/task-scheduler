# Server Action Contracts: Task Reordering

**Date**: 2026-03-15
**File**: `app/actions/tasks.ts`
**Pattern**: All functions are Next.js Server Actions (`'use server'`). Mutations call `revalidatePath('/')`.

This document covers **new** server actions and **modifications** to existing ones for the task reordering feature.

---

## New Actions

### reorderListTasks

**Purpose**: Batch update the `list_order` of all tasks based on a new ordering provided by the client after a list drag-and-drop reorder.

```typescript
export async function reorderListTasks(
  orderedIds: string[]   // Task IDs in the desired display order (index 0 = top)
): Promise<void>
```

- **Validation**: `orderedIds` must be a non-empty array of strings.
- **Behavior**: Sets `list_order = index` for each task ID in the array. Tasks not in the array are not affected.
- **Side effects**: Batch UPDATE on `tasks`; calls `revalidatePath('/')`.
- **Errors**: Throws on DB failure. If an ID doesn't match an existing task, it is silently skipped (no error).

---

### reorderCalendarTasks

**Purpose**: Batch update the `calendar_order` of tasks on a specific date after a drag-and-drop reorder within a calendar day cell.

```typescript
export async function reorderCalendarTasks(
  date: string,          // ISO date string "YYYY-MM-DD"
  orderedIds: string[]   // Task IDs in the desired display order for that date
): Promise<void>
```

- **Validation**: `date` must match `YYYY-MM-DD` format. `orderedIds` must be non-empty.
- **Behavior**: Sets `calendar_order = index` for each task ID in the array, scoped to the given date.
- **Side effects**: Batch UPDATE on `tasks`; calls `revalidatePath('/')`.
- **Errors**: Throws on invalid date format or DB failure.

---

## Modified Actions

### getTasks (modified)

**Change**: Order by `list_order ASC` instead of `created_at DESC`.

```typescript
export async function getTasks(): Promise<Task[]>
```

- **Returns**: Array of all tasks, ordered by `list_order ASC`.
- **Mapping**: Now includes `listOrder` and `calendarOrder` in the returned `Task` objects.

---

### createTask (modified)

**Change**: Set `list_order = 0` for the new task and increment all existing tasks' `list_order` by 1 (pushes everything down, new task appears at top).

```typescript
export async function createTask(
  title: string,
  description?: string,
  scheduledDate?: string
): Promise<void>
```

- **New behavior**: Before inserting, runs `UPDATE tasks SET list_order = list_order + 1`. Then inserts with `list_order = 0`.
- **If `scheduledDate` is provided**: Also sets `calendar_order = MAX(calendar_order for that date) + 1`.

---

### scheduleTask (modified)

**Change**: When scheduling a task to a date, also set `calendar_order` to place the task at the end of that date's list.

```typescript
export async function scheduleTask(
  id: string,
  date: string
): Promise<void>
```

- **New behavior**: Queries `MAX(calendar_order) WHERE scheduled_date = date`, then sets `calendar_order = max + 1` (or `0` if no tasks exist on that date) alongside `scheduled_date = date`.

---

### unscheduleTask (modified)

**Change**: Reset `calendar_order` to `0` when unscheduling (value is irrelevant while unscheduled).

```typescript
export async function unscheduleTask(id: string): Promise<void>
```

- **New behavior**: Sets `scheduled_date = NULL` and `calendar_order = 0`.

---

## Unchanged Actions

These actions require no changes for the reordering feature:

| Action | Reason unchanged |
|--------|-----------------|
| `updateTask` | Edits title/description only; ordering is not affected |
| `toggleComplete` | Flips completed status; ordering is not affected |
| `deleteTask` | Deleting a task leaves a gap in `list_order`; remaining tasks maintain relative order |

---

## Summary Table

| Action | Mutation | New/Modified | Revalidates | Key change |
|--------|----------|-------------|-------------|------------|
| `getTasks` | No | Modified | No | Order by `list_order ASC` |
| `createTask` | INSERT | Modified | Yes | Increment existing `list_order`, set new to 0 |
| `reorderListTasks` | UPDATE | **New** | Yes | Batch update `list_order` by index |
| `reorderCalendarTasks` | UPDATE | **New** | Yes | Batch update `calendar_order` by index per date |
| `scheduleTask` | UPDATE | Modified | Yes | Also set `calendar_order` to MAX+1 |
| `unscheduleTask` | UPDATE | Modified | Yes | Also reset `calendar_order` to 0 |
| `updateTask` | UPDATE | Unchanged | Yes | — |
| `toggleComplete` | UPDATE | Unchanged | Yes | — |
| `deleteTask` | DELETE | Unchanged | Yes | — |
