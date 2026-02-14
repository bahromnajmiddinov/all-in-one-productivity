import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, date, timedelta


class Habit(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('custom', 'Custom (every N days)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='habits')

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    # For weekly: 0=Monday, 6=Sunday (Python weekday)
    target_weekdays = models.JSONField(default=list, blank=True)  # e.g. [0,1,2,3,4] for Mon-Fri
    # For custom frequency (every N days)
    custom_interval_days = models.PositiveIntegerField(null=True, blank=True)

    # Time-of-day preference: store as list of preferred hours (0-23) or ranges
    preferred_times = models.JSONField(default=list, blank=True)

    # Category for grouping
    category = models.ForeignKey('HabitCategory', null=True, blank=True, on_delete=models.SET_NULL, related_name='habits')

    order = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    # Cached stats (optional; can be recalculated)
    total_completions = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def is_due_on_date(self, date):
        if self.frequency == 'daily':
            return True
        if self.frequency == 'weekly':
            # Python: Monday=0, Sunday=6
            return date.weekday() in (self.target_weekdays or [])
        if self.frequency == 'custom' and self.custom_interval_days:
            # Determine if the given date is aligned with creation or a reference point
            delta = (date - self.created_at.date()).days
            return delta % self.custom_interval_days == 0
        return False

    def recalc_stats(self):
        completions = list(self.completions.order_by('date').values_list('date', flat=True))
        if not completions:
            self.total_completions = 0
            self.current_streak = 0
            self.longest_streak = 0
            self.save(update_fields=['total_completions', 'current_streak', 'longest_streak'])
            return

        self.total_completions = len(completions)
        longest = 0
        current = 0
        prev = None
        for d in completions:
            if prev is None:
                current = 1
            else:
                if (d - prev).days == 1:
                    current += 1
                else:
                    longest = max(longest, current)
                    current = 1
            prev = d
        longest = max(longest, current)

        # compute current streak relative to today
        today = timezone.now().date()
        streak = 0
        day = today
        while True:
            if day in completions:
                streak += 1
                day -= timedelta(days=1)
            else:
                break
        self.current_streak = streak
        self.longest_streak = longest
        self.save(update_fields=['total_completions', 'current_streak', 'longest_streak'])


class HabitCompletion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    date = models.DateField()
    completed = models.BooleanField(default=True)
    # exact timestamp when user marked completion
    timestamp = models.DateTimeField(auto_now_add=True)
    # store time-of-day in minutes from midnight for analytics
    time_of_day_minutes = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['habit', 'date']

    def __str__(self):
        return f"{self.habit.name} on {self.date}"


class HabitCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='habit_categories')

    def __str__(self):
        return self.name


class HabitStack(models.Model):
    """Links habits together to build routines (stacking)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='habit_stacks')
    previous = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='stack_next')
    next = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='stack_prev')
    order = models.PositiveIntegerField(default=0)
    gap_minutes = models.PositiveIntegerField(default=0)  # expected gap between completions

    class Meta:
        ordering = ['order']


class HabitReminder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='reminders')
    # store preferred reminder times as list of hour/min pairs or minutes-from-midnight
    times = models.JSONField(default=list, blank=True)
    smart = models.BooleanField(default=True)  # use analytics to pick optimal times
    active = models.BooleanField(default=True)
    last_sent = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Reminder for {self.habit.name}"
