from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class CalendarEvent(models.Model):
    EVENT_TYPES = [
        ('event', 'Event'),
        ('task', 'Task'),
        ('habit', 'Habit'),
        ('reminder', 'Reminder'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='event')
    
    # Date and time
    start_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    # All day events
    is_all_day = models.BooleanField(default=False)
    
    # Colors
    color = models.CharField(max_length=7, default='#3B82F6')
    
    # Links to other models (optional)
    linked_task = models.ForeignKey('tasks.Task', null=True, blank=True, on_delete=models.SET_NULL)
    # linked_habit = models.ForeignKey('habits.Habit', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Recurring events
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_date', 'start_time']

class CalendarViewPreference(models.Model):
    VIEW_CHOICES = [
        ('day', 'Day'),
        ('week', 'Week'),
        ('month', 'Month'),
        ('agenda', 'Agenda'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='calendar_preferences')
    default_view = models.CharField(max_length=20, choices=VIEW_CHOICES, default='week')
    first_day_of_week = models.IntegerField(default=0)  # 0 = Monday
    show_completed_tasks = models.BooleanField(default=True)
    show_habits = models.BooleanField(default=True)
