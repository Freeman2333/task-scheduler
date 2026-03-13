'use client';

import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import CreateTaskForm from './CreateTaskForm';
import TaskItem from './TaskItem';
import type { Task } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const draggable = new Draggable(listRef.current, {
      itemSelector: '[data-task-id]',
      eventData(el) {
        return {
          id: el.dataset.taskId,
          title: el.dataset.taskTitle,
          duration: '00:00',
        };
      },
    });
    return () => draggable.destroy();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold">Tasks</h1>
      </div>
      <CreateTaskForm />
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No tasks yet. Create one above.
          </p>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
