import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Habit(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#10B981')  # Default green
    icon = models.CharField(max_length=50, default='check')

    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    target_per_week = models.PositiveIntegerField(default=7)  # For weekly habits

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class HabitCompletion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habit_completions')

    completed_at = models.DateTimeField(auto_now_add=True)
    date = models.DateField()  # The date this completion counts for
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['habit', 'date']  # One completion per habit per day
        ordering = ['-date']

    def __str__(self):
        return f"{self.habit.name} - {self.date}"
