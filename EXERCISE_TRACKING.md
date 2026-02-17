# Exercise Planning & Tracking Features

This document describes the comprehensive Exercise Planning & Tracking system implemented in the Health module.

## Features Implemented

### 1. Exercise Database
Comprehensive exercise catalog with detailed information:
- **Exercise Name & Description**: Clear identification and usage instructions
- **Exercise Categories**: Strength, Cardio, Flexibility, HIIT, Plyometric, Balance, Functional, Rehabilitation
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Muscle Groups**: Targeted muscles for each exercise (Chest, Back, Shoulders, Biceps, Triceps, etc.)
- **Equipment Requirements**: What equipment is needed (Dumbbells, Barbell, Cables, etc.)
- **Exercise Type**: Compound vs Isolation exercises
- **Default Parameters**: Suggested sets, reps, duration, and rest times
- **Media Support**: Image and video URLs for exercise demonstrations
- **Custom Exercises**: Users can create their own exercises
- **System Exercises**: Pre-built exercises available to all users

### 2. Workout Library
Create and manage workout templates:
- **Workout Templates**: Save frequently used workouts for quick logging
- **Workout Types**: Strength, Cardio, HIIT, Flexibility, Mixed, Custom
- **Difficulty Levels**: Match workout difficulty to user's fitness level
- **Exercise Selection**: Add multiple exercises with specific parameters
- **Exercise Parameters**:
  - Sets and reps
  - Rep ranges (e.g., 8-12)
  - Duration for timed exercises
  - Distance for cardio
  - Weight for strength training
  - Rest time between exercises
- **Tags**: Organize workouts with custom tags
- **Favorites**: Mark frequently used workouts as favorites
- **Estimated Duration**: Time estimate for planning

### 3. Exercise Logging
Detailed tracking of workout sessions:
- **Set-Level Tracking**: Log each set individually
- **Performance Metrics**:
  - Reps and weight
  - Duration for cardio
  - Distance for running/cycling
  - Rate of Perceived Exertion (RPE)
  - Heart rate monitoring
  - Calories burned
- **Set Types**:
  - Regular sets
  - Warmup sets
  - Drop sets
  - Failure sets
- **Notes per Set**: Add specific notes for each set

### 4. Workout Logging
Complete workout session tracking:
- **Workout Details**: Name, type, date, start/end time
- **Duration Tracking**: Automatic calculation from start/end times
- **Intensity Rating**: 1-10 scale for workout difficulty
- **Heart Rate**: Average and maximum heart rate
- **Totals**: Auto-calculated totals for sets, volume, exercises
- **Mood Tracking**: Pre- and post-workout mood (1-10)
- **Workout Templates**: Link to workout templates for consistency
- **Notes**: General workout notes

### 5. Workout Plans
Multi-week training programs with progression:
- **Plan Duration**: Define number of weeks
- **Weekly Structure**: Set workouts per week
- **Week-by-Week Scheduling**: Plan each week separately
- **Daily Workouts**: Assign specific workouts to each day
- **Schedule**: Set start and end dates
- **Plan Status**: Track active, completed, and abandoned plans
- **Activation**: Mark a plan as active
- **Completion**: Mark plans as completed

### 6. Progress Tracking

#### Personal Records (PRs)
Track personal bests across different metrics:
- **Heaviest Weight**: Maximum weight lifted for an exercise
- **Most Reps**: Maximum repetitions performed
- **Fastest Time**: Best time for timed exercises
- **Longest Distance**: Maximum distance for cardio
- **Highest Volume**: Maximum total volume (sets × reps × weight)
- **Record History**: Maintain history of all records
- **Active/Inactive**: Track current vs beaten records

#### Exercise Statistics
Comprehensive workout statistics:
- **Total Workouts**: Lifetime workout count
- **Streak Tracking**: Current and best streaks
- **Duration Stats**: Average workout duration (30-day, 90-day)
- **Volume Tracking**: Total and average volume lifted
- **Calories Burned**: Total calories burned
- **Exercise Counts**: Breakdown by exercise
- **Muscle Group Balance**: Training distribution across muscle groups
- **Last Workout**: When was the last workout

#### Progressive Overload
Track consistent progression:
- **Baseline Tracking**: Record starting point
- **Current Performance**: Track current numbers
- **Progress Metrics**:
  - Weight increase (kg)
  - Rep increase
  - Progress percentage
- **On Track Status**: Evaluate if progression is adequate

### 7. Body Measurements
Track physical changes:
- **Weight**: Body weight in kg
- **Body Fat Percentage**: Track body composition
- **Measurements**: Chest, waist, hips (cm)
- **Weight Change**: Automatic calculation of weight changes
- **History**: Maintain measurement history over time

### 8. Fitness Goals
Set and track fitness objectives:
- **Goal Types**:
  - Weight Loss
  - Weight Gain
  - Strength
  - Endurance
  - Muscle Mass
  - Body Fat Percentage
  - Running/Cycling Distance
  - Workout Frequency
  - Custom Goals
- **Goal Status**: Not Started, In Progress, Paused, Completed, Abandoned
- **Target Setting**: Define target values
- **Progress Tracking**: Update current values
- **Milestones**: Define intermediate goals
- **Achievement Tracking**: Mark goals as achieved
- **Progress Percentage**: Automatic progress calculation

### 9. Rest Day Tracking
Monitor recovery and rest:
- **Rest Reasons**:
  - Scheduled Rest
  - Recovery Needed
  - Injury
  - Illness
  - Too Busy
  - Traveling
  - Other
- **Energy Level**: Track energy on rest days (1-10)
- **Muscle Soreness**: Track recovery status (1-10)
- **Notes**: Additional observations

### 10. Analytics & Visualization

#### Workout Heatmap
Visual representation of workout frequency over time
- Color-coded intensity
- Duration information
- 90-day default view

#### Volume Trends
Track exercise volume over time
- Daily volume tracking
- Exercise count per day
- 30-day default view

#### Muscle Group Balance
Ensure balanced training across muscle groups
- Percentage distribution
- Workout count per muscle group
- Identify imbalances

## API Endpoints

### Exercise Database
- `GET /api/v1/health/muscle-groups/` - List all muscle groups
- `GET /api/v1/health/equipment/` - List all equipment types
- `GET /api/v1/health/exercises/` - List user's exercises
- `POST /api/v1/health/exercises/` - Create new exercise
- `GET /api/v1/health/exercises/{id}/` - Get exercise details
- `PATCH /api/v1/health/exercises/{id}/` - Update exercise
- `DELETE /api/v1/health/exercises/{id}/` - Delete exercise

### Workouts
- `GET /api/v1/health/workouts/` - List user's workouts
- `POST /api/v1/health/workouts/` - Create new workout
- `GET /api/v1/health/workouts/{id}/` - Get workout details
- `PUT /api/v1/health/workouts/{id}/` - Update workout
- `DELETE /api/v1/health/workouts/{id}/` - Delete workout
- `GET /api/v1/health/workout-exercises/` - List exercises in a workout
- `POST /api/v1/health/workout-exercises/` - Add exercise to workout
- `PUT /api/v1/health/workout-exercises/{id}/` - Update workout exercise
- `DELETE /api/v1/health/workout-exercises/{id}/` - Remove exercise from workout

### Workout Logs
- `GET /api/v1/health/workout-logs/` - List workout logs
- `POST /api/v1/health/workout-logs/` - Create new workout log
- `GET /api/v1/health/workout-logs/{id}/` - Get workout log details
- `PATCH /api/v1/health/workout-logs/{id}/` - Update workout log
- `DELETE /api/v1/health/workout-logs/{id}/` - Delete workout log
- `GET /api/v1/health/workout-logs/heatmap/` - Get workout heatmap data
- `GET /api/v1/health/workout-logs/volume_over_time/` - Get volume trends
- `GET /api/v1/health/workout-logs/muscle_group_balance/` - Get muscle group balance

### Exercise Sets
- `GET /api/v1/health/exercise-sets/` - List exercise sets
- `POST /api/v1/health/exercise-sets/` - Create new exercise set
- `PATCH /api/v1/health/exercise-sets/{id}/` - Update exercise set
- `DELETE /api/v1/health/exercise-sets/{id}/` - Delete exercise set

### Workout Plans
- `GET /api/v1/health/workout-plans/` - List workout plans
- `POST /api/v1/health/workout-plans/` - Create new workout plan
- `GET /api/v1/health/workout-plans/{id}/` - Get workout plan details
- `PUT /api/v1/health/workout-plans/{id}/` - Update workout plan
- `DELETE /api/v1/health/workout-plans/{id}/` - Delete workout plan
- `POST /api/v1/health/workout-plans/{id}/activate/` - Activate workout plan
- `POST /api/v1/health/workout-plans/{id}/complete/` - Mark plan as completed

### Personal Records
- `GET /api/v1/health/personal-records/` - List personal records
- `POST /api/v1/health/personal-records/` - Create new personal record
- `PUT /api/v1/health/personal-records/{id}/` - Update personal record
- `DELETE /api/v1/health/personal-records/{id}/` - Delete personal record
- `GET /api/v1/health/personal-records/by_exercise/` - Get records grouped by exercise

### Fitness Goals
- `GET /api/v1/health/fitness-goals/` - List fitness goals
- `POST /api/v1/health/fitness-goals/` - Create new fitness goal
- `GET /api/v1/health/fitness-goals/{id}/` - Get fitness goal details
- `PUT /api/v1/health/fitness-goals/{id}/` - Update fitness goal
- `DELETE /api/v1/health/fitness-goals/{id}/` - Delete fitness goal
- `POST /api/v1/health/fitness-goals/{id}/update_progress/` - Update goal progress
- `GET /api/v1/health/fitness-goals/active/` - Get active goals

### Rest Days
- `GET /api/v1/health/rest-days/` - List rest days
- `POST /api/v1/health/rest-days/` - Create new rest day
- `PUT /api/v1/health/rest-days/{id}/` - Update rest day
- `DELETE /api/v1/health/rest-days/{id}/` - Delete rest day

### Exercise Stats
- `GET /api/v1/health/exercise-stats/` - Get exercise statistics
- `POST /api/v1/health/exercise-stats/refresh/` - Refresh statistics

### Progressive Overload
- `GET /api/v1/health/progressive-overload/` - List progressive overload tracking
- `POST /api/v1/health/progressive-overload/` - Create new tracking entry
- `PUT /api/v1/health/progressive-overload/{id}/` - Update tracking entry

## Data Models

### Core Models
- **MuscleGroup**: Reference table for muscle groups
- **Equipment**: Reference table for equipment types
- **Exercise**: Comprehensive exercise database
- **Workout**: Workout templates
- **WorkoutExercise**: Exercises within a workout
- **ExerciseSet**: Individual set logging
- **WorkoutLog**: Completed workout sessions
- **WorkoutPlan**: Multi-week training programs
- **WorkoutPlanWeek**: Weeks within a plan
- **WorkoutPlanDay**: Days within a week

### Tracking Models
- **PersonalRecord**: Personal best achievements
- **FitnessGoal**: Fitness objectives
- **RestDay**: Recovery tracking
- **ExerciseStats**: Aggregated statistics
- **ProgressiveOverload**: Progression tracking

## Frontend Components

### ExerciseTracker
Main dashboard component showing:
- Quick stats (workouts, streak, volume, calories)
- Active fitness goals with progress
- Recent workouts
- Personal records
- Last workout information

## Usage Examples

### Creating a Workout
1. Create exercises with muscle groups and equipment
2. Create a workout template
3. Add exercises with sets, reps, weight, and rest times
4. Save as template for future use

### Logging a Workout
1. Start a new workout log
2. Link to a workout template (optional)
3. Log each set with actual performance
4. Add notes and mood ratings
5. Finish workout

### Setting Goals
1. Create a fitness goal (e.g., lose 5kg)
2. Set target date and milestones
3. Update progress regularly
4. Track completion

### Tracking Progression
1. Log workouts consistently
2. System tracks progressive overload automatically
3. View personal records as you improve
4. Analyze muscle group balance
5. Adjust training based on insights

## Best Practices

1. **Consistency**: Log workouts regularly to get accurate stats
2. **Templates**: Use workout templates for consistent training
3. **Goals**: Set specific, measurable goals with deadlines
4. **Progressive Overload**: Gradually increase weight or reps
5. **Rest Days**: Track rest days to monitor recovery
6. **Muscle Balance**: Review muscle group balance regularly
7. **Personal Records**: Celebrate PRs to stay motivated

## Future Enhancements

Potential improvements:
- Exercise recommendations based on goals
- AI-powered workout suggestions
- Integration with wearable devices
- Social sharing of achievements
- Workout calendar visualization
- Advanced analytics and insights
- Exercise video library
- Community workout sharing
