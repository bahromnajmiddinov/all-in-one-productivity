import { TaskList } from '../components/TaskList';
import { OverdueTasks } from '../components/dashboard/OverdueTasks';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { DashboardPomodoroWidget } from '../components/dashboard/DashboardPomodoroWidget';
import { DashboardHabitsWidget } from '../components/dashboard/DashboardHabitsWidget';

export function Today() {
  return (
    <div className="p-6 md:p-8 max-w-content mx-auto">
      <div className="mb-8">
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-body mt-1">Overview of your tasks, focus time, and habits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OverdueTasks />
          <section>
            <h2 className="text-h3 mb-4">Today&apos;s tasks</h2>
            <TaskList />
          </section>
        </div>

        <div className="space-y-6">
          <DashboardPomodoroWidget />
          <DashboardHabitsWidget />
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-5 shadow-soft">
            <UpcomingTasks />
          </div>
        </div>
      </div>
    </div>
  );
}
