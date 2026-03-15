# Quickstart: Task Reordering

**Date**: 2026-03-15
**Branch**: `002-task-reordering`

---

## Prerequisites

- Node.js 20+
- Existing `task-scheduler` project set up and running (from `001-initial-app-setup`)
- Neon database with `tasks` table already migrated
- `DATABASE_URL` in `.env.local`

## Setup Steps

### 1. Install new dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
```

### 2. Update the database schema

Add `listOrder` and `calendarOrder` columns to `db/schema.ts` (see `data-model.md` for the full schema).

### 3. Generate and run migration

```bash
npm run db:generate
npm run db:migrate
```

**Note**: The migration adds `list_order` and `calendar_order` columns with `DEFAULT 0`. After migration, run a backfill to set initial `list_order` values based on current `created_at DESC` ordering. See `data-model.md` for the backfill SQL.

### 4. Verify in Drizzle Studio

```bash
npm run db:studio
```

Confirm that the `tasks` table now has `list_order` and `calendar_order` columns with backfilled values.

### 5. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- Tasks display in `list_order` order (should match the previous `created_at DESC` order after backfill)
- Drag handle appears on each task in the list
- List reordering works (drag handle → dnd-kit)
- Calendar scheduling still works (task body → FullCalendar drag)
- Calendar date reordering works for dates with multiple tasks

## Key files to modify

| File | Changes |
|------|---------|
| `db/schema.ts` | Add `listOrder`, `calendarOrder` columns |
| `lib/types.ts` | Add `listOrder`, `calendarOrder` to Task type |
| `app/actions/tasks.ts` | Modify `getTasks`, `createTask`, `scheduleTask`, `unscheduleTask`; add `reorderListTasks`, `reorderCalendarTasks` |
| `components/task-list/TaskList.tsx` | Wrap list in dnd-kit `DndContext` + `SortableContext` |
| `components/task-list/TaskItem.tsx` | Add drag handle, use `useSortable` hook |
| `components/calendar/TaskCalendar.tsx` | Add dnd-kit for intra-day reorder, use `eventOrder` |
