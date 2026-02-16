from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()

class Calendar(models.Model):
    """Represents a calendar layer (work, personal, family, etc.)"""
    CALENDAR_TYPES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
        ('family', 'Family'),
        ('project', 'Project'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendars')
    name = models.CharField(max_length=100)
    calendar_type = models.CharField(max_length=20, choices=CALENDAR_TYPES, default='custom')
    color = models.CharField(max_length=7, default='#3B82F6')
    is_visible = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'Calendars'

class CalendarEvent(models.Model):
    EVENT_TYPES = [
        ('event', 'Event'),
        ('meeting', 'Meeting'),
        ('appointment', 'Appointment'),
        ('deadline', 'Deadline'),
        ('time_block', 'Time Block'),
        ('task', 'Task'),
        ('habit', 'Habit'),
        ('reminder', 'Reminder'),
        ('pomodoro', 'Pomodoro Session'),
    ]
    
    TIME_BLOCK_TYPES = [
        ('deep_work', 'Deep Work'),
        ('meeting', 'Meeting'),
        ('break', 'Break'),
        ('buffer', 'Buffer Time'),
        ('focus', 'Focus Time'),
        ('review', 'Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    calendar = models.ForeignKey(Calendar, null=True, blank=True, on_delete=models.SET_NULL, related_name='events')
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='event')
    time_block_type = models.CharField(max_length=20, choices=TIME_BLOCK_TYPES, null=True, blank=True)
    
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
    linked_task = models.ForeignKey('tasks.Task', null=True, blank=True, on_delete=models.SET_NULL, related_name='calendar_events')
    linked_habit = models.ForeignKey('habits.Habit', null=True, blank=True, on_delete=models.SET_NULL, related_name='calendar_events')
    linked_pomodoro = models.ForeignKey('pomodoro.PomodoroSession', null=True, blank=True, on_delete=models.SET_NULL, related_name='calendar_events')
    
    # Location and meeting details
    location = models.CharField(max_length=200, blank=True)
    attendees = models.JSONField(default=list, blank=True)  # List of email addresses
    meeting_link = models.URLField(blank=True)
    
    # Priority and importance
    priority = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(3)])
    
    # Recurring events
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.JSONField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, default='confirmed', choices=[
        ('confirmed', 'Confirmed'),
        ('tentative', 'Tentative'),
        ('cancelled', 'Cancelled'),
    ])
    
    # Conflict detection
    has_conflict = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_date', 'start_time']
        indexes = [
            models.Index(fields=['user', 'start_date']),
            models.Index(fields=['user', 'start_date', 'end_date']),
            models.Index(fields=['calendar']),
        ]

class CalendarViewPreference(models.Model):
    VIEW_CHOICES = [
        ('day', 'Day'),
        ('week', 'Week'),
        ('month', 'Month'),
        ('year', 'Year'),
        ('agenda', 'Agenda'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='calendar_preferences')
    default_view = models.CharField(max_length=20, choices=VIEW_CHOICES, default='week')
    first_day_of_week = models.IntegerField(default=0)  # 0 = Monday
    show_completed_tasks = models.BooleanField(default=True)
    show_habits = models.BooleanField(default=True)
    show_pomodoro = models.BooleanField(default=True)
    hour_start = models.IntegerField(default=6, validators=[MinValueValidator(0), MaxValueValidator(23)])
    hour_end = models.IntegerField(default=22, validators=[MinValueValidator(0), MaxValueValidator(23)])
    
    # Active calendars
    active_calendars = models.JSONField(default=list, blank=True)  # List of calendar IDs
    active_event_types = models.JSONField(default=list, blank=True)  # List of event types to show
    
    class Meta:
        verbose_name_plural = 'Calendar View Preferences'
