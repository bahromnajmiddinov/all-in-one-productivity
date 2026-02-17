# Quick Start Guide - Exercise Planning & Tracking

## For Developers

### Running Migrations
```bash
cd /home/engine/project/backend
python manage.py migrate health
```

### API Endpoints Available
- Exercise Database: `/api/v1/health/exercises/`
- Workouts: `/api/v1/health/workouts/`
- Workout Logs: `/api/v1/health/workout-logs/`
- Personal Records: `/api/v1/health/personal-records/`
- Fitness Goals: `/api/v1/health/fitness-goals/`
- And many more... See EXERCISE_TRACKING.md for complete list

### Frontend Components
The ExerciseTracker component at `/frontend/src/components/health/ExerciseTracker.tsx` provides a dashboard showing:
- Quick statistics
- Active fitness goals
- Recent workouts
- Personal records

### Type Definitions
All types are defined in `/frontend/src/types/health.ts`:
- Exercise, Workout, WorkoutLog
- PersonalRecord, FitnessGoal, RestDay
- ExerciseStats, ProgressiveOverload
- And more...

### API Functions
All API functions are in `/frontend/src/api.ts` under the `healthApi` object:
- `getExercises()`, `createExercise()`
- `getWorkouts()`, `createWorkout()`
- `getWorkoutLogs()`, `createWorkoutLog()`
- `getPersonalRecords()`, `createPersonalRecord()`
- `getFitnessGoals()`, `createFitnessGoal()`
- And more...

## Key Features Implemented

### 1. Exercise Database ✅
- Comprehensive catalog with categories, muscle groups, equipment
- Custom exercises supported
- Difficulty levels
- Default parameters

### 2. Workout Library ✅
- Reusable workout templates
- Exercise parameters (sets, reps, weight, rest time)
- Tags and favorites
- Multiple workout types

### 3. Workout Plans ✅
- Multi-week training programs
- Weekly and daily scheduling
- Activate and complete functionality
- Progress tracking

### 4. Exercise Logging ✅
- Set-level tracking
- Multiple metrics (reps, weight, duration, distance, heart rate, RPE)
- Special set types (warmup, dropset, failure)
- Mood tracking

### 5. Progress Tracking ✅
- Personal records (5 types)
- Comprehensive statistics
- Streak tracking
- Volume trends
- Muscle group balance

### 6. Fitness Goals ✅
- 9 goal types
- Progress tracking with milestones
- Automatic achievement detection
- Status management

### 7. Rest Days ✅
- Track rest days with reasons
- Energy and soreness tracking
- Recovery monitoring

### 8. Analytics ✅
- Workout heatmap
- Volume over time
- Muscle group balance
- Exercise statistics

## Next Steps for UI Development

1. **Exercise Library Page**
   - Browse exercises by category/muscle group
   - View exercise details with instructions
   - Create custom exercises
   - Search and filter

2. **Workout Builder**
   - Create workout templates
   - Add exercises with parameters
   - Preview and save workouts
   - Manage favorite workouts

3. **Workout Logger**
   - Start workout from template or custom
   - Log sets in real-time
   - Rest timer integration
   - Complete and review workout

4. **Progress Dashboard**
   - Statistics overview
   - Personal records display
   - Progress charts
   - Streak visualization

5. **Goal Tracker**
   - Create and manage goals
   - Update progress
   - View milestones
   - Achievement celebrations

6. **Workout Calendar**
   - View scheduled workouts
   - Plan upcoming workouts
   - Calendar heatmap
   - Weekly/monthly views

## Database Models Created

### Reference Data
- MuscleGroup (13 predefined)
- Equipment (16 predefined)

### Core Entities
- Exercise (user's exercise library)
- Workout (workout templates)
- WorkoutExercise (exercises in workout)
- ExerciseSet (individual set data)
- WorkoutLog (completed workouts)
- WorkoutPlan (multi-week programs)
- WorkoutPlanWeek (plan weeks)
- WorkoutPlanDay (plan days)

### Tracking
- PersonalRecord (PRs)
- FitnessGoal (goals)
- RestDay (recovery)
- ExerciseStats (aggregated stats)
- ProgressiveOverload (progression)

## Testing the Implementation

### 1. Test Exercise Creation
```bash
curl -X POST http://localhost:8000/api/v1/health/exercises/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bench Press",
    "category": "strength",
    "difficulty": "intermediate",
    "muscle_groups": ["chest", "triceps"],
    "equipment": ["barbell"],
    "description": "Classic chest exercise",
    "instructions": "Lie on bench, grip bar, lower to chest, press up"
  }'
```

### 2. Test Workout Creation
```bash
curl -X POST http://localhost:8000/api/v1/health/workouts/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Upper Body Day",
    "workout_type": "strength",
    "is_template": true,
    "difficulty_level": "intermediate"
  }'
```

### 3. Test Workout Log Creation
```bash
curl -X POST http://localhost:8000/api/v1/health/workout-logs/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Workout",
    "workout_type": "strength",
    "date": "2026-02-17",
    "start_time": "2026-02-17T07:00:00Z",
    "end_time": "2026-02-17T08:00:00Z",
    "intensity": 7,
    "total_sets": 12,
    "total_volume_kg": 3000,
    "total_exercises": 4
  }'
```

## Documentation Files

1. **EXERCISE_TRACKING.md** - Comprehensive feature documentation
2. **EXERCISE_IMPLEMENTATION_SUMMARY.md** - Technical implementation details
3. **QUICK_START.md** - This file

## Support

For questions or issues:
1. Check the API documentation at `/api/docs/`
2. Review the models in `/backend/apps/health/models.py`
3. Check viewsets in `/backend/apps/health/views.py`
4. Review types in `/frontend/src/types/health.ts`
