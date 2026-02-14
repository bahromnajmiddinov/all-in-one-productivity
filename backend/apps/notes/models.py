from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class NoteFolder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_folders')
    
    name = models.CharField(max_length=200)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, default='folder', blank=True)
    
    # Hierarchy
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name', 'parent']
    
    def __str__(self):
        return self.name


class NoteTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')
    
    class Meta:
        unique_together = ['user', 'name']
    
    def __str__(self):
        return self.name


class Note(models.Model):
    NOTE_TYPES = [
        ('text', 'Text'),
        ('checklist', 'Checklist'),
        ('code', 'Code'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    folder = models.ForeignKey(NoteFolder, on_delete=models.CASCADE, related_name='notes', null=True, blank=True)
    
    title = models.CharField(max_length=300)
    content = models.TextField(blank=True)
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES, default='text')
    
    # Organization
    tags = models.ManyToManyField(NoteTag, blank=True, related_name='notes')
    
    # Status
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-updated_at']
    
    def __str__(self):
        return self.title


class NoteChecklistItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='checklist_items')
    content = models.CharField(max_length=500)
    is_checked = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.content
