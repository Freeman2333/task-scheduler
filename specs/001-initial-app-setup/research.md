# Research: Personal Task Scheduler – Initial App Setup

**Date**: 2026-03-13
**Branch**: `001-initial-app-setup`

This document resolves key technical unknowns identified during Phase 0 planning.

---

## Research 1: FullCalendar External Drag Interop (List → Calendar)

**Decision**: Use FullCalendar's built-in `@fullcalendar/interaction` plugin with the `Draggable` utility class for external elements (tasks dragged from the left list panel onto the calendar).

**Rationale**:
- FullCalendar's `@fullcalendar/interaction` package includes the `Draggable` class, which makes arbitrary DOM elements become calendar-droppable sources. This is the officially supported pattern for dragging items from outside the calendar into it.
- No need for dnd-kit for the list→calendar drag direction; the FullCalendar `Draggable` API attaches to any container ref and listens to HTML5 drag events on children.
- For calendar→list (unschedule), FullCalendar's `eventDrop` callback combined with a drop zone over the task list panel handles the reverse direction.
- dnd-kit is **not needed** given this approach; removing it keeps dependencies minimal (YAGNI).

**Pattern**:
```typescript
// In TaskList component (useEffect):
const draggableContainer = new Draggable(containerRef.current, {
  itemSelector: '[data-task-id]',
  eventData: (el) => ({
    id: el.dataset.taskId,
    title: el.dataset.taskTitle,
  }),
});

// In FullCalendar:
<FullCalendar
  plugins={[dayGridPlugin, interactionPlugin]}
  droppable={true}               // accept external drops
  drop={handleExternalDrop}      // fires when list item dropped on calendar
  eventDrop={handleEventDrop}    // fires when calendar event dragged to new date
  eventReceive={handleEventReceive}
/>
```

**Alternatives considered**:
- dnd-kit: Would require custom calendar drop targets, bypassing FullCalendar's native DnD. More code, less reliable with FullCalendar internals.
- react-beautiful-dnd: Deprecated, poor cross-container DnD with non-rbd components.

---

## Research 2: Drizzle ORM + Neon Serverless in Next.js App Router

**Decision**: Use `@neondatabase/serverless` as the Postgres driver, wrapped by Drizzle ORM (`drizzle-orm/neon-http`). Use a single module-level Drizzle client in `db/index.ts`.

**Rationale**:
- `@neondatabase/serverless` is optimized for serverless/edge environments (Vercel), using HTTP or WebSocket transport instead of a persistent TCP connection — required for Vercel's serverless functions which have no persistent connections.
- Drizzle ORM with the Neon HTTP adapter is the recommended Neon + Next.js stack as of 2026. It is lightweight (~12KB), TypeScript-first, and avoids the heavy Prisma client generation step.
- Server Actions run in Node.js serverless functions on Vercel, so the `neon-http` adapter is correct.

**Setup**:
```typescript
// db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**drizzle.config.ts**:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Migration workflow**: `npx drizzle-kit generate` → `npx drizzle-kit migrate` (runs against `DATABASE_URL`).

**Alternatives considered**:
- Prisma: Heavier, requires generated client, slower cold starts on Vercel. Overkill for a single-table app.
- Raw `pg`: No type safety, more boilerplate. Against Constitution II (code quality).

---

## Research 3: Server Actions Revalidation Pattern

**Decision**: Use `revalidatePath('/')` after each mutating Server Action to trigger Next.js cache invalidation and re-render the task list.

**Rationale**:
- The task list in the left panel is a Server Component that fetches tasks from the DB at render time. After a mutation (create/update/delete/schedule), calling `revalidatePath('/')` invalidates the page cache and causes the Server Component to re-fetch.
- This avoids client-side state management (no Zustand, no React Query) — consistent with YAGNI.
- For drag-and-drop interactions that need instant visual feedback, the calendar updates optimistically in the FullCalendar client state, and the Server Action persists the change asynchronously. If the action fails, the UI revalidates to the true DB state.

**Pattern**:
```typescript
// app/actions/tasks.ts
'use server';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { tasks } from '@/db/schema';

export async function createTask(title: string, description?: string) {
  await db.insert(tasks).values({ title, description });
  revalidatePath('/');
}
```

**Alternatives considered**:
- React Query / SWR: Adds client-side caching complexity. Not needed for a single-user app with simple mutations.
- Route handlers (API routes): Extra layer not needed when Server Actions suffice.

---

## Research 4: Drizzle Kit Migration on Neon

**Decision**: Use Drizzle Kit's `migrate` command for schema management. Run migrations locally with `DATABASE_URL` pointing to the Neon dev branch, and run again against production URL on first deploy.

**Rationale**:
- Neon supports branching, so a dev branch can be used locally without affecting production data.
- Drizzle Kit generates SQL migration files that can be committed to version control and replayed on any Neon database.
- For a single-table schema, one migration file (`0000_initial.sql`) covers the full setup.

**Workflow**:
```bash
# 1. Create schema in db/schema.ts
# 2. Generate migration SQL
npx drizzle-kit generate

# 3. Apply migration
npx drizzle-kit migrate

# 4. Verify in Neon console
```

---

## Research 5: shadcn/ui Dialog for Edit Modal and AlertDialog for Delete Confirmation

**Decision**: Use shadcn/ui `Dialog` for the edit task modal (FR-006) and `AlertDialog` for the delete confirmation (FR-008).

**Rationale**:
- Both are built into shadcn/ui, require no additional dependencies, and are accessible (focus trap, escape key, ARIA roles).
- `Dialog` supports a form inside it with controlled state — correct for pre-filled title/description edit.
- `AlertDialog` is designed specifically for destructive confirmations with separate Cancel and Confirm actions.

---

## Summary of Decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | List→Calendar drag | FullCalendar `Draggable` (no dnd-kit needed) |
| 2 | DB driver + ORM | `@neondatabase/serverless` + Drizzle ORM `neon-http` |
| 3 | Mutation + rerender | Server Actions + `revalidatePath('/')` |
| 4 | Migrations | Drizzle Kit generate + migrate |
| 5 | Modals | shadcn/ui Dialog (edit) + AlertDialog (delete confirm) |

**All NEEDS CLARIFICATION items resolved. Proceeding to Phase 1 design.**
