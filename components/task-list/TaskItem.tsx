'use client';

import { useState, useTransition } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2 } from 'lucide-react';
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
  isDragOverlay?: boolean;
}

export default function TaskItem({ task, isDragOverlay }: TaskItemProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing ${
        isPending ? 'opacity-60' : ''
      } ${isDragging ? 'opacity-30' : ''} ${isDragOverlay ? 'shadow-lg bg-background rounded-md border' : ''}`}
      data-task-id={task.id}
      data-task-title={task.title}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      {...attributes}
      {...listeners}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        disabled={isPending}
        onPointerDown={(e) => e.stopPropagation()}
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
      <div
        className="flex gap-0.5 flex-shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowEdit(true)}
          disabled={isPending}
          className="h-9 w-9 cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Edit task"
        >
          <Pencil className="h-[18px] w-[18px]" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            disabled={isPending}
            render={<Button size="icon" variant="ghost" className="h-9 w-9 cursor-pointer text-muted-foreground hover:text-destructive" aria-label="Delete task" />}
          >
            <Trash2 className="h-[18px] w-[18px]" />
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
