# Data Model: Task Reordering

**Date**: 2026-03-15
**Branch**: `002-task-reordering`

---

## Entity Changes

### Task (extended)

Two new fields are added to the existing `tasks` table. All existing fields remain unchanged.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `list_order` | INTEGER | Yes | `0` | Position in the task list panel. Lower values appear higher. |
| `calendar_order` | INTEGER | Yes | `0` | Position among tasks sharing the same `scheduled_date`. Lower values appear higher. |

**Validation rules**:
- `list_order` MUST be a non-negative integer. Each task has a unique `list_order` value (no duplicates in practice, but not enforced by a DB constraint — managed by application logic).
- `calendar_order` MUST be a non-negative integer. Uniqueness is scoped per `scheduled_date` — two tasks on different dates may share the same `calendar_order`.
- `list_order` and `calendar_order` are independent. Changing one never affects the other (FR-009).

**Behavior on mutations**:

| Operation | `list_order` behavior | `calendar_order` behavior |
|-----------|----------------------|--------------------------|
| Create task | Set to `0`; increment all existing tasks' `list_order` by 1 | Set to `0` (not on calendar yet) |
| Delete task | Gap left in `list_order`; relative order preserved | Gap left; relative order preserved |
| Reorder in list | Batch update `list_order` for affected tasks | No change |
| Schedule to a date | No change | Set to `MAX(calendar_order for target date) + 1` |
| Reschedule to new date | No change | Set to `MAX(calendar_order for new date) + 1` |
| Unschedule | No change | Reset to `0` (irrelevant while unscheduled) |
| Reorder within calendar date | No change | Batch update `calendar_order` for tasks on that date |

---

## Updated Drizzle Schema

```typescript
// db/schema.ts
import { pgTable, uuid, text, boolean, date, timestamp, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  scheduledDate: date('scheduled_date'),
  listOrder: integer('list_order').notNull().default(0),
  calendarOrder: integer('calendar_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
```

---

## Updated TypeScript Type

```typescript
// lib/types.ts
export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  scheduledDate: string | null;
  listOrder: number;
  calendarOrder: number;
  createdAt: string;
};
```

---

## Migration SQL

```sql
-- drizzle/migrations/0001_task_reordering.sql
ALTER TABLE "tasks" ADD COLUMN "list_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tasks" ADD COLUMN "calendar_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: assign list_order based on current created_at DESC ordering
-- (row_number - 1) so the newest task gets 0, next gets 1, etc.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
  FROM tasks
)
UPDATE tasks SET list_order = ranked.rn
FROM ranked WHERE tasks.id = ranked.id;

-- Backfill: assign calendar_order per scheduled_date group
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY scheduled_date ORDER BY created_at DESC) - 1 AS rn
  FROM tasks
  WHERE scheduled_date IS NOT NULL
)
UPDATE tasks SET calendar_order = ranked.rn
FROM ranked WHERE tasks.id = ranked.id;
```

---

## Indexes

No new indexes required. The table is expected to hold <200 rows. The `ORDER BY list_order ASC` query and per-date filtering perform well without indexes at this scale.

---

## Relationships

No new relationships. Single-table schema remains unchanged.
