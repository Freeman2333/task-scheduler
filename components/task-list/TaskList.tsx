'use client';

import { useEffect, useId, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { DragOverlay } from '@dnd-kit/core';
import CreateTaskForm from './CreateTaskForm';
import TaskItem from './TaskItem';
import { reorderListTasks, scheduleTask } from '@/app/actions/tasks';
import type { Task } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks: initialTasks }: TaskListProps) {
  const dndId = useId();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = tasks.findIndex((t) => t.id === active.id);
        const newIndex = tasks.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(tasks, oldIndex, newIndex);
        setTasks(reordered);
        reorderListTasks(reordered.map((t) => t.id));
        return;
      }

      if (!over) {
        const pointerEvent = event.activatorEvent as PointerEvent | undefined;
        const delta = event.delta;
        if (pointerEvent && delta) {
          const dropX = pointerEvent.clientX + delta.x;
          const dropY = pointerEvent.clientY + delta.y;
          const dayCells = document.querySelectorAll<HTMLElement>('[data-date]');
          for (const cell of dayCells) {
            const rect = cell.getBoundingClientRect();
            if (dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom) {
              const date = cell.getAttribute('data-date');
              if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                scheduleTask(active.id as string, date);
                return;
              }
            }
          }
        }
      }
    },
    [tasks]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold">Tasks</h1>
      </div>
      <CreateTaskForm />
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                No tasks yet. Create one above.
              </p>
            ) : (
              tasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeTask ? (
            <TaskItem task={activeTask} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
