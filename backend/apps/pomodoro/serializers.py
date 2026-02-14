from rest_framework import serializers

from .models import PomodoroSettings, PomodoroSession


class PomodoroSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSettings
        fields = [
            'work_duration',
            'short_break',
            'long_break',
            'auto_start_breaks',
            'auto_start_work',
        ]


class PomodoroSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = PomodoroSession
        fields = [
            'id',
            'session_type',
            'duration',
            'task',
            'task_title',
            'started_at',
            'ended_at',
            'completed',
        ]
        read_only_fields = ['id', 'started_at']
