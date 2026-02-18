import uuid
from django.apps import apps as django_apps
from django.conf import settings
from django.db import models
from django.utils import timezone


class TaskHabitLink(models.Model):
    COMPLETION_SOURCES = [
        ('completion_date', 'Task Completion Date'),
        ('due_date', 'Task Due Date'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_habit_links')
    task = models.ForeignKey('tasks.Task', on_delete=models.CASCADE, related_name='habit_links')
    habit = models.ForeignKey('habits.Habit', on_delete=models.CASCADE, related_name='task_links')
    trigger_on_complete = models.BooleanField(default=True)
    completion_source = models.CharField(max_length=30, choices=COMPLETION_SOURCES, default='completion_date')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'task', 'habit']

    def __str__(self):
        return f"{self.task.title} -> {self.habit.name}"


class SmartNotification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('dismissed', 'Dismissed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='smart_notifications')
    title = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    context_type = models.CharField(max_length=50, default='general')
    context_payload = models.JSONField(default=dict, blank=True)
    location_context = models.JSONField(default=dict, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title or self.message[:40]


class AutomationRule(models.Model):
    TRIGGER_CHOICES = [
        ('sleep', 'Sleep'),
        ('habit', 'Habit'),
        ('finance', 'Finance'),
        ('mood', 'Mood'),
        ('location', 'Location'),
        ('calendar', 'Calendar'),
        ('custom', 'Custom'),
    ]
    ACTION_CHOICES = [
        ('notify', 'Send Notification'),
        ('suggest', 'Suggestion'),
        ('create_task', 'Create Task'),
        ('adjust_workout', 'Adjust Workout'),
        ('log_entry', 'Log Entry'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='automation_rules')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    trigger_type = models.CharField(max_length=30, choices=TRIGGER_CHOICES, default='custom')
    condition = models.JSONField(default=dict)
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES, default='notify')
    action_payload = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class ExternalIntegration(models.Model):
    CATEGORY_CHOICES = [
        ('fitness', 'Fitness Tracker'),
        ('banking', 'Banking'),
        ('calendar', 'Calendar'),
        ('health', 'Health'),
        ('other', 'Other'),
    ]
    AUTH_CHOICES = [
        ('oauth', 'OAuth'),
        ('api_key', 'API Key'),
        ('webhook', 'Webhook'),
        ('none', 'None'),
    ]
    STATUS_CHOICES = [
        ('connected', 'Connected'),
        ('disconnected', 'Disconnected'),
        ('error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='external_integrations')
    provider = models.CharField(max_length=100)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    auth_type = models.CharField(max_length=30, choices=AUTH_CHOICES, default='oauth')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disconnected')
    config = models.JSONField(default=dict, blank=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['provider']

    def __str__(self):
        return f"{self.provider} ({self.get_category_display()})"


class VoiceCommand(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='voice_commands')
    transcript = models.TextField()
    intent = models.CharField(max_length=100, blank=True)
    action_payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.transcript[:40]


class BatchOperation(models.Model):
    TARGET_CHOICES = [
        ('tasks', 'Tasks'),
        ('habits', 'Habits'),
        ('notes', 'Notes'),
        ('calendar_events', 'Calendar Events'),
        ('finance_transactions', 'Finance Transactions'),
        ('journal_entries', 'Journal Entries'),
    ]
    ACTION_CHOICES = [
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('archive', 'Archive'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='batch_operations')
    target_type = models.CharField(max_length=30, choices=TARGET_CHOICES)
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_ids = models.JSONField(default=list)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    result_summary = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_action_type_display()} {self.get_target_type_display()}"

    def apply(self):
        target_map = {
            'tasks': 'tasks.Task',
            'habits': 'habits.Habit',
            'notes': 'notes.Note',
            'calendar_events': 'calendar.CalendarEvent',
            'finance_transactions': 'finance.Transaction',
            'journal_entries': 'journal.JournalEntry',
        }
        model_path = target_map.get(self.target_type)
        if not model_path:
            raise ValueError('Unsupported target type')
        model = django_apps.get_model(model_path)
        if not self.target_ids:
            raise ValueError('No target IDs provided')
        queryset = model.objects.filter(user=self.user, id__in=self.target_ids)
        result = {'action': self.action_type, 'target_type': self.target_type}

        if self.action_type == 'delete':
            deleted_count, _ = queryset.delete()
            result['count'] = deleted_count
        elif self.action_type == 'archive':
            if hasattr(model, 'is_archived'):
                updated = queryset.update(is_archived=True)
            elif hasattr(model, 'archived'):
                updated = queryset.update(archived=True)
            else:
                raise ValueError('Archive action not supported for target type')
            result['count'] = updated
        elif self.action_type == 'update':
            if not isinstance(self.payload, dict) or not self.payload:
                raise ValueError('Update payload required')
            updated = queryset.update(**self.payload)
            result['count'] = updated
        else:
            raise ValueError('Unsupported action type')

        self.status = 'completed'
        self.completed_at = timezone.now()
        self.result_summary = result
        self.error_message = ''
        self.save(update_fields=['status', 'completed_at', 'result_summary', 'error_message'])
        return result
