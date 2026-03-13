# Server Action Contracts: Personal Task Scheduler

**Date**: 2026-03-13
**File**: `app/actions/tasks.ts`
**Pattern**: All functions are Next.js Server Actions (`'use server'`). They run on the server, access the DB via Drizzle, and call `revalidatePath('/')` after mutations.

---

## getTasks

**Purpose**: Fetch all tasks ordered newest first (used by the root Server Component to hydrate both panels on page load).

```typescript
export async function getTasks(): Promise<Task[]>
```

- **Returns**: Array of all tasks, ordered by `created_at DESC`.
- **Side effects**: None (read-only).
- **Errors**: Throws on DB connection failure; Next.js error boundary handles it.

---

## createTask

**Purpose**: Create a new task with a title and optional description.

```typescript
export async function createTask(
  title: string,
  description?: string
): Promise<void>
```

- **Validation**: `title` must be non-empty after trimming. Throws `Error('Title is required')` if empty.
- **Side effects**: Inserts row into `tasks`; calls `revalidatePath('/')`.
- **Returns**: `void` (page revalidates and re-fetches tasks).

---

## updateTask

**Purpose**: Update a task's title and/or description via the edit modal.

```typescript
export async function updateTask(
  id: string,
  data: { title: string; description?: string }
): Promise<void>
```

- **Validation**: `id` must be a valid UUID; `title` must be non-empty after trimming.
- **Side effects**: Updates matching row; calls `revalidatePath('/')`.
- **Errors**: No-op if task not found (graceful).

---

## toggleComplete

**Purpose**: Flip the `completed` status of a task.

```typescript
export async function toggleComplete(id: string): Promise<void>
```

- **Side effects**: Sets `completed = NOT completed` for the row; calls `revalidatePath('/')`.
- **Errors**: No-op if task not found.

---

## deleteTask

**Purpose**: Permanently delete a task (called after user confirms the AlertDialog).

```typescript
export async function deleteTask(id: string): Promise<void>
```

- **Side effects**: Deletes matching row; calls `revalidatePath('/')`.
- **Errors**: No-op if task not found.

---

## scheduleTask

**Purpose**: Set or update the `scheduled_date` of a task. Called when a task is dragged onto a calendar date.

```typescript
export async function scheduleTask(
  id: string,
  date: string  // ISO date string "YYYY-MM-DD"
): Promise<void>
```

- **Validation**: `date` must match `YYYY-MM-DD` format.
- **Side effects**: Sets `scheduled_date` on matching row; calls `revalidatePath('/')`.
- **Errors**: No-op if task not found.

---

## unscheduleTask

**Purpose**: Remove the `scheduled_date` from a task. Called when a task is dragged from the calendar back to the list panel.

```typescript
export async function unscheduleTask(id: string): Promise<void>
```

- **Side effects**: Sets `scheduled_date = NULL` on matching row; calls `revalidatePath('/')`.
- **Errors**: No-op if task not found.

---

## Summary Table

| Action | Mutation | Revalidates | Input Validation |
|--------|----------|-------------|-----------------|
| `getTasks` | No | No | None |
| `createTask` | INSERT | Yes | title non-empty |
| `updateTask` | UPDATE | Yes | title non-empty, valid UUID |
| `toggleComplete` | UPDATE | Yes | valid UUID |
| `deleteTask` | DELETE | Yes | valid UUID |
| `scheduleTask` | UPDATE | Yes | valid UUID, valid date |
| `unscheduleTask` | UPDATE | Yes | valid UUID |
