from rest_framework import serializers
from django.utils import timezone

from .models import (
    WaterIntakeSettings,
    WaterLog,
    WaterContainer,
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


class WaterIntakeSettingsSerializer(serializers.ModelSerializer):
    adjusted_goal_ml = serializers.SerializerMethodField()

    class Meta:
        model = WaterIntakeSettings
        fields = [
            'daily_goal_ml',
            'goal_unit',
            'reminder_enabled',
            'reminder_interval',
            'smart_reminders_enabled',
            'weather_adjustment_enabled',
            'activity_level',
            'temperature_c',
            'adjusted_goal_ml',
        ]

    def get_adjusted_goal_ml(self, obj):
        if not obj.weather_adjustment_enabled:
            return obj.daily_goal_ml

        temperature_c = obj.temperature_c
        if temperature_c is None:
            return obj.daily_goal_ml

        base_goal = obj.daily_goal_ml
        temperature_adjustment = max(float(temperature_c) - 20, 0) * 50
        activity_adjustment = {
            'low': 0,
            'moderate': 300,
            'high': 600,
        }.get(obj.activity_level, 0)

        return int(base_goal + temperature_adjustment + activity_adjustment)


class WaterContainerSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterContainer
        fields = ['id', 'name', 'volume_ml', 'is_favorite', 'created_at']
        read_only_fields = ['id', 'created_at']


class WaterLogSerializer(serializers.ModelSerializer):
    container_name = serializers.CharField(source='container.name', read_only=True)
    container_volume_ml = serializers.IntegerField(source='container.volume_ml', read_only=True)

    class Meta:
        model = WaterLog
        fields = [
            'id',
            'container',
            'container_name',
            'container_volume_ml',
            'amount_ml',
            'logged_at',
            'date',
        ]
        read_only_fields = ['id', 'logged_at']


class WaterDailyStatsSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_ml = serializers.IntegerField()
    goal_ml = serializers.IntegerField()
    percentage = serializers.IntegerField()
    log_count = serializers.IntegerField()


class SleepLogSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()
    efficiency_label = serializers.SerializerMethodField()

    class Meta:
        model = SleepLog
        fields = [
            'id',
            'bed_time',
            'wake_time',
            'duration_minutes',
            'duration_hours',
            'quality',
            'disruptions_count',
            'notes',
            'deep_sleep_minutes',
            'light_sleep_minutes',
            'rem_sleep_minutes',
            'awake_minutes',
            'sleep_score',
            'efficiency_percent',
            'efficiency_label',
            'mood_before_sleep',
            'mood_after_wake',
            'room_temperature',
            'noise_level',
            'caffeine_hours_before',
            'alcohol_before_sleep',
            'exercised_before_sleep',
            'screen_time_minutes_before',
            'date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'duration_minutes', 'sleep_score', 'efficiency_percent']

    def get_duration_hours(self, obj):
        return round(obj.duration_minutes / 60, 1) if obj.duration_minutes else 0

    def get_efficiency_label(self, obj):
        if obj.efficiency_percent is None:
            return ''
        if obj.efficiency_percent >= 90:
            return 'Excellent'
        elif obj.efficiency_percent >= 85:
            return 'Good'
        elif obj.efficiency_percent >= 75:
            return 'Fair'
        else:
            return 'Poor'


class SleepDisruptionSerializer(serializers.ModelSerializer):
    disruption_type_label = serializers.CharField(source='get_disruption_type_display', read_only=True)

    class Meta:
        model = SleepDisruption
        fields = [
            'id',
            'sleep_log',
            'disruption_type',
            'disruption_type_label',
            'other_reason',
            'duration_minutes',
            'time',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SleepNapSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()
    feeling_after_label = serializers.CharField(source='get_feeling_after_display', read_only=True)

    class Meta:
        model = SleepNap
        fields = [
            'id',
            'start_time',
            'end_time',
            'duration_minutes',
            'duration_hours',
            'quality',
            'feeling_after',
            'feeling_after_label',
            'notes',
            'date',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'duration_minutes', 'date']

    def get_duration_hours(self, obj):
        return round(obj.duration_minutes / 60, 1) if obj.duration_minutes else 0


class SleepGoalSerializer(serializers.ModelSerializer):
    target_duration_hours = serializers.SerializerMethodField()
    min_duration_hours = serializers.SerializerMethodField()
    max_duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = SleepGoal
        fields = [
            'id',
            'target_duration_minutes',
            'target_duration_hours',
            'min_duration_minutes',
            'min_duration_hours',
            'max_duration_minutes',
            'max_duration_hours',
            'target_quality',
            'target_bed_time',
            'target_wake_time',
            'bed_time_window_minutes',
            'wake_time_window_minutes',
            'consistency_target_days',
            'weekly_naps_max',
            'max_nap_duration',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_target_duration_hours(self, obj):
        return round(obj.target_duration_minutes / 60, 1)

    def get_min_duration_hours(self, obj):
        return round(obj.min_duration_minutes / 60, 1)

    def get_max_duration_hours(self, obj):
        return round(obj.max_duration_minutes / 60, 1)


class SleepStatsSerializer(serializers.ModelSerializer):
    avg_duration_7d_hours = serializers.SerializerMethodField()
    avg_duration_30d_hours = serializers.SerializerMethodField()
    avg_duration_90d_hours = serializers.SerializerMethodField()
    sleep_debt_hours = serializers.SerializerMethodField()

    class Meta:
        model = SleepStats
        fields = [
            'id',
            'total_logs',
            'current_streak',
            'best_streak',
            'avg_duration_7d',
            'avg_duration_7d_hours',
            'avg_duration_30d',
            'avg_duration_30d_hours',
            'avg_duration_90d',
            'avg_duration_90d_hours',
            'avg_quality_7d',
            'avg_quality_30d',
            'avg_quality_90d',
            'avg_score_7d',
            'avg_score_30d',
            'best_sleep_date',
            'best_sleep_score',
            'worst_sleep_date',
            'worst_sleep_score',
            'avg_bed_time',
            'avg_wake_time',
            'bed_time_stddev',
            'wake_time_stddev',
            'sleep_debt_minutes',
            'sleep_debt_hours',
            'avg_deep_sleep_pct',
            'avg_rem_sleep_pct',
            'optimal_bed_time_start',
            'optimal_bed_time_end',
            'total_naps',
            'avg_nap_duration',
            'day_of_week_patterns',
            'avg_efficiency_7d',
            'avg_efficiency_30d',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def get_avg_duration_7d_hours(self, obj):
        return round(obj.avg_duration_7d / 60, 1) if obj.avg_duration_7d else None

    def get_avg_duration_30d_hours(self, obj):
        return round(obj.avg_duration_30d / 60, 1) if obj.avg_duration_30d else None

    def get_avg_duration_90d_hours(self, obj):
        return round(obj.avg_duration_90d / 60, 1) if obj.avg_duration_90d else None

    def get_sleep_debt_hours(self, obj):
        return round(obj.sleep_debt_minutes / 60, 1) if obj.sleep_debt_minutes else 0


class SleepDebtSerializer(serializers.ModelSerializer):
    debt_hours = serializers.SerializerMethodField()
    target_hours = serializers.SerializerMethodField()
    actual_hours = serializers.SerializerMethodField()

    class Meta:
        model = SleepDebt
        fields = [
            'id',
            'date',
            'debt_minutes',
            'debt_hours',
            'target_minutes',
            'target_hours',
            'actual_minutes',
            'actual_hours',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_debt_hours(self, obj):
        return round(obj.debt_minutes / 60, 1)

    def get_target_hours(self, obj):
        return round(obj.target_minutes / 60, 1)

    def get_actual_hours(self, obj):
        return round(obj.actual_minutes / 60, 1)


class SleepCorrelationSerializer(serializers.ModelSerializer):
    correlation_type_label = serializers.CharField(source='get_correlation_type_display', read_only=True)

    class Meta:
        model = SleepCorrelation
        fields = [
            'id',
            'correlation_type',
            'correlation_type_label',
            'duration_correlation',
            'quality_correlation',
            'score_correlation',
            'start_date',
            'end_date',
            'data_points',
            'insights',
            'computed_at',
        ]
        read_only_fields = ['id', 'computed_at']


class SleepInsightSerializer(serializers.ModelSerializer):
    insight_type_label = serializers.CharField(source='get_insight_type_display', read_only=True)
    priority_label = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = SleepInsight
        fields = [
            'id',
            'insight_type',
            'insight_type_label',
            'title',
            'description',
            'related_sleep_log',
            'priority',
            'priority_label',
            'confidence',
            'action_items',
            'is_dismissed',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ExerciseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseType
        fields = ['id', 'name', 'category', 'color', 'icon', 'is_default']
        read_only_fields = ['id']


class ExerciseLogSerializer(serializers.ModelSerializer):
    exercise_type_name = serializers.CharField(source='exercise_type.name', read_only=True)
    exercise_type_color = serializers.CharField(source='exercise_type.color', read_only=True)

    class Meta:
        model = ExerciseLog
        fields = [
            'id',
            'exercise_type',
            'exercise_type_name',
            'exercise_type_color',
            'date',
            'duration_minutes',
            'calories_burned',
            'sets',
            'reps',
            'weight_kg',
            'distance_km',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ExerciseStatsSerializer(serializers.Serializer):
    total_workouts = serializers.IntegerField()
    total_duration = serializers.IntegerField()
    total_calories = serializers.IntegerField()
    current_streak = serializers.IntegerField()
    favorite_exercise = serializers.CharField()


class BodyMetricsSerializer(serializers.ModelSerializer):
    weight_change_kg = serializers.SerializerMethodField()

    class Meta:
        model = BodyMetrics
        fields = [
            'id',
            'date',
            'weight_kg',
            'weight_change_kg',
            'body_fat_percentage',
            'chest_cm',
            'waist_cm',
            'hips_cm',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_weight_change_kg(self, obj):
        previous = BodyMetrics.objects.filter(
            user=obj.user,
            date__lt=obj.date,
            weight_kg__isnull=False,
        ).order_by('-date').first()

        if previous and obj.weight_kg:
            return round(obj.weight_kg - previous.weight_kg, 2)
        return None
