'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq, not } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import type { Task } from '@/lib/types';

export async function getTasks(): Promise<Task[]> {
  const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    scheduledDate: row.scheduledDate,
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
  await db.insert(tasks).values({
    title: trimmed,
    description: description?.trim() || null,
    scheduledDate: scheduledDate || null,
  });
  revalidatePath('/');
}

export async function updateTask(
  id: string,
  data: { title: string; description?: string }
): Promise<void> {
  const trimmed = data.title.trim();
  if (!trimmed) throw new Error('Title is required');
  await db
    .update(tasks)
    .set({ title: trimmed, description: data.description?.trim() || null })
    .where(eq(tasks.id, id));
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
  await db.update(tasks).set({ scheduledDate: date }).where(eq(tasks.id, id));
  revalidatePath('/');
}

export async function unscheduleTask(id: string): Promise<void> {
  await db.update(tasks).set({ scheduledDate: null }).where(eq(tasks.id, id));
  revalidatePath('/');
}
