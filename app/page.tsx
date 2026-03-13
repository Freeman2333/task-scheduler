import { getTasks } from '@/app/actions/tasks';
import TaskList from '@/components/task-list/TaskList';
import TaskCalendar from '@/components/calendar/TaskCalendar';

export default async function Home() {
  const tasks = await getTasks();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left panel: Task List */}
      <div
        className="flex flex-col border-r border-border overflow-hidden"
        style={{ width: '35%', minWidth: '280px' }}
        id="task-list-panel"
      >
        <div className="flex-1 overflow-y-auto">
          <TaskList tasks={tasks} />
        </div>
      </div>

      {/* Right panel: Calendar */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <TaskCalendar tasks={tasks} />
      </div>
    </div>
  );
}
