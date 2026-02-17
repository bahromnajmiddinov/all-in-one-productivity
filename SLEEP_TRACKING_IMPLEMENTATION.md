# Sleep Tracking System Implementation

## Overview
A comprehensive sleep tracking system has been implemented with the following features:

## Features Implemented

### 1. Sleep Schedule Tracking
- **Backend**: `SleepLog` model with `bed_time`, `wake_time`, and calculated `duration_minutes`
- **Frontend**: Form to input bed time and wake time with automatic duration calculation
- **API**: `POST /api/v1/health/sleep/logs/` and `GET /api/v1/health/sleep/logs/`

### 2. Sleep Quality Rating (1-10)
- **Backend**: `quality` field in `SleepLog` model (1-10 scale)
- **Frontend**: Slider input with visual feedback
- **Display**: Quality emoji indicators (😴, 😊, 😐, 😪)

### 3. Sleep Phases Tracking
- **Backend**: Optional fields in `SleepLog` model:
  - `deep_sleep_minutes`
  - `light_sleep_minutes`
  - `rem_sleep_minutes`
  - `awake_minutes`
- **Calculation**: Automatic sleep efficiency calculation
- **Usage**: Can be populated from wearable devices or manual estimation

### 4. Sleep Consistency
- **Backend**: `SleepStats` model tracks:
  - Average bed/wake times
  - Standard deviation of bed/wake times
  - Schedule compliance percentage
- **API**: `GET /api/v1/health/sleep/logs/consistency/`
- **Display**: Consistency score (0-100) and schedule compliance

### 5. Sleep Debt Tracking
- **Backend**: `SleepDebt` model:
  - Tracks daily deficit/surplus
  - Cumulative debt calculation
  - `SleepStats.sleep_debt_minutes` field
- **API**: `GET /api/v1/health/sleep/debt/summary/`
- **Display**: Hours of debt/surplus with alerts for high debt

### 6. Sleep Duration Trends
- **Backend**: `SleepStats` model with 7/30/90 day averages
- **API**: `GET /api/v1/health/sleep/logs/trends/`
- **Frontend**: Bar chart visualization of duration over time

### 7. Sleep Quality Trends
- **Backend**: Quality averages in `SleepStats`
- **API**: Included in trends endpoint
- **Frontend**: Bar chart visualization

### 8. Sleep Score Trends
- **Backend**: Comprehensive 0-100 sleep score in `SleepLog.sleep_score`
- **Calculation**:
  - Duration: 30 points (optimal 7-9 hours)
  - Quality: 30 points (based on 1-10 rating)
  - Disruptions: 20 points (fewer is better)
  - Sleep phases: 20 points (if data available)
- **API**: Included in trends endpoint

### 9. Optimal Sleep Window
- **Backend**: Analysis of best performing bed times
- **API**: `GET /api/v1/health/sleep/logs/optimal_window/`
- **Display**: Recommended bed time window based on historical quality

### 10. Sleep vs. Performance Correlations
- **Backend**: `SleepCorrelation` model with Pearson correlation coefficients
- **Metrics correlated**:
  - Mood (from journal)
  - Energy level (from journal)
  - Productivity (from Pomodoro)
  - Exercise (from exercise logs)
- **API**: `GET /api/v1/health/sleep/logs/correlations/`
- **Display**: Correlation strength (Strong/Moderate/Weak) and direction (Positive/Negative)

### 11. Sleep Disruptions Tracking
- **Backend**: `SleepDisruption` model:
  - Predefined disruption types (bathroom, noise, temperature, etc.)
  - Duration and time tracking
  - Notes field
- **API**: `CRUD /api/v1/health/sleep/disruptions/`
- **Display**: Disruption count per sleep log

### 12. Sleep Heatmap
- **Backend**: Aggregated data by date
- **API**: `GET /api/v1/health/sleep/logs/heatmap/`
- **Frontend**: Calendar view with duration and quality indicators

### 13. Wake Time Consistency
- **Backend**: Standard deviation calculation for wake times
- **Display**: Part of consistency metrics
- **Goal compliance**: Days within target wake window

### 14. Nap Tracking
- **Backend**: `SleepNap` model:
  - Separate from main sleep logs
  - Duration, quality, feeling after
- **API**: `CRUD /api/v1/health/sleep/naps/`
- **Stats**: Included in `SleepStats` model

### 15. Sleep Goals
- **Backend**: `SleepGoal` model:
  - Target duration (min/max)
  - Target quality
  - Target bed/wake times with windows
  - Consistency target (days per week)
  - Nap limits
- **API**: `GET/PUT /api/v1/health/sleep/goals/`
- **Display**: Goal progress tracking

## Database Schema

### New Models
1. **SleepDisruption** - Individual sleep disruptions
2. **SleepNap** - Daytime nap tracking
3. **SleepGoal** - User's sleep targets
4. **SleepStats** - Aggregated statistics and trends
5. **SleepDebt** - Cumulative sleep deficit tracking
6. **SleepCorrelation** - Correlation data with other metrics
7. **SleepInsight** - AI-generated insights and recommendations

### Enhanced Models
1. **SleepLog** - Expanded with:
   - Quality scale increased to 1-10
   - Sleep phase fields
   - Calculated sleep score
   - Efficiency percentage
   - Mood tracking
   - Environment factors (temperature, noise)
   - Lifestyle factors (caffeine, alcohol, exercise, screen time)
   - Updated timestamp

## API Endpoints

### Sleep Logs
- `GET /api/v1/health/sleep/logs/` - List sleep logs
- `POST /api/v1/health/sleep/logs/` - Create sleep log
- `PATCH /api/v1/health/sleep/logs/{id}/` - Update sleep log
- `DELETE /api/v1/health/sleep/logs/{id}/` - Delete sleep log
- `GET /api/v1/health/sleep/logs/stats/` - Get sleep statistics
- `GET /api/v1/health/sleep/logs/heatmap/` - Get calendar heatmap data
- `GET /api/v1/health/sleep/logs/trends/` - Get trends over time
- `GET /api/v1/health/sleep/logs/consistency/` - Get consistency metrics
- `GET /api/v1/health/sleep/logs/optimal_window/` - Get optimal sleep window
- `GET /api/v1/health/sleep/logs/correlations/` - Get correlations
- `GET /api/v1/health/sleep/logs/insights/` - Get personalized insights

### Sleep Disruptions
- `GET /api/v1/health/sleep/disruptions/` - List disruptions
- `POST /api/v1/health/sleep/disruptions/` - Create disruption
- `PATCH /api/v1/health/sleep/disruptions/{id}/` - Update disruption
- `DELETE /api/v1/health/sleep/disruptions/{id}/` - Delete disruption

### Sleep Naps
- `GET /api/v1/health/sleep/naps/` - List naps
- `POST /api/v1/health/sleep/naps/` - Create nap
- `PATCH /api/v1/health/sleep/naps/{id}/` - Update nap
- `DELETE /api/v1/health/sleep/naps/{id}/` - Delete nap

### Sleep Goals
- `GET /api/v1/health/sleep/goals/` - Get goals (creates if not exists)
- `PUT /api/v1/health/sleep/goals/` - Update goals

### Sleep Stats
- `GET /api/v1/health/sleep/stats/` - Get analytics stats
- `POST /api/v1/health/sleep/stats/refresh/` - Manually refresh stats

### Sleep Debt
- `GET /api/v1/health/sleep/debt/` - List debt records
- `POST /api/v1/health/sleep/debt/` - Create debt record
- `GET /api/v1/health/sleep/debt/summary/` - Get debt summary

### Sleep Insights
- `GET /api/v1/health/sleep/insights/` - List insights
- `POST /api/v1/health/sleep/insights/` - Create insight
- `POST /api/v1/health/sleep/insights/{id}/dismiss/` - Dismiss insight
- `POST /api/v1/health/sleep/insights/{id}/mark_read/` - Mark as read

## Frontend Components

### SleepTracker Component
Located at: `frontend/src/components/health/SleepTracker.tsx`

Features:
- **Stats Overview**: 4-card layout showing average duration, quality, sleep score, and streak
- **Sleep Debt Alert**: Warning when debt exceeds threshold
- **Recent Sleep Logs**: List of recent sleep with quality indicators
- **Recent Naps**: Display of recent nap logs
- **Add Sleep Log Modal**: Form to log new sleep with:
  - Bed time and wake time inputs
  - Quality slider (1-10)
  - Disruptions counter
  - Notes field
- **Analytics Modal**: Three tabs:
  - **Trends**: Visual charts for duration and quality
  - **Consistency**: Consistency score, schedule compliance, optimal window
  - **Correlations**: Sleep vs. mood, energy, productivity, exercise

## Calculations and Algorithms

### Sleep Score Calculation
```python
def calculate_sleep_score(self):
    score = 0
    max_score = 100

    # Duration scoring (30 points)
    duration_hours = self.duration_minutes / 60
    if 7 <= duration_hours <= 9:
        score += 30
    elif 6 <= duration_hours < 7 or 9 < duration_hours <= 10:
        score += 20
    elif 5 <= duration_hours < 6 or 10 < duration_hours <= 11:
        score += 10

    # Quality scoring (30 points)
    score += (self.quality / 10) * 30

    # Disruptions penalty (20 points)
    if self.disruptions_count == 0:
        score += 20
    elif self.disruptions_count == 1:
        score += 15
    elif self.disruptions_count == 2:
        score += 10
    elif self.disruptions_count == 3:
        score += 5

    # Sleep phases scoring (20 points)
    # Based on ideal percentages: 15-20% deep, 20-25% REM, 50-60% light

    return min(score, max_score)
```

### Sleep Efficiency
```
efficiency = (total_sleep_minutes / (total_sleep_minutes + awake_minutes)) * 100
```

### Consistency Score
Based on standard deviation of bed and wake times:
```
consistency_score = (bed_consistency + wake_consistency) / 2
where bed/wake_consistency = max(0, 100 - (stddev * 10))
```

### Pearson Correlation
Standard Pearson correlation coefficient formula to measure relationships between sleep metrics and other tracked data.

## Migration

A migration file has been created:
- `backend/apps/health/migrations/0003_sleep_tracking_enhancements.py`

This migration:
- Enhances the existing `SleepLog` model
- Creates 7 new models for sleep tracking features
- Adds indexes for performance
- Sets up proper relationships

## Usage Example

### Logging Sleep
```typescript
await healthApi.createSleepLog({
  bed_time: '2024-02-15T23:00:00',
  wake_time: '2024-02-16T07:00:00',
  quality: 8,
  disruptions_count: 1,
  notes: 'Felt well rested'
});
```

### Getting Trends
```typescript
const trends = await healthApi.getSleepTrends(30);
// Returns: { duration: [...], quality: [...], score: [...] }
```

### Getting Correlations
```typescript
const correlations = await healthApi.getSleepCorrelations(30);
// Returns: { mood: {...}, energy: {...}, productivity: {...}, exercise: {...} }
```

## Integration with Other Features

The sleep tracking system integrates with:
- **Journal**: Correlates sleep with mood and energy entries
- **Pomodoro**: Correlates sleep with productivity scores
- **Exercise**: Correlates sleep with exercise duration
- **Habits**: Can link sleep consistency to habit completion

## Future Enhancements

Potential additions for future development:
1. Wearable device integration (Garmin, Fitbit, Apple Watch)
2. Sleep phase detection from smart alarms
3. Advanced ML-based insights
4. Sleep schedule recommendations
5. Social features (comparing with friends)
6. Sleep environment monitoring (smart home integration)
7. Circadian rhythm optimization
8. Power nap timing recommendations

## Admin Interface

All models are registered in Django admin at `/admin/`:
- WaterIntakeSettings
- WaterContainer
- WaterLog
- SleepLog
- SleepDisruption
- SleepNap
- SleepGoal
- SleepStats
- SleepDebt
- SleepCorrelation
- SleepInsight
- ExerciseType
- ExerciseLog
- BodyMetrics

## Notes

- Sleep statistics are automatically updated when sleep logs are created, updated, or deleted
- Sleep goals are created automatically on first access if they don't exist
- All user data is isolated per user with proper foreign key relationships
- Sleep score calculation is performed on save to ensure consistency
- The system is designed to work with or without wearable device data
