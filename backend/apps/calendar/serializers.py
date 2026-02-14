from rest_framework import serializers
from .models import CalendarEvent, CalendarViewPreference

class CalendarEventSerializer(serializers.ModelSerializer):
    linked_task_title = serializers.CharField(source='linked_task.title', read_only=True)
    # linked_habit_name = serializers.CharField(source='linked_habit.name', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'description', 'event_type',
            'start_date', 'start_time', 'end_date', 'end_time',
            'is_all_day', 'color', 'linked_task', 'linked_task_title',
            'is_recurring',
            'duration_minutes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_duration_minutes(self, obj):
        if obj.start_time and obj.end_time and obj.start_date == obj.end_date:
            from datetime import datetime
            start = datetime.combine(obj.start_date, obj.start_time)
            end = datetime.combine(obj.end_date or obj.start_date, obj.end_time)
            return int((end - start).total_seconds() / 60)
        return None

class CalendarPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarViewPreference
        fields = ['default_view', 'first_day_of_week', 'show_completed_tasks', 'show_habits']
        read_only_fields = []
