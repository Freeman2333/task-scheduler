'use server';

import { revalidatePath } from 'next/cache';
import { asc, eq, max, not, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import type { Task } from '@/lib/types';

export async function getTasks(): Promise<Task[]> {
  const rows = await db.select().from(tasks).orderBy(asc(tasks.listOrder));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    scheduledDate: row.scheduledDate,
    listOrder: row.listOrder,
    calendarOrder: row.calendarOrder,
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt),
  }));
}

export async function createTask(title: string, description?: string, scheduledDate?: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Title is required');
  if (scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    throw new Error('Invalid date format');
  }

  await db.update(tasks).set({ listOrder: sql`${tasks.listOrder} + 1` });

  let calendarOrder = 0;
  if (scheduledDate) {
    const [result] = await db
      .select({ maxOrder: max(tasks.calendarOrder) })
      .from(tasks)
      .where(eq(tasks.scheduledDate, scheduledDate));
    calendarOrder = (result?.maxOrder ?? -1) + 1;
  }

  await db.insert(tasks).values({
    title: trimmed,
    description: description?.trim() || null,
    scheduledDate: scheduledDate || null,
    listOrder: 0,
    calendarOrder,
  });
  revalidatePath('/');
}

export async function updateTask(
  id: string,
  data: { title: string; description?: string; scheduledDate?: string | null }
): Promise<void> {
  const trimmed = data.title.trim();
  if (!trimmed) throw new Error('Title is required');
  if (data.scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.scheduledDate)) {
    throw new Error('Invalid date format');
  }

  const set: Record<string, unknown> = {
    title: trimmed,
    description: data.description?.trim() || null,
  };

  if (data.scheduledDate !== undefined) {
    if (data.scheduledDate) {
      const [result] = await db
        .select({ maxOrder: max(tasks.calendarOrder) })
        .from(tasks)
        .where(eq(tasks.scheduledDate, data.scheduledDate));
      set.scheduledDate = data.scheduledDate;
      set.calendarOrder = (result?.maxOrder ?? -1) + 1;
    } else {
      set.scheduledDate = null;
      set.calendarOrder = 0;
    }
  }

  await db.update(tasks).set(set).where(eq(tasks.id, id));
  revalidatePath('/');
}

export async function toggleComplete(id: string): Promise<void> {
  await db
    .update(tasks)
    .set({ completed: not(tasks.completed) })
    .where(eq(tasks.id, id));
  revalidatePath('/');
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath('/');
}

export async function scheduleTask(id: string, date: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format');
  const [result] = await db
    .select({ maxOrder: max(tasks.calendarOrder) })
    .from(tasks)
    .where(eq(tasks.scheduledDate, date));
  const calendarOrder = (result?.maxOrder ?? -1) + 1;
  await db
    .update(tasks)
    .set({ scheduledDate: date, calendarOrder })
    .where(eq(tasks.id, id));
  revalidatePath('/');
}

export async function unscheduleTask(id: string): Promise<void> {
  await db
    .update(tasks)
    .set({ scheduledDate: null, calendarOrder: 0 })
    .where(eq(tasks.id, id));
  revalidatePath('/');
}

export async function reorderListTasks(orderedIds: string[]): Promise<void> {
  if (!orderedIds.length) throw new Error('Ordered IDs array must not be empty');
  const updates = orderedIds.map((id, index) =>
    db.update(tasks).set({ listOrder: index }).where(eq(tasks.id, id))
  );
  await Promise.all(updates);
  revalidatePath('/');
}

export async function reorderCalendarTasks(date: string, orderedIds: string[]): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format');
  if (!orderedIds.length) throw new Error('Ordered IDs array must not be empty');
  const updates = orderedIds.map((id, index) =>
    db.update(tasks).set({ calendarOrder: index }).where(eq(tasks.id, id))
  );
  await Promise.all(updates);
  revalidatePath('/');
}
