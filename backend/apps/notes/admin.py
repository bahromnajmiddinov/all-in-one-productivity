from django.contrib import admin
from .models import NoteFolder, NoteTag, Note, NoteChecklistItem


@admin.register(NoteFolder)
class NoteFolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'parent', 'color', 'is_default', 'created_at']
    list_filter = ['is_default', 'created_at']
    search_fields = ['name', 'user__username']


@admin.register(NoteTag)
class NoteTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color']
    search_fields = ['name', 'user__username']


class NoteChecklistItemInline(admin.TabularInline):
    model = NoteChecklistItem
    extra = 0


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'folder', 'note_type', 'is_pinned', 'is_favorite', 'is_archived', 'updated_at']
    list_filter = ['note_type', 'is_pinned', 'is_favorite', 'is_archived', 'created_at']
    search_fields = ['title', 'content', 'user__username']
    filter_horizontal = ['tags']
    inlines = [NoteChecklistItemInline]


@admin.register(NoteChecklistItem)
class NoteChecklistItemAdmin(admin.ModelAdmin):
    list_display = ['content', 'note', 'is_checked', 'order']
    list_filter = ['is_checked']
    search_fields = ['content', 'note__title']
