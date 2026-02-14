import { PomodoroTimer } from '../components/pomodoro/PomodoroTimer';

export function Pomodoro() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Pomodoro Timer</h2>
      <PomodoroTimer />
    </div>
  );
}
