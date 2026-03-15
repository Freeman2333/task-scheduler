'use client';

import { useState } from 'react';
import TaskList from '@/components/task-list/TaskList';
import TaskCalendar from '@/components/calendar/TaskCalendar';
import CreateTaskForm from '@/components/task-list/CreateTaskForm';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Task } from '@/lib/types';

interface ResponsiveLayoutProps {
  tasks: Task[];
}

type Tab = 'tasks' | 'calendar';

export default function ResponsiveLayout({ tasks }: ResponsiveLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div
          className="flex flex-col border-r border-border overflow-hidden"
          style={{ width: '35%', minWidth: '280px' }}
          id="task-list-panel"
        >
          <div className="flex-1 overflow-y-auto">
            <TaskList tasks={tasks} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <TaskCalendar tasks={tasks} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <nav className="flex gap-1 p-2 border-b border-border bg-background shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 gap-2 ${
            activeTab === 'tasks'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Tasks
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 gap-2 ${
            activeTab === 'calendar'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Calendar
        </Button>
      </nav>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'tasks' ? (
          <div className="h-full overflow-y-auto">
            <TaskList tasks={tasks} />
          </div>
        ) : (
          <div className="h-full overflow-hidden flex flex-col">
            <CreateTaskForm />
            <TaskCalendar tasks={tasks} />
          </div>
        )}
      </div>
    </div>
  );
}
