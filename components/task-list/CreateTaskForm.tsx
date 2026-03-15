'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { createTask } from '@/app/actions/tasks';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateTaskForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayStr());
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle('');
    setDescription('');
    setScheduledDate(todayStr());
    setTitleError('');
    setError('');
  }

  function handleOpen() {
    resetForm();
    setOpen(true);
  }

  function handleSave() {
    setTitleError('');
    setError('');

    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    startTransition(async () => {
      try {
        await createTask(title.trim(), description.trim() || undefined, scheduledDate || undefined);
        setOpen(false);
        resetForm();
      } catch {
        setError('Failed to create task. Please try again.');
      }
    });
  }

  return (
    <>
      <div className="p-3 border-b border-border">
        <Button onClick={handleOpen} className="w-full h-11 text-base cursor-pointer gap-2">
          <Plus className="h-5 w-5" />
          Add Task
        </Button>
      </div>
      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="create-title">Title</Label>
              <Input
                id="create-title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                aria-invalid={!!titleError}
                autoFocus
              />
              {titleError && (
                <p className="text-sm text-destructive">{titleError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-date">Scheduled Date</Label>
              <Input
                id="create-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={isPending}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Adding…' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
