from django.contrib import admin
from .models import (
    CrossModuleCorrelation,
    AutomatedReport,
    TrendDetection,
    AnomalyDetection,
    GoalProgress,
    PredictiveForecast,
    PeriodComparison,
    CustomReport,
    AchievementBadge,
    UserAchievement,
    AnalyticsExport,
    AnalyticsInsight,
    UserAnalyticsProfile,
)


@admin.register(CrossModuleCorrelation)
class CrossModuleCorrelationAdmin(admin.ModelAdmin):
    list_display = ['user', 'source_module', 'target_module', 'correlation_coefficient', 'correlation_strength', 'created_at']
    list_filter = ['source_module', 'target_module', 'correlation_strength', 'created_at']
    search_fields = ['user__email', 'source_metric', 'target_metric']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(AutomatedReport)
class AutomatedReportAdmin(admin.ModelAdmin):
    list_display = ['user', 'report_type', 'title', 'status', 'start_date', 'end_date', 'is_read']
    list_filter = ['report_type', 'status', 'is_read', 'created_at']
    search_fields = ['user__email', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(TrendDetection)
class TrendDetectionAdmin(admin.ModelAdmin):
    list_display = ['user', 'module', 'metric_name', 'trend_direction', 'trend_period', 'is_significant', 'created_at']
    list_filter = ['module', 'trend_direction', 'trend_period', 'is_significant', 'created_at']
    search_fields = ['user__email', 'metric_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(AnomalyDetection)
class AnomalyDetectionAdmin(admin.ModelAdmin):
    list_display = ['user', 'module', 'anomaly_type', 'severity', 'detected_date', 'is_dismissed']
    list_filter = ['module', 'anomaly_type', 'severity', 'is_dismissed', 'created_at']
    search_fields = ['user__email', 'title', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(GoalProgress)
class GoalProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'source_module', 'goal_name', 'progress_percentage', 'status', 'target_date']
    list_filter = ['source_module', 'status', 'is_aggregate']
    search_fields = ['user__email', 'goal_name']


@admin.register(PredictiveForecast)
class PredictiveForecastAdmin(admin.ModelAdmin):
    list_display = ['user', 'module', 'metric_name', 'forecast_period', 'trend_direction', 'status', 'generated_at']
    list_filter = ['module', 'forecast_period', 'trend_direction', 'status', 'generated_at']
    search_fields = ['user__email', 'metric_name']
    readonly_fields = ['id', 'generated_at']


@admin.register(PeriodComparison)
class PeriodComparisonAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'period1_label', 'period2_label', 'overall_winner', 'created_at']
    list_filter = ['overall_winner', 'created_at']
    search_fields = ['user__email', 'name']
    readonly_fields = ['id', 'created_at']


@admin.register(CustomReport)
class CustomReportAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'format', 'is_favorite', 'generated_at', 'created_at']
    list_filter = ['format', 'is_favorite', 'is_scheduled', 'created_at']
    search_fields = ['user__email', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(AchievementBadge)
class AchievementBadgeAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'category', 'level', 'criteria_type', 'criteria_value', 'order']
    list_filter = ['category', 'level', 'is_hidden']
    search_fields = ['name', 'display_name', 'description']
    ordering = ['category', 'level', 'order']


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'progress_percentage', 'is_earned', 'earned_at']
    list_filter = ['is_earned', 'badge__category', 'badge__level']
    search_fields = ['user__email', 'badge__display_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(AnalyticsExport)
class AnalyticsExportAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'export_format', 'export_scope', 'status', 'requested_at']
    list_filter = ['export_format', 'export_scope', 'status', 'requested_at']
    search_fields = ['user__email', 'name']
    readonly_fields = ['id', 'requested_at', 'started_at', 'completed_at']


@admin.register(AnalyticsInsight)
class AnalyticsInsightAdmin(admin.ModelAdmin):
    list_display = ['user', 'insight_type', 'severity', 'title', 'is_read', 'is_dismissed', 'created_at']
    list_filter = ['insight_type', 'severity', 'is_read', 'is_dismissed', 'created_at']
    search_fields = ['user__email', 'title', 'description']
    readonly_fields = ['id', 'created_at']


@admin.register(UserAnalyticsProfile)
class UserAnalyticsProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_data_points', 'current_streak_days', 'total_badges_earned', 'calculated_at']
    search_fields = ['user__email']
    readonly_fields = ['calculated_at']
