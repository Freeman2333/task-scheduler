'use client';

import { useState, useTransition } from 'react';
import { updateTask } from '@/app/actions/tasks';
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
import type { Task } from '@/lib/types';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
}

export default function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [scheduledDate, setScheduledDate] = useState(task.scheduledDate ?? '');
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setTitleError('');
    setError('');

    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    startTransition(async () => {
      try {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          scheduledDate: scheduledDate || null,
        });
        onClose();
      } catch {
        setError('Failed to save changes. Please try again.');
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
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
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={3}
              className="resize-none break-all"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-date">Scheduled Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              disabled={isPending}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
