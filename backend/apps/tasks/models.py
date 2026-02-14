import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

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
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subtasks')
    
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inbox')
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)
    due_date = models.DateField(null=True, blank=True)
    
    tags = models.ManyToManyField(Tag, through='TaskTag', related_name='tasks', blank=True)
    
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class TaskTag(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['task', 'tag']
