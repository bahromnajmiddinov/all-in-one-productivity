from rest_framework import serializers
from .models import CalendarEvent, CalendarViewPreference, Calendar

class CalendarSerializer(serializers.ModelSerializer):
    event_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Calendar
        fields = [
            'id', 'name', 'calendar_type', 'color', 'is_visible',
            'is_default', 'order', 'event_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'event_count', 'created_at', 'updated_at']
    
    def get_event_count(self, obj):
        return obj.events.count()

class CalendarEventSerializer(serializers.ModelSerializer):
    linked_task_title = serializers.CharField(source='linked_task.title', read_only=True)
    linked_habit_name = serializers.CharField(source='linked_habit.name', read_only=True)
    linked_pomodoro_id = serializers.UUIDField(source='linked_pomodoro.id', read_only=True)
    calendar_name = serializers.CharField(source='calendar.name', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'description', 'event_type', 'time_block_type',
            'start_date', 'start_time', 'end_date', 'end_time',
            'is_all_day', 'color', 'calendar', 'calendar_name',
            'linked_task', 'linked_task_title',
            'linked_habit', 'linked_habit_name',
            'linked_pomodoro', 'linked_pomodoro_id',
            'location', 'attendees', 'meeting_link',
            'priority', 'is_recurring', 'recurrence_pattern',
            'status', 'has_conflict',
            'duration_minutes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'has_conflict', 'created_at', 'updated_at']
    
    def get_duration_minutes(self, obj):
        if obj.start_time and obj.end_time and obj.start_date == obj.end_date:
            from datetime import datetime
            start = datetime.combine(obj.start_date, obj.start_time)
            end = datetime.combine(obj.end_date or obj.start_date, obj.end_time)
            return int((end - start).total_seconds() / 60)
        elif obj.start_date and obj.end_date and not obj.start_time and not obj.end_time:
            # All-day events
            from datetime import datetime, timedelta
            start = datetime.combine(obj.start_date, datetime.min.time())
            end = datetime.combine(obj.end_date, datetime.min.time()) + timedelta(days=1)
            return int((end - start).total_seconds() / 60)
        return None

class CalendarPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarViewPreference
        fields = [
            'default_view', 'first_day_of_week',
            'show_completed_tasks', 'show_habits', 'show_pomodoro',
            'hour_start', 'hour_end',
            'active_calendars', 'active_event_types'
        ]
        read_only_fields = []

class EventConflictSerializer(serializers.Serializer):
    event = CalendarEventSerializer()
    conflicts_with = CalendarEventSerializer(many=True)
    conflict_type = serializers.CharField()

class ScheduleAnalyticsSerializer(serializers.Serializer):
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    total_events = serializers.IntegerField()
    total_hours = serializers.FloatField()
    hours_by_event_type = serializers.DictField()
    hours_by_calendar = serializers.DictField()
    average_meeting_duration = serializers.FloatField()
    meeting_count = serializers.IntegerField()
    time_block_hours = serializers.FloatField()
    free_time_hours = serializers.FloatField()
    busiest_day = serializers.DateField()
    busiest_day_hours = serializers.FloatField()

class HeatmapDataSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_hours = serializers.FloatField()
    event_count = serializers.IntegerField()
    event_types = serializers.DictField()
    intensity = serializers.FloatField()  # 0-1 scale

class FreeTimeBlockSerializer(serializers.Serializer):
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField()
    is_work_hours = serializers.BooleanField()

class MeetingLoadSerializer(serializers.Serializer):
    period = serializers.CharField()
    total_meeting_hours = serializers.FloatField()
    meeting_count = serializers.IntegerField()
    average_daily_meeting_hours = serializers.FloatField()
    peak_day = serializers.DateField()
    trend = serializers.CharField()  # 'increasing', 'decreasing', 'stable'
    by_day = serializers.ListField(child=serializers.DictField())
