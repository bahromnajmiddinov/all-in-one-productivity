from django.contrib import admin
from .models import (
    JournalTag, JournalMood, JournalPrompt, JournalTemplate,
    JournalEntry, JournalStreak, EntryAnalytics, JournalReminder, JournalStats
)


@admin.register(JournalTag)
class JournalTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'icon']
    list_filter = ['user']
    search_fields = ['name']


@admin.register(JournalMood)
class JournalMoodAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'mood', 'energy_level', 'stress_level', 'sleep_quality']
    list_filter = ['mood', 'date', 'user']
    date_hierarchy = 'date'


@admin.register(JournalPrompt)
class JournalPromptAdmin(admin.ModelAdmin):
    list_display = ['question', 'prompt_type', 'difficulty', 'usage_count', 'is_system']
    list_filter = ['prompt_type', 'difficulty', 'is_system']
    search_fields = ['question', 'suggestions']
    readonly_fields = ['usage_count']


@admin.register(JournalTemplate)
class JournalTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'user', 'usage_count', 'is_system', 'is_default']
    list_filter = ['template_type', 'is_system', 'is_default', 'user']
    search_fields = ['name', 'description']
    readonly_fields = ['usage_count']


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'entry_date', 'word_count', 'is_favorite', 'created_at']
    list_filter = ['entry_date', 'is_favorite', 'is_private', 'template', 'user']
    search_fields = ['title', 'content']
    date_hierarchy = 'entry_date'
    filter_horizontal = ['tags']


@admin.register(JournalStreak)
class JournalStreakAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_streak', 'last_entry_date', 'best_streak', 'total_entries']
    list_filter = ['current_streak', 'best_streak']


@admin.register(EntryAnalytics)
class EntryAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['entry', 'word_count', 'sentiment_score', 'sentiment_label', 'view_count', 'edit_count']
    list_filter = ['sentiment_label']
    search_fields = ['entry__title', 'entry__content']


@admin.register(JournalReminder)
class JournalReminderAdmin(admin.ModelAdmin):
    list_display = ['user', 'entry', 'reminder_type', 'next_reminder_date', 'is_sent', 'is_dismissed']
    list_filter = ['reminder_type', 'is_sent', 'is_dismissed', 'next_reminder_date']
    date_hierarchy = 'next_reminder_date'


@admin.register(JournalStats)
class JournalStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_entries', 'current_streak', 'longest_streak', 'avg_mood']
    list_filter = ['current_streak', 'longest_streak']
