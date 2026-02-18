from django.contrib import admin
from .models import (
    NoteFolder, NoteTag, Note, NoteChecklistItem,
    NoteAttachment, NoteLink, NoteTemplate, NoteRevision,
    NoteAnalytics, QuickCapture
)


@admin.register(NoteFolder)
class NoteFolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'parent', 'is_default', 'created_at']
    list_filter = ['is_default', 'created_at']
    search_fields = ['name', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(NoteTag)
class NoteTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color']
    search_fields = ['name', 'user__email']
    readonly_fields = ['id']


class NoteChecklistItemInline(admin.TabularInline):
    model = NoteChecklistItem
    extra = 0


class NoteAttachmentInline(admin.TabularInline):
    model = NoteAttachment
    extra = 0


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'note_type', 'folder', 'is_pinned', 'is_favorite', 'is_archived', 'updated_at']
    list_filter = ['note_type', 'is_pinned', 'is_favorite', 'is_archived', 'created_at']
    search_fields = ['title', 'content', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['tags']
    inlines = [NoteChecklistItemInline, NoteAttachmentInline]


@admin.register(NoteAttachment)
class NoteAttachmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'note', 'attachment_type', 'file_size', 'created_at']
    list_filter = ['attachment_type', 'created_at']
    search_fields = ['title', 'note__title']


@admin.register(NoteLink)
class NoteLinkAdmin(admin.ModelAdmin):
    list_display = ['source_note', 'target_note', 'link_text', 'created_at']
    search_fields = ['source_note__title', 'target_note__title', 'link_text']
    readonly_fields = ['id', 'created_at']


@admin.register(NoteTemplate)
class NoteTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'user', 'usage_count', 'is_default', 'is_system']
    list_filter = ['template_type', 'is_default', 'is_system', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['default_tags']
    readonly_fields = ['id', 'usage_count', 'created_at', 'updated_at']


@admin.register(NoteRevision)
class NoteRevisionAdmin(admin.ModelAdmin):
    list_display = ['note', 'title', 'word_count', 'edited_at']
    list_filter = ['edited_at']
    search_fields = ['note__title', 'title']
    readonly_fields = ['id', 'edited_at']


@admin.register(NoteAnalytics)
class NoteAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['note', 'word_count', 'view_count', 'edit_count', 'reading_time_minutes', 'last_viewed_at']
    list_filter = ['created_at']
    search_fields = ['note__title']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(QuickCapture)
class QuickCaptureAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'capture_type', 'is_processed', 'created_at']
    list_filter = ['capture_type', 'is_processed', 'created_at']
    search_fields = ['title', 'content', 'user__email']
    filter_horizontal = ['tags']
    readonly_fields = ['id', 'created_at']
