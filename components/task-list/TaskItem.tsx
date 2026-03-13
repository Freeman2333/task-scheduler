'use client';

import { useState, useTransition } from 'react';
import { toggleComplete, deleteTask } from '@/app/actions/tasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import EditTaskModal from './EditTaskModal';
import type { Task } from '@/lib/types';

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleToggle() {
    setError('');
    startTransition(async () => {
      try {
        await toggleComplete(task.id);
      } catch {
        setError('Failed to update task.');
      }
    });
  }

  function handleDelete() {
    setError('');
    startTransition(async () => {
      try {
        await deleteTask(task.id);
      } catch {
        setError('Failed to delete task.');
      }
    });
  }

  return (
    <div
      className={`flex items-start gap-2 p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing ${isPending ? 'opacity-60' : ''}`}
      data-task-id={task.id}
      data-task-title={task.title}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        disabled={isPending}
        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-primary"
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            task.completed ? 'line-through text-muted-foreground' : ''
          }`}
          title={task.title}
        >
          {task.title}
        </p>
        {task.description && (
          <p
            className={`text-xs truncate mt-0.5 ${
              task.completed ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'
            }`}
            title={task.description}
          >
            {task.description}
          </p>
        )}
        {task.scheduledDate && (
          <Badge variant="secondary" className="mt-1 text-xs">
            {task.scheduledDate}
          </Badge>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowEdit(true)}
          disabled={isPending}
          className="h-7 px-2 text-xs"
        >
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            disabled={isPending}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-accent rounded-md transition-colors"
          >
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete task?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{task.title}&rdquo; will be permanently deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {showEdit && (
        <EditTaskModal task={task} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
