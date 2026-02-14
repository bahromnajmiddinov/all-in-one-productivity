import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class PomodoroSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pomodoro_settings')
    work_duration = models.PositiveIntegerField(default=25)
    short_break = models.PositiveIntegerField(default=5)
    long_break = models.PositiveIntegerField(default=15)
    auto_start_breaks = models.BooleanField(default=False)
    auto_start_work = models.BooleanField(default=False)
    long_break_interval = models.PositiveIntegerField(default=4, help_text="Sessions before long break")
    daily_pomodoro_goal = models.PositiveIntegerField(default=8)
    enable_break_enforcement = models.BooleanField(default=True)
    break_enforcement_delay = models.PositiveIntegerField(default=5, help_text="Minutes to delay before allowing skip")
    enable_sound_notifications = models.BooleanField(default=True)
    enable_desktop_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} settings"


class PomodoroSession(models.Model):
    SESSION_TYPES = [
        ('work', 'Work'),
        ('short_break', 'Short Break'),
        ('long_break', 'Long Break'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pomodoro_sessions')
    task = models.ForeignKey('tasks.Task', null=True, blank=True, on_delete=models.SET_NULL, related_name='pomodoro_sessions')
    project = models.ForeignKey('tasks.Project', null=True, blank=True, on_delete=models.SET_NULL, related_name='pomodoro_sessions')

    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='work')
    duration = models.PositiveIntegerField()
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    interruptions = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    productivity_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Self-rated productivity 1-10")
    energy_level = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Energy level during session 1-5")
    
    # Time tracking for analytics
    hour_of_day = models.PositiveSmallIntegerField(null=True, blank=True)
    day_of_week = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def save(self, *args, **kwargs):
        if not self.hour_of_day:
            self.hour_of_day = self.started_at.hour if self.started_at else timezone.now().hour
        if not self.day_of_week:
            self.day_of_week = self.started_at.weekday() if self.started_at else timezone.now().weekday()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.session_type} - {self.started_at}"

    @property
    def actual_duration(self):
        """Returns actual duration in minutes, or planned duration if not ended"""
        if self.ended_at:
            return int((self.ended_at - self.started_at).total_seconds() / 60)
        return self.duration


class DistractionLog(models.Model):
    DISTRACTION_TYPES = [
        ('notification', 'Notification'),
        ('conversation', 'Conversation'),
        ('environmental', 'Environmental'),
        ('physical', 'Physical'),
        ('mental', 'Mental'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='distraction_logs')
    session = models.ForeignKey(PomodoroSession, on_delete=models.CASCADE, related_name='distractions', null=True, blank=True)
    
    distraction_type = models.CharField(max_length=20, choices=DISTRACTION_TYPES)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    recovered = models.BooleanField(default=False, help_text="Whether user returned to focus")
    recovery_time_seconds = models.PositiveIntegerField(null=True, blank=True, help_text="Time to return to focus")

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.email} - {self.distraction_type} - {self.timestamp}"


class FocusStreak(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='focus_streak')
    
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    longest_streak_date = models.DateField(null=True, blank=True)
    
    last_session_date = models.DateField(null=True, blank=True)
    sessions_today = models.PositiveIntegerField(default=0)
    
    total_sessions = models.PositiveIntegerField(default=0)
    total_focus_minutes = models.PositiveIntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - Streak: {self.current_streak}"

    def record_session(self, session):
        """Record a completed session and update streak"""
        today = timezone.now().date()
        
        if self.last_session_date == today:
            self.sessions_today += 1
        else:
            # Check if streak continues (yesterday had sessions)
            yesterday = today - timedelta(days=1)
            if self.last_session_date == yesterday or self.sessions_today > 0:
                self.current_streak += 1
            else:
                self.current_streak = 1
            self.sessions_today = 1
            self.last_session_date = today
        
        # Update longest streak
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
            self.longest_streak_date = today
        
        self.total_sessions += 1
        self.total_focus_minutes += session.duration
        self.save()

    def reset_streak(self):
        """Reset streak if user missed a day"""
        today = timezone.now().date()
        if self.last_session_date:
            days_since_last = (today - self.last_session_date).days
            if days_since_last > 1:
                self.current_streak = 0
                self.save()


class DeepWorkSession(models.Model):
    """Track extended focus periods (multiple consecutive pomodoros)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deep_work_sessions')
    task = models.ForeignKey('tasks.Task', null=True, blank=True, on_delete=models.SET_NULL, related_name='deep_work_sessions')
    project = models.ForeignKey('tasks.Project', null=True, blank=True, on_delete=models.SET_NULL, related_name='deep_work_sessions')
    
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    pomodoro_count = models.PositiveIntegerField(default=0)
    total_focus_minutes = models.PositiveIntegerField(default=0)
    break_minutes = models.PositiveIntegerField(default=0)
    
    productivity_score = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.email} - Deep Work - {self.pomodoro_count} pomodoros"

    @property
    def duration_hours(self):
        if self.ended_at:
            total_minutes = (self.ended_at - self.started_at).total_seconds() / 60
            return round(total_minutes / 60, 2)
        return 0

    @property
    def focus_ratio(self):
        """Ratio of focus time to total time"""
        if self.ended_at:
            total_minutes = (self.ended_at - self.started_at).total_seconds() / 60
            if total_minutes > 0:
                return round(self.total_focus_minutes / total_minutes, 2)
        return 0
