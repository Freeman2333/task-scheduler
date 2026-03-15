'use client';

import { useEffect, useRef, useTransition, useState, useCallback, useId, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventContentArg } from '@fullcalendar/core';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { scheduleTask, unscheduleTask, reorderCalendarTasks } from '@/app/actions/tasks';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Task } from '@/lib/types';

interface TaskCalendarProps {
  tasks: Task[];
}

function SortableCalendarEvent({
  eventId,
  title,
  completed,
}: {
  eventId: string;
  title: string;
  completed: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: eventId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-1 px-1 py-0.5 text-xs w-full cursor-grab active:cursor-grabbing ${
        completed ? 'opacity-50 line-through' : ''
      } ${isDragging ? 'opacity-30' : ''}`}
      title={title}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      {...attributes}
      {...listeners}
    >
      <span className="truncate">{title}</span>
    </div>
  );
}

export default function TaskCalendar({ tasks: propTasks }: TaskCalendarProps) {
  const dndId = useId();
  const calendarRef = useRef<FullCalendar>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [tasks, setTasks] = useState(propTasks);

  useEffect(() => {
    setTasks(propTasks);
  }, [propTasks]);

  const scheduledTaskIds = useMemo(
    () => tasks.filter((t) => t.scheduledDate).map((t) => t.id),
    [tasks]
  );

  const events = useMemo(
    () =>
      tasks
        .filter((t) => t.scheduledDate !== null)
        .map((t) => ({
          id: t.id,
          title: t.title,
          start: t.scheduledDate as string,
          allDay: true,
          extendedProps: {
            completed: t.completed,
            calendarOrder: t.calendarOrder,
          },
        })),
    [tasks]
  );

  const calendarSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleCalendarDragStart = useCallback((event: DragStartEvent) => {
    setActiveCalendarId(event.active.id as string);
  }, []);

  const applyOptimisticReorder = useCallback(
    (targetDate: string, orderedIds: string[]) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.scheduledDate !== targetDate) return t;
          const idx = orderedIds.indexOf(t.id);
          return idx !== -1 ? { ...t, calendarOrder: idx } : t;
        })
      );
    },
    []
  );

  const applyOptimisticMove = useCallback(
    (taskId: string, targetDate: string, orderedIds: string[]) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, scheduledDate: targetDate, calendarOrder: orderedIds.indexOf(taskId) };
          }
          if (t.scheduledDate === targetDate) {
            const idx = orderedIds.indexOf(t.id);
            return idx !== -1 ? { ...t, calendarOrder: idx } : t;
          }
          return t;
        })
      );
    },
    []
  );

  const applyOptimisticUnschedule = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, scheduledDate: null, calendarOrder: 0 } : t
      )
    );
  }, []);

  const handleCalendarDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCalendarId(null);
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const activeTask = tasks.find((t) => t.id === active.id);
        const overTask = tasks.find((t) => t.id === over.id);
        if (!activeTask || !overTask) return;

        const targetDate = overTask.scheduledDate!;

        if (activeTask.scheduledDate === targetDate) {
          // Same-day reorder
          const dateTasks = tasks
            .filter((t) => t.scheduledDate === targetDate)
            .sort((a, b) => a.calendarOrder - b.calendarOrder);
          const oldIndex = dateTasks.findIndex((t) => t.id === active.id);
          const newIndex = dateTasks.findIndex((t) => t.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return;

          const reordered = arrayMove(dateTasks, oldIndex, newIndex);
          const orderedIds = reordered.map((t) => t.id);
          applyOptimisticReorder(targetDate, orderedIds);
          reorderCalendarTasks(targetDate, orderedIds);
        } else {
          // Cross-date move — insert at the position of the "over" event
          const targetDateTasks = tasks
            .filter((t) => t.scheduledDate === targetDate)
            .sort((a, b) => a.calendarOrder - b.calendarOrder);
          const overIndex = targetDateTasks.findIndex((t) => t.id === over.id);
          const newOrder = [...targetDateTasks];
          newOrder.splice(overIndex >= 0 ? overIndex : newOrder.length, 0, activeTask);
          const orderedIds = newOrder.map((t) => t.id);

          applyOptimisticMove(active.id as string, targetDate, orderedIds);
          scheduleTask(active.id as string, targetDate);
          reorderCalendarTasks(targetDate, orderedIds);
        }
        return;
      }

      // No sortable target — use bounding-rect hit-testing
      // (elementFromPoint is unreliable here because the DragOverlay covers the drop target)
      if (!over) {
        const pointerEvent = event.activatorEvent as PointerEvent | undefined;
        const delta = event.delta;
        if (!pointerEvent || !delta) return;

        const dropX = pointerEvent.clientX + delta.x;
        const dropY = pointerEvent.clientY + delta.y;

        // Check all calendar day cells by bounding rect
        const dayCells = document.querySelectorAll<HTMLElement>('[data-date]');
        for (const cell of dayCells) {
          const rect = cell.getBoundingClientRect();
          if (dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom) {
            const date = cell.getAttribute('data-date');
            if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
              const taskId = active.id as string;
              const existingOnDate = tasks
                .filter((t) => t.scheduledDate === date && t.id !== taskId)
                .sort((a, b) => a.calendarOrder - b.calendarOrder);
              const orderedIds = [...existingOnDate.map((t) => t.id), taskId];
              applyOptimisticMove(taskId, date, orderedIds);
              scheduleTask(taskId, date);
              return;
            }
          }
        }

        // Check if dropped on the task list panel
        const listPanel = document.getElementById('task-list-panel');
        if (listPanel) {
          const rect = listPanel.getBoundingClientRect();
          if (dropX >= rect.left && dropX <= rect.right && dropY >= rect.top && dropY <= rect.bottom) {
            applyOptimisticUnschedule(active.id as string);
            unscheduleTask(active.id as string);
          }
        }
      }
    },
    [tasks, applyOptimisticReorder, applyOptimisticMove, applyOptimisticUnschedule]
  );

  const handleCalendarDragCancel = useCallback(() => {
    setActiveCalendarId(null);
  }, []);

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const completed = arg.event.extendedProps.completed as boolean;
      return (
        <SortableCalendarEvent
          eventId={arg.event.id}
          title={arg.event.title}
          completed={completed}
        />
      );
    },
    []
  );

  const activeCalendarTask = activeCalendarId
    ? tasks.find((t) => t.id === activeCalendarId)
    : null;

  return (
    <div className="flex-1 h-full overflow-hidden p-2 flex flex-col">
      {error && (
        <p className="text-sm text-destructive mb-2 px-2">{error}</p>
      )}
      <DndContext
        id={dndId}
        sensors={calendarSensors}
        collisionDetection={pointerWithin}
        onDragStart={handleCalendarDragStart}
        onDragEnd={handleCalendarDragEnd}
        onDragCancel={handleCalendarDragCancel}
      >
        <SortableContext
          items={scheduledTaskIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-hidden [&_.fc]:h-full [&_.fc-view-harness]:overflow-y-auto">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={
                isMobile
                  ? { left: 'prev,next', center: 'title', right: 'today' }
                  : {
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,dayGridWeek',
                    }
              }
              dayMaxEvents={false}
              height="100%"
              events={events}
              eventOrder="calendarOrder"
              eventContent={renderEventContent}
              dayCellClassNames="overflow-y-auto"
            />
          </div>
        </SortableContext>
        <DragOverlay>
          {activeCalendarTask ? (
            <div className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded shadow-lg truncate max-w-[150px]">
              {activeCalendarTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
