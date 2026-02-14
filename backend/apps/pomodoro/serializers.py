from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta

from .models import (
    PomodoroSettings, 
    PomodoroSession, 
    DistractionLog, 
    FocusStreak,
    DeepWorkSession
)


class PomodoroSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSettings
        fields = [
            'work_duration',
            'short_break',
            'long_break',
            'auto_start_breaks',
            'auto_start_work',
            'long_break_interval',
            'daily_pomodoro_goal',
            'enable_break_enforcement',
            'break_enforcement_delay',
            'enable_sound_notifications',
            'enable_desktop_notifications',
        ]


class DistractionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistractionLog
        fields = [
            'id',
            'session',
            'distraction_type',
            'description',
            'timestamp',
            'recovered',
            'recovery_time_seconds',
        ]
        read_only_fields = ['id', 'timestamp']


class PomodoroSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    task_project_name = serializers.CharField(source='task.project.name', read_only=True)
    distractions = DistractionLogSerializer(many=True, read_only=True)
    actual_duration = serializers.ReadOnlyField()

    class Meta:
        model = PomodoroSession
        fields = [
            'id',
            'session_type',
            'duration',
            'actual_duration',
            'task',
            'task_title',
            'project',
            'project_name',
            'task_project_name',
            'started_at',
            'ended_at',
            'completed',
            'interruptions',
            'notes',
            'productivity_score',
            'energy_level',
            'hour_of_day',
            'day_of_week',
            'distractions',
        ]
        read_only_fields = ['id', 'started_at', 'hour_of_day', 'day_of_week']


class PomodoroSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = [
            'session_type',
            'duration',
            'task',
            'project',
            'notes',
            'productivity_score',
            'energy_level',
        ]


class PomodoroSessionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = [
            'notes',
            'productivity_score',
            'energy_level',
            'completed',
        ]


class FocusStreakSerializer(serializers.ModelSerializer):
    daily_goal_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = FocusStreak
        fields = [
            'current_streak',
            'longest_streak',
            'longest_streak_date',
            'last_session_date',
            'sessions_today',
            'total_sessions',
            'total_focus_minutes',
            'daily_goal_progress',
            'updated_at',
        ]
    
    def get_daily_goal_progress(self, obj):
        settings = obj.user.pomodoro_settings
        goal = settings.daily_pomodoro_goal if hasattr(obj.user, 'pomodoro_settings') else 8
        today = timezone.now().date()
        if obj.last_session_date == today:
            return {
                'completed': obj.sessions_today,
                'goal': goal,
                'percentage': min(100, int((obj.sessions_today / goal) * 100))
            }
        return {
            'completed': 0,
            'goal': goal,
            'percentage': 0
        }


class DeepWorkSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    focus_ratio = serializers.ReadOnlyField()

    class Meta:
        model = DeepWorkSession
        fields = [
            'id',
            'task',
            'task_title',
            'project',
            'project_name',
            'started_at',
            'ended_at',
            'pomodoro_count',
            'total_focus_minutes',
            'break_minutes',
            'duration_hours',
            'focus_ratio',
            'productivity_score',
            'notes',
        ]
        read_only_fields = ['id', 'started_at']


class PomodoroStatsSerializer(serializers.Serializer):
    """Serializer for comprehensive pomodoro statistics"""
    today_count = serializers.IntegerField()
    today_minutes = serializers.IntegerField()
    today_completed = serializers.IntegerField()
    today_productivity_avg = serializers.FloatField()
    
    week_count = serializers.IntegerField()
    week_minutes = serializers.IntegerField()
    week_completed = serializers.IntegerField()
    week_productivity_avg = serializers.FloatField()
    
    month_count = serializers.IntegerField()
    month_minutes = serializers.IntegerField()
    month_completed = serializers.IntegerField()
    month_productivity_avg = serializers.FloatField()
    
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    
    total_distractions = serializers.IntegerField()
    avg_distractions_per_session = serializers.FloatField()
    
    most_productive_hour = serializers.IntegerField()
    most_productive_day = serializers.CharField()
    
    deep_work_sessions_this_month = serializers.IntegerField()
    total_deep_work_hours = serializers.FloatField()


class TimeOfDayAnalyticsSerializer(serializers.Serializer):
    """Serializer for time-of-day productivity heatmap"""
    hour = serializers.IntegerField()
    session_count = serializers.IntegerField()
    total_minutes = serializers.IntegerField()
    avg_productivity = serializers.FloatField()
    completion_rate = serializers.FloatField()


class DailyAnalyticsSerializer(serializers.Serializer):
    """Serializer for daily productivity breakdown"""
    date = serializers.DateField()
    session_count = serializers.IntegerField()
    total_minutes = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()
    distractions = serializers.IntegerField()
    avg_productivity = serializers.FloatField()


class ProjectAnalyticsSerializer(serializers.Serializer):
    """Serializer for project-based analytics"""
    project_id = serializers.CharField()
    project_name = serializers.CharField()
    session_count = serializers.IntegerField()
    total_minutes = serializers.IntegerField()
    avg_productivity = serializers.FloatField()


class ProductivityScoreSerializer(serializers.Serializer):
    """Serializer for productivity score calculation"""
    overall_score = serializers.IntegerField()
    focus_quality_score = serializers.IntegerField()
    consistency_score = serializers.IntegerField()
    completion_rate_score = serializers.IntegerField()
    streak_score = serializers.IntegerField()
    
    period = serializers.CharField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
