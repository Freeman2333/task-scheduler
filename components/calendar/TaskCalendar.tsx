'use client';

import { useRef, useTransition, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type EventDragStopArg } from '@fullcalendar/interaction';
import type { EventDropArg, EventContentArg } from '@fullcalendar/core';
import { scheduleTask, unscheduleTask } from '@/app/actions/tasks';
import type { Task } from '@/lib/types';

interface TaskCalendarProps {
  tasks: Task[];
}

export default function TaskCalendar({ tasks }: TaskCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState('');

  const events = tasks
    .filter((t) => t.scheduledDate !== null)
    .map((t) => ({
      id: t.id,
      title: t.title,
      start: t.scheduledDate as string,
      allDay: true,
      extendedProps: { completed: t.completed },
    }));

  function handleDrop(info: { draggedEl: HTMLElement; dateStr: string; }) {
    const taskId = info.draggedEl.dataset.taskId;
    if (!taskId) return;
    const date = info.dateStr.slice(0, 10);
    setError('');
    startTransition(async () => {
      try {
        await scheduleTask(taskId, date);
      } catch {
        setError('Failed to schedule task.');
      }
    });
  }

  function handleEventDrop(info: EventDropArg) {
    const taskId = info.event.id;
    const date = info.event.startStr.slice(0, 10);
    setError('');
    startTransition(async () => {
      try {
        await scheduleTask(taskId, date);
      } catch {
        info.revert();
        setError('Failed to reschedule task.');
      }
    });
  }

  function handleEventDragStop(info: EventDragStopArg) {
    const calendarEl = calendarContainerRef.current;
    if (!calendarEl) return;
    const rect = calendarEl.getBoundingClientRect();
    const { jsEvent } = info;
    const outside =
      jsEvent.clientX < rect.left ||
      jsEvent.clientX > rect.right ||
      jsEvent.clientY < rect.top ||
      jsEvent.clientY > rect.bottom;

    if (outside) {
      const taskId = info.event.id;
      setError('');
      startTransition(async () => {
        try {
          await unscheduleTask(taskId);
        } catch {
          setError('Failed to unschedule task.');
        }
      });
    }
  }

  function renderEventContent(arg: EventContentArg) {
    const completed = arg.event.extendedProps.completed as boolean;
    return (
      <div
        className={`px-1 py-0.5 text-xs truncate w-full ${
          completed ? 'opacity-50 line-through' : ''
        }`}
        title={arg.event.title}
      >
        {arg.event.title}
      </div>
    );
  }

  return (
    <div ref={calendarContainerRef} className="flex-1 h-full overflow-hidden p-2 flex flex-col">
      {error && (
        <p className="text-sm text-destructive mb-2 px-2">{error}</p>
      )}
      <div className="flex-1 overflow-hidden [&_.fc]:h-full [&_.fc-view-harness]:overflow-y-auto">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          editable={true}
          droppable={true}
          dayMaxEvents={false}
          height="100%"
          events={events}
          drop={handleDrop}
          eventDrop={handleEventDrop}
          eventDragStop={handleEventDragStop}
          eventContent={renderEventContent}
          dayCellClassNames="overflow-y-auto"
        />
      </div>
    </div>
  );
}
