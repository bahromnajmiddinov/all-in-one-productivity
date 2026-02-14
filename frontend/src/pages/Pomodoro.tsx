import { PomodoroTimer } from '../components/pomodoro/PomodoroTimer';

export function Pomodoro() {
  return (
    <div className="p-6 md:p-8 max-w-content mx-auto">
      <div className="mb-8">
        <h1 className="text-h1">Pomodoro</h1>
        <p className="text-body mt-1">Focus sessions with configurable work and break intervals.</p>
      </div>
      <PomodoroTimer />
    </div>
  );
}
