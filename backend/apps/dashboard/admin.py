from django.contrib import admin
from .models import (
    Dashboard,
    DashboardWidget,
    DashboardSnapshot,
    MetricAggregation,
    MetricComparison,
    CorrelationAnalysis,
    DashboardPreference,
    DashboardInsight,
    DashboardTemplate,
)


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'dashboard_type', 'is_default', 'created_at']
    list_filter = ['dashboard_type', 'is_default', 'is_public', 'created_at']
    search_fields = ['name', 'description', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['title', 'dashboard', 'widget_type', 'data_source', 'is_visible']
    list_filter = ['widget_type', 'data_source', 'is_visible', 'created_at']
    search_fields = ['title', 'dashboard__name']


@admin.register(DashboardSnapshot)
class DashboardSnapshotAdmin(admin.ModelAdmin):
    list_display = ['dashboard', 'generated_at', 'expires_at']
    list_filter = ['generated_at', 'expires_at']
    readonly_fields = ['id', 'generated_at']


@admin.register(MetricAggregation)
class MetricAggregationAdmin(admin.ModelAdmin):
    list_display = ['user', 'metric_name', 'data_source', 'time_period', 'period_start', 'value']
    list_filter = ['data_source', 'time_period', 'period_start']
    search_fields = ['metric_name', 'user__email']
    readonly_fields = ['id', 'created_at']


@admin.register(MetricComparison)
class MetricComparisonAdmin(admin.ModelAdmin):
    list_display = ['user', 'metric_name', 'comparison_type', 'percentage_change', 'is_positive', 'created_at']
    list_filter = ['comparison_type', 'is_positive', 'is_significant', 'created_at']
    search_fields = ['metric_name', 'user__email']
    readonly_fields = ['id', 'created_at']


@admin.register(CorrelationAnalysis)
class CorrelationAnalysisAdmin(admin.ModelAdmin):
    list_display = ['user', 'metric1_name', 'metric2_name', 'correlation_coefficient', 'correlation_strength', 'created_at']
    list_filter = ['correlation_strength', 'start_date', 'created_at']
    search_fields = ['metric1_name', 'metric2_name', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(DashboardPreference)
class DashboardPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'timezone', 'auto_refresh_enabled', 'default_time_range']
    list_filter = ['timezone', 'auto_refresh_enabled', 'compact_mode']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(DashboardInsight)
class DashboardInsightAdmin(admin.ModelAdmin):
    list_display = ['user', 'insight_type', 'severity', 'title', 'is_read', 'is_dismissed', 'created_at']
    list_filter = ['insight_type', 'severity', 'is_read', 'is_dismissed', 'created_at']
    search_fields = ['title', 'description', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(DashboardTemplate)
class DashboardTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_featured', 'is_official', 'usage_count', 'created_at']
    list_filter = ['category', 'is_featured', 'is_official', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'usage_count', 'created_at', 'updated_at']
