from django.contrib import admin
from .models import (
    WaterIntakeSettings,
    WaterContainer,
    WaterLog,
    SleepLog,
    SleepDisruption,
    SleepNap,
    SleepGoal,
    SleepStats,
    SleepDebt,
    SleepCorrelation,
    SleepInsight,
    ExerciseType,
    ExerciseLog,
    BodyMetrics,
    MuscleGroup,
    Equipment,
    Exercise,
    Workout,
    WorkoutExercise,
    ExerciseSet,
    WorkoutLog,
    WorkoutPlan,
    WorkoutPlanWeek,
    WorkoutPlanDay,
    PersonalRecord,
    FitnessGoal,
    RestDay,
    ExerciseStats,
    ProgressiveOverload,
)


@admin.register(WaterIntakeSettings)
class WaterIntakeSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'daily_goal_ml', 'reminder_enabled']
    list_filter = ['reminder_enabled', 'smart_reminders_enabled', 'activity_level']


@admin.register(WaterContainer)
class WaterContainerAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'volume_ml', 'is_favorite']
    list_filter = ['is_favorite']


@admin.register(WaterLog)
class WaterLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount_ml', 'container', 'date', 'logged_at']
    list_filter = ['date']
    date_hierarchy = 'logged_at'


@admin.register(SleepLog)
class SleepLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'bed_time', 'wake_time', 'duration_minutes', 'quality', 'sleep_score']
    list_filter = ['date', 'quality', 'noise_level', 'alcohol_before_sleep']
    date_hierarchy = 'date'
    readonly_fields = ['sleep_score', 'efficiency_percent', 'created_at', 'updated_at']


@admin.register(SleepDisruption)
class SleepDisruptionAdmin(admin.ModelAdmin):
    list_display = ['sleep_log', 'disruption_type', 'time', 'duration_minutes']
    list_filter = ['disruption_type']


@admin.register(SleepNap)
class SleepNapAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'start_time', 'duration_minutes', 'quality', 'feeling_after']
    list_filter = ['date', 'feeling_after']
    date_hierarchy = 'date'


@admin.register(SleepGoal)
class SleepGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'target_duration_minutes', 'target_quality', 'target_bed_time', 'target_wake_time']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SleepStats)
class SleepStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_logs', 'current_streak', 'best_streak', 'sleep_debt_minutes']
    readonly_fields = ['user', 'total_logs', 'current_streak', 'best_streak', 'sleep_debt_minutes', 'updated_at']


@admin.register(SleepDebt)
class SleepDebtAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'debt_minutes', 'target_minutes', 'actual_minutes']
    list_filter = ['date']
    date_hierarchy = 'date'


@admin.register(SleepCorrelation)
class SleepCorrelationAdmin(admin.ModelAdmin):
    list_display = ['user', 'correlation_type', 'duration_correlation', 'quality_correlation', 'score_correlation', 'data_points']
    list_filter = ['correlation_type']


@admin.register(SleepInsight)
class SleepInsightAdmin(admin.ModelAdmin):
    list_display = ['user', 'insight_type', 'title', 'priority', 'is_read', 'is_dismissed', 'created_at']
    list_filter = ['insight_type', 'priority', 'is_read', 'is_dismissed']
    date_hierarchy = 'created_at'


@admin.register(ExerciseType)
class ExerciseTypeAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'category', 'is_default']
    list_filter = ['category', 'is_default']


@admin.register(ExerciseLog)
class ExerciseLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'exercise_type', 'duration_minutes', 'calories_burned']
    list_filter = ['date']
    date_hierarchy = 'date'


@admin.register(BodyMetrics)
class BodyMetricsAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'weight_kg', 'body_fat_percentage']
    date_hierarchy = 'date'


@admin.register(MuscleGroup)
class MuscleGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name']
    ordering = ['name']


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'icon']
    ordering = ['name']


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'category', 'difficulty', 'is_system', 'is_favorite']
    list_filter = ['category', 'difficulty', 'is_system', 'is_favorite', 'is_compound', 'is_isolation']
    filter_horizontal = ['muscle_groups', 'equipment']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'workout_type', 'is_template', 'is_favorite', 'created_at']
    list_filter = ['workout_type', 'is_template', 'is_favorite', 'difficulty_level']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WorkoutExercise)
class WorkoutExerciseAdmin(admin.ModelAdmin):
    list_display = ['workout', 'exercise', 'order', 'sets', 'reps']
    list_filter = ['workout__workout_type']


@admin.register(ExerciseSet)
class ExerciseSetAdmin(admin.ModelAdmin):
    list_display = ['user', 'exercise', 'set_number', 'reps', 'weight_kg', 'completed_at']
    list_filter = ['is_warmup', 'is_dropset', 'is_failure_set']
    date_hierarchy = 'completed_at'


@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'date', 'duration_minutes', 'intensity', 'total_volume_kg']
    list_filter = ['date', 'workout_type', 'intensity']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WorkoutPlan)
class WorkoutPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'weeks', 'workouts_per_week', 'is_active', 'is_completed']
    list_filter = ['is_active', 'is_completed']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WorkoutPlanWeek)
class WorkoutPlanWeekAdmin(admin.ModelAdmin):
    list_display = ['plan', 'week_number']


@admin.register(WorkoutPlanDay)
class WorkoutPlanDayAdmin(admin.ModelAdmin):
    list_display = ['week', 'day_of_week', 'workout']


@admin.register(PersonalRecord)
class PersonalRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'exercise', 'record_type', 'date', 'is_active']
    list_filter = ['record_type', 'is_active']
    date_hierarchy = 'date'


@admin.register(FitnessGoal)
class FitnessGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'goal_type', 'status', 'start_date', 'target_date', 'is_achieved']
    list_filter = ['goal_type', 'status', 'is_active', 'is_achieved']
    date_hierarchy = 'start_date'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RestDay)
class RestDayAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'reason', 'energy_level', 'muscle_soreness']
    list_filter = ['reason']
    date_hierarchy = 'date'


@admin.register(ExerciseStats)
class ExerciseStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_workouts', 'current_streak', 'best_streak', 'total_duration_minutes', 'last_workout_date']
    readonly_fields = ['user', 'total_workouts', 'current_streak', 'best_streak', 'total_duration_minutes', 'total_volume_kg', 'total_calories_burned', 'last_workout_date', 'updated_at']


@admin.register(ProgressiveOverload)
class ProgressiveOverloadAdmin(admin.ModelAdmin):
    list_display = ['user', 'exercise', 'progress_percentage', 'is_on_track', 'updated_at']
    readonly_fields = ['updated_at']
