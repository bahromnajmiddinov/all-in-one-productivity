from rest_framework import serializers
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


class CrossModuleCorrelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrossModuleCorrelation
        fields = [
            'id',
            'source_module',
            'source_metric',
            'target_module',
            'target_metric',
            'correlation_coefficient',
            'correlation_strength',
            'confidence_score',
            'sample_size',
            'status',
            'start_date',
            'end_date',
            'insight_title',
            'insight_description',
            'action_recommendations',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AutomatedReportListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomatedReport
        fields = [
            'id',
            'report_type',
            'title',
            'status',
            'start_date',
            'end_date',
            'is_read',
            'generated_at',
            'created_at',
        ]


class AutomatedReportDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomatedReport
        fields = [
            'id',
            'report_type',
            'title',
            'status',
            'start_date',
            'end_date',
            'summary_text',
            'key_highlights',
            'key_lowlights',
            'module_summaries',
            'improving_metrics',
            'declining_metrics',
            'stable_metrics',
            'insights',
            'recommendations',
            'comparison_data',
            'is_read',
            'generated_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TrendDetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendDetection
        fields = [
            'id',
            'module',
            'metric_name',
            'metric_display_name',
            'trend_direction',
            'trend_period',
            'start_value',
            'end_value',
            'change_absolute',
            'change_percentage',
            'confidence_score',
            'volatility_index',
            'start_date',
            'end_date',
            'trend_data',
            'is_significant',
            'is_acknowledged',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnomalyDetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnomalyDetection
        fields = [
            'id',
            'module',
            'metric_name',
            'anomaly_type',
            'severity',
            'detected_date',
            'expected_value',
            'actual_value',
            'deviation_percentage',
            'baseline_average',
            'baseline_std_dev',
            'title',
            'description',
            'possible_causes',
            'related_entries',
            'is_read',
            'is_dismissed',
            'is_investigated',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GoalProgressSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = GoalProgress
        fields = [
            'id',
            'source_module',
            'source_goal_id',
            'goal_name',
            'goal_description',
            'target_value',
            'current_value',
            'progress_percentage',
            'start_date',
            'target_date',
            'unit',
            'status',
            'status_display',
            'progress_history',
            'projected_completion',
            'days_remaining',
            'is_aggregate',
            'sub_goals',
            'last_synced',
        ]
        read_only_fields = ['id', 'last_synced']


class PredictiveForecastSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictiveForecast
        fields = [
            'id',
            'module',
            'metric_name',
            'forecast_period',
            'forecast_values',
            'trend_direction',
            'model_accuracy',
            'confidence_score',
            'historical_average',
            'historical_trend',
            'forecast_start_date',
            'forecast_end_date',
            'generated_at',
            'expires_at',
            'status',
            'insight_summary',
            'recommendations',
        ]
        read_only_fields = ['id', 'generated_at']


class PeriodComparisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodComparison
        fields = [
            'id',
            'name',
            'period1_start',
            'period1_end',
            'period1_label',
            'period2_start',
            'period2_end',
            'period2_label',
            'comparison_data',
            'overall_winner',
            'key_differences',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CustomReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomReport
        fields = [
            'id',
            'name',
            'description',
            'selected_modules',
            'selected_metrics',
            'start_date',
            'end_date',
            'format',
            'include_charts',
            'include_insights',
            'include_comparisons',
            'generated_file',
            'file_size',
            'generated_at',
            'is_favorite',
            'is_scheduled',
            'schedule_frequency',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'file_size', 'generated_at', 'created_at', 'updated_at']


class AchievementBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementBadge
        fields = [
            'id',
            'name',
            'display_name',
            'description',
            'category',
            'level',
            'icon',
            'color',
            'image',
            'criteria_type',
            'criteria_value',
            'criteria_module',
            'is_hidden',
            'is_limited',
            'order',
        ]


class UserAchievementSerializer(serializers.ModelSerializer):
    badge = AchievementBadgeSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = [
            'id',
            'badge',
            'progress_current',
            'progress_percentage',
            'is_earned',
            'earned_at',
            'earned_context',
            'is_shared',
            'shared_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserAchievementProgressSerializer(serializers.ModelSerializer):
    badge = AchievementBadgeSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = [
            'id',
            'badge',
            'progress_current',
            'progress_percentage',
            'is_earned',
            'earned_at',
        ]


class AnalyticsExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsExport
        fields = [
            'id',
            'name',
            'export_format',
            'export_scope',
            'selected_modules',
            'start_date',
            'end_date',
            'file',
            'file_size',
            'download_url',
            'status',
            'error_message',
            'requested_at',
            'started_at',
            'completed_at',
            'expires_at',
            'record_count',
        ]
        read_only_fields = [
            'id', 'file_size', 'download_url', 'requested_at',
            'started_at', 'completed_at', 'record_count'
        ]


class AnalyticsExportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsExport
        fields = [
            'name',
            'export_format',
            'export_scope',
            'selected_modules',
            'start_date',
            'end_date',
        ]


class AnalyticsInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsInsight
        fields = [
            'id',
            'insight_type',
            'severity',
            'title',
            'description',
            'related_modules',
            'related_metrics',
            'supporting_data',
            'chart_data',
            'action_items',
            'is_read',
            'is_dismissed',
            'is_actioned',
            'relevant_date',
            'dismissed_at',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class UserAnalyticsProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnalyticsProfile
        fields = [
            'id',
            'total_data_points',
            'active_modules',
            'overall_consistency_score',
            'module_consistency_scores',
            'current_streak_days',
            'longest_streak_days',
            'total_badges_earned',
            'badges_by_category',
            'last_entry_date',
            'last_entry_module',
            'insights_enabled',
            'anomaly_alerts_enabled',
            'weekly_reports_enabled',
            'predictive_insights_enabled',
            'calculated_at',
        ]
        read_only_fields = ['id', 'calculated_at']


class DashboardSummarySerializer(serializers.Serializer):
    """Summary data for the analytics dashboard"""
    total_achievements = serializers.IntegerField()
    new_insights_count = serializers.IntegerField()
    unread_anomalies_count = serializers.IntegerField()
    active_goals_count = serializers.IntegerField()
    current_streak_days = serializers.IntegerField()
    overall_consistency_score = serializers.IntegerField()
    recent_trends = TrendDetectionSerializer(many=True)
    recent_insights = AnalyticsInsightSerializer(many=True)
    goal_progress_summary = serializers.DictField()


class CrossModuleAnalysisRequestSerializer(serializers.Serializer):
    """Request to run cross-module correlation analysis"""
    modules = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        help_text="List of modules to analyze. If empty, analyzes all."
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    min_correlation = serializers.FloatField(min_value=0, max_value=1, default=0.3)


class GenerateReportRequestSerializer(serializers.Serializer):
    """Request to generate a custom or automated report"""
    report_type = serializers.ChoiceField(choices=['weekly', 'monthly', 'quarterly', 'custom'])
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    modules = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False
    )


class PeriodComparisonRequestSerializer(serializers.Serializer):
    """Request to compare two time periods"""
    period1_start = serializers.DateField()
    period1_end = serializers.DateField()
    period1_label = serializers.CharField(max_length=100, required=False, allow_blank=True)
    period2_start = serializers.DateField()
    period2_end = serializers.DateField()
    period2_label = serializers.CharField(max_length=100, required=False, allow_blank=True)
    metrics = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False
    )


class ForecastRequestSerializer(serializers.Serializer):
    """Request to generate a predictive forecast"""
    module = serializers.CharField(max_length=50)
    metric = serializers.CharField(max_length=100)
    period = serializers.ChoiceField(choices=['7d', '30d', '90d', '6m'])
    include_confidence_interval = serializers.BooleanField(default=True)
