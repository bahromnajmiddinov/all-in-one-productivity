from rest_framework import serializers

from .models import (
    WaterIntakeSettings,
    WaterLog,
    WaterContainer,
    SleepLog,
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
    quality_label = serializers.CharField(source='get_quality_display', read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = SleepLog
        fields = [
            'id',
            'bed_time',
            'wake_time',
            'duration_minutes',
            'duration_hours',
            'quality',
            'quality_label',
            'disruptions',
            'notes',
            'date',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'duration_minutes']

    def get_duration_hours(self, obj):
        return round(obj.duration_minutes / 60, 1)


class SleepStatsSerializer(serializers.Serializer):
    avg_duration = serializers.FloatField()
    avg_quality = serializers.FloatField()
    total_logs = serializers.IntegerField()
    streak_days = serializers.IntegerField()


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
