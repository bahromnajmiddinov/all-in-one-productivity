import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PomodoroSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pomodoro_settings')
    work_duration = models.PositiveIntegerField(default=25)
    short_break = models.PositiveIntegerField(default=5)
    long_break = models.PositiveIntegerField(default=15)
    auto_start_breaks = models.BooleanField(default=False)
    auto_start_work = models.BooleanField(default=False)

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
    task = models.ForeignKey('tasks.Task', null=True, blank=True, on_delete=models.SET_NULL)

    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='work')
    duration = models.PositiveIntegerField()
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    interruptions = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']
