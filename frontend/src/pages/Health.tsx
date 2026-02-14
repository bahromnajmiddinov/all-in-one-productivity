import { ExerciseTracker } from '../components/health/ExerciseTracker';
import { SleepTracker } from '../components/health/SleepTracker';
import { WaterTracker } from '../components/health/WaterTracker';

export function Health() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Health Tracking</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WaterTracker />
        <SleepTracker />
        <ExerciseTracker />
      </div>
    </div>
  );
}
