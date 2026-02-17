import { ExerciseTracker } from '../components/health/ExerciseTracker';
import { SleepTracker } from '../components/health/SleepTracker';
import { WaterTracker } from '../components/health/WaterTracker';

export function Health() {
  return (
    <div className="p-6 md:p-8 max-w-content mx-auto">
      <div className="mb-8">
        <h1 className="text-h1">Health</h1>
        <p className="text-body mt-1">Water, sleep, and exercise tracking.</p>
      </div>

      <div className="space-y-6">
        <WaterTracker />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SleepTracker />
          <ExerciseTracker />
        </div>
      </div>
    </div>
  );
}
