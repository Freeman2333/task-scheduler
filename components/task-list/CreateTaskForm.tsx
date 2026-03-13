'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/app/actions/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function CreateTaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTitleError('');
    setError('');

    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    startTransition(async () => {
      try {
        await createTask(title.trim(), description.trim() || undefined);
        setTitle('');
        setDescription('');
      } catch {
        setError('Failed to create task. Please try again.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-border space-y-3">
      <div className="space-y-1">
        <Label htmlFor="task-title">New Task</Label>
        <Input
          id="task-title"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          aria-invalid={!!titleError}
        />
        {titleError && (
          <p className="text-sm text-destructive">{titleError}</p>
        )}
      </div>
      <div className="space-y-1">
        <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          rows={2}
          className="resize-none"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Adding…' : 'Add Task'}
      </Button>
    </form>
  );
}
