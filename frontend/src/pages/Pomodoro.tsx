import { PomodoroTimer } from '../components/pomodoro/PomodoroTimer';

export function Pomodoro() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pomodoro Timer</h2>
      <PomodoroTimer />
    </div>
  );
}
