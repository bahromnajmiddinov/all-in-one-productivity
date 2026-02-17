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
