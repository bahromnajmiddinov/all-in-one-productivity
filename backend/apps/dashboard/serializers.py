from rest_framework import serializers
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


class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = [
            'id',
            'dashboard',
            'widget_type',
            'title',
            'data_source',
            'config',
            'x',
            'y',
            'width',
            'height',
            'order',
            'is_visible',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)
    
    class Meta:
        model = Dashboard
        fields = [
            'id',
            'user',
            'name',
            'dashboard_type',
            'description',
            'is_default',
            'is_public',
            'layout',
            'order',
            'widgets',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardCreateSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, required=False)
    
    class Meta:
        model = Dashboard
        fields = [
            'id',
            'name',
            'dashboard_type',
            'description',
            'is_default',
            'is_public',
            'layout',
            'order',
            'widgets',
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        widgets_data = validated_data.pop('widgets', [])
        dashboard = Dashboard.objects.create(**validated_data)
        
        for widget_data in widgets_data:
            DashboardWidget.objects.create(dashboard=dashboard, **widget_data)
        
        return dashboard


class DashboardSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardSnapshot
        fields = [
            'id',
            'dashboard',
            'data',
            'generated_at',
            'expires_at',
        ]
        read_only_fields = ['id', 'generated_at', 'expires_at']


class MetricAggregationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricAggregation
        fields = [
            'id',
            'user',
            'metric_name',
            'data_source',
            'time_period',
            'period_start',
            'period_end',
            'value',
            'count',
            'sum_value',
            'avg_value',
            'min_value',
            'max_value',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class MetricComparisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricComparison
        fields = [
            'id',
            'user',
            'metric_name',
            'data_source',
            'comparison_type',
            'period1_start',
            'period1_end',
            'period1_value',
            'period2_start',
            'period2_end',
            'period2_value',
            'absolute_change',
            'percentage_change',
            'is_positive',
            'is_significant',
            'context_notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CorrelationAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CorrelationAnalysis
        fields = [
            'id',
            'user',
            'metric1_name',
            'metric1_source',
            'metric2_name',
            'metric2_source',
            'correlation_coefficient',
            'correlation_strength',
            'p_value',
            'sample_size',
            'confidence_interval_low',
            'confidence_interval_high',
            'start_date',
            'end_date',
            'insights',
            'recommendations',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardPreference
        fields = [
            'id',
            'user',
            'timezone',
            'date_format',
            'default_dashboard',
            'auto_refresh_enabled',
            'auto_refresh_interval',
            'default_chart_type',
            'show_trend_lines',
            'show_data_labels',
            'compact_mode',
            'widgets_per_row',
            'default_time_range',
            'insights_enabled',
            'anomaly_alerts_enabled',
            'weekly_summary_enabled',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardInsight
        fields = [
            'id',
            'user',
            'dashboard',
            'insight_type',
            'severity',
            'title',
            'description',
            'metric_name',
            'data_source',
            'start_date',
            'end_date',
            'current_value',
            'previous_value',
            'threshold_value',
            'confidence_score',
            'is_dismissed',
            'is_read',
            'related_widgets',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardTemplate
        fields = [
            'id',
            'name',
            'category',
            'description',
            'thumbnail',
            'widgets',
            'layout',
            'is_featured',
            'is_official',
            'usage_count',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
