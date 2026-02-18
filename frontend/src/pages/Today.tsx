import { TaskList } from '../components/TaskList';
import { OverdueTasks } from '../components/dashboard/OverdueTasks';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { DashboardPomodoroWidget } from '../components/dashboard/DashboardPomodoroWidget';
import { DashboardHabitsWidget } from '../components/dashboard/DashboardHabitsWidget';
import { Sun } from 'lucide-react';

export function Today() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-[var(--radius)] bg-warning-subtle text-warning">
            <Sun className="w-5 h-5" />
          </div>
          <h1 className="text-h1">Today</h1>
        </div>
        <p className="text-body max-w-2xl">
          Overview of your tasks, focus time, and habits. Stay on top of what matters most today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <OverdueTasks />
          <section>
            <h2 className="text-h3 mb-4">Today&apos;s Tasks</h2>
            <TaskList />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <DashboardPomodoroWidget />
          <DashboardHabitsWidget />
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-5 shadow-card">
            <UpcomingTasks />
          </div>
        </div>
      </div>
    </div>
  );
}
