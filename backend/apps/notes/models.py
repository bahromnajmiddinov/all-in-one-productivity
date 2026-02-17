from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
import re

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
        ('voice', 'Voice Note'),
        ('web_clip', 'Web Clip'),
        ('markdown', 'Markdown'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    folder = models.ForeignKey(NoteFolder, on_delete=models.CASCADE, related_name='notes', null=True, blank=True)
    
    title = models.CharField(max_length=300)
    content = models.TextField(blank=True)
    rendered_content = models.TextField(blank=True, help_text="HTML rendered from markdown")
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES, default='text')
    
    # Organization
    tags = models.ManyToManyField(NoteTag, blank=True, related_name='notes')
    
    # Status
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    
    # Template source
    template = models.ForeignKey('NoteTemplate', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_notes')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['user', 'is_archived']),
            models.Index(fields=['user', 'is_favorite']),
            models.Index(fields=['note_type']),
        ]
    
    def __str__(self):
        return self.title
    
    def extract_links(self):
        """Extract [[Note Title]] style links from content"""
        if not self.content:
            return []
        pattern = r'\[\[([^\]]+)\]\]'
        return re.findall(pattern, self.content)
    
    def get_linked_notes(self):
        """Get all notes linked from this note"""
        return Note.objects.filter(
            incoming_links__source_note=self
        ).distinct()
    
    def get_backlinks(self):
        """Get all notes that link to this note"""
        return Note.objects.filter(
            outgoing_links__target_note=self
        ).distinct()
    
    def save_revision(self):
        """Save a revision of the current note state"""
        return NoteRevision.objects.create(
            note=self,
            title=self.title,
            content=self.content,
            word_count=len(self.content.split()) if self.content else 0
        )


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


class NoteAttachment(models.Model):
    ATTACHMENT_TYPES = [
        ('image', 'Image'),
        ('file', 'File'),
        ('audio', 'Audio'),
        ('video', 'Video'),
        ('link', 'Link'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='note_attachments/%Y/%m/', blank=True, null=True)
    attachment_type = models.CharField(max_length=20, choices=ATTACHMENT_TYPES, default='file')
    url = models.URLField(blank=True)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return self.title or self.file.name if self.file else self.url


class NoteLink(models.Model):
    """Bidirectional links between notes (Zettelkasten-style)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    source_note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='outgoing_links')
    target_note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='incoming_links')
    link_text = models.CharField(max_length=200, blank=True)
    context = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['source_note', 'target_note']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.source_note.title} → {self.target_note.title}"


class NoteTemplate(models.Model):
    TEMPLATE_TYPES = [
        ('blank', 'Blank Note'),
        ('meeting', 'Meeting Notes'),
        ('daily', 'Daily Log'),
        ('project', 'Project Plan'),
        ('research', 'Research Notes'),
        ('code', 'Code Snippet'),
        ('journal', 'Journal Entry'),
        ('todo', 'To-Do List'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_templates')
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, default='blank')
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='document')
    color = models.CharField(max_length=7, default='#3B82F6')
    
    # Template content
    title_template = models.CharField(max_length=200, blank=True)
    content_template = models.TextField(blank=True)
    default_tags = models.ManyToManyField(NoteTag, blank=True)
    default_folder = models.ForeignKey(NoteFolder, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_default = models.BooleanField(default=False)
    is_system = models.BooleanField(default=False)
    usage_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-usage_count', 'name']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return self.name
    
    def increment_usage(self):
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class NoteRevision(models.Model):
    """Track note edit history"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='revisions')
    title = models.CharField(max_length=300)
    content = models.TextField(blank=True)
    edited_at = models.DateTimeField(auto_now_add=True)
    word_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-edited_at']
    
    def __str__(self):
        return f"Revision of {self.note.title} at {self.edited_at}"


class NoteAnalytics(models.Model):
    """Track note usage and engagement analytics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    note = models.OneToOneField(Note, on_delete=models.CASCADE, related_name='analytics')
    
    # Creation stats
    word_count = models.PositiveIntegerField(default=0)
    character_count = models.PositiveIntegerField(default=0)
    reading_time_minutes = models.PositiveIntegerField(default=0)
    
    # Engagement stats
    view_count = models.PositiveIntegerField(default=0)
    edit_count = models.PositiveIntegerField(default=0)
    
    # Link stats
    outgoing_link_count = models.PositiveIntegerField(default=0)
    incoming_link_count = models.PositiveIntegerField(default=0)
    
    # Dates
    first_viewed_at = models.DateTimeField(null=True, blank=True)
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    last_edited_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Note Analytics'
    
    def __str__(self):
        return f"Analytics for {self.note.title}"
    
    def record_view(self):
        self.view_count += 1
        now = timezone.now()
        if not self.first_viewed_at:
            self.first_viewed_at = now
        self.last_viewed_at = now
        self.save(update_fields=['view_count', 'first_viewed_at', 'last_viewed_at'])
    
    def record_edit(self):
        self.edit_count += 1
        self.last_edited_at = timezone.now()
        self.save(update_fields=['edit_count', 'last_edited_at'])
    
    def update_stats(self):
        """Recalculate word count, reading time, and link counts"""
        content = self.note.content or ''
        self.word_count = len(content.split())
        self.character_count = len(content)
        # Average reading speed: 200 words per minute
        self.reading_time_minutes = max(1, self.word_count // 200)
        self.outgoing_link_count = self.note.outgoing_links.count()
        self.incoming_link_count = self.note.incoming_links.count()
        self.save()


class QuickCapture(models.Model):
    """Quick capture for rapid note entry"""
    CAPTURE_TYPES = [
        ('text', 'Text'),
        ('voice', 'Voice'),
        ('web_clip', 'Web Clip'),
        ('image', 'Image'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quick_captures')
    
    capture_type = models.CharField(max_length=20, choices=CAPTURE_TYPES, default='text')
    content = models.TextField()
    title = models.CharField(max_length=300, blank=True)
    
    # For web clips
    source_url = models.URLField(blank=True)
    source_title = models.CharField(max_length=300, blank=True)
    
    # For voice notes
    audio_file = models.FileField(upload_to='voice_notes/%Y/%m/', blank=True, null=True)
    transcription = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    
    # Organization
    folder = models.ForeignKey(NoteFolder, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(NoteTag, blank=True)
    
    # Status
    is_processed = models.BooleanField(default=False)
    converted_note = models.ForeignKey(Note, on_delete=models.SET_NULL, null=True, blank=True, related_name='quick_captures')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title or f"Quick Capture {self.id}"
