import uuid
from django.db import models
from django.conf import settings

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200)
    color = models.CharField(max_length=7, default='#3B82F6')
    order = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')
    
    class Meta:
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = [('inbox', 'Inbox'), ('active', 'Active'), ('completed', 'Completed')]
    PRIORITY_CHOICES = [(1, 'Low'), (2, 'Medium'), (3, 'High'), (4, 'Urgent')]
    ENERGY_LEVELS = [(1, 'Low'), (2, 'Medium-Low'), (3, 'Medium'), (4, 'Medium-High'), (5, 'High')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subtasks')

    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inbox')
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)
    due_date = models.DateField(null=True, blank=True)

    estimated_minutes = models.PositiveIntegerField(null=True, blank=True)
    actual_minutes = models.PositiveIntegerField(null=True, blank=True)
    energy_level = models.PositiveSmallIntegerField(null=True, blank=True, choices=ENERGY_LEVELS)
    recurrence_rule = models.JSONField(null=True, blank=True)  # e.g. {"frequency": "daily"|"weekly"|"monthly", "interval": 1, "weekdays": [0,1,2,3,4]}

    tags = models.ManyToManyField(Tag, through='TaskTag', related_name='tasks', blank=True)
    depends_on = models.ManyToManyField('self', through='TaskDependency', symmetrical=False, related_name='blocked_by', blank=True)

    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

    @property
    def is_urgent(self):
        return self.priority in (2, 4)  # P2=urgent not important, P4=urgent important

    @property
    def is_important(self):
        return self.priority in (3, 4)  # P3=important not urgent, P4=urgent important


class TaskDependency(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependency_outgoing')
    depends_on_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependency_incoming')

    class Meta:
        unique_together = ['task', 'depends_on_task']


class TaskTag(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['task', 'tag']


class TaskTimeLog(models.Model):
    SOURCE_CHOICES = [
        ('pomodoro', 'Pomodoro'),
        ('manual', 'Manual'),
        ('calendar', 'Calendar'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_time_logs')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_logs')
    pomodoro_session = models.ForeignKey(
        'pomodoro.PomodoroSession',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='task_time_logs',
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    minutes = models.PositiveIntegerField()
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.task.title} - {self.minutes}m"
