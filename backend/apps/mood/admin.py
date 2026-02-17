from django.contrib import admin
from .models import (
    MoodScale, MoodEntry, MoodFactor, Emotion, MoodTrigger,
    MoodCorrelation, MoodInsight, MoodStats, MoodJournalLink
)


@admin.register(MoodScale)
class MoodScaleAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'scale_type', 'min_value', 'max_value', 'is_default', 'is_active']
    list_filter = ['scale_type', 'is_default', 'is_active', 'created_at']
    search_fields = ['name', 'user__email']


class MoodFactorInline(admin.TabularInline):
    model = MoodFactor
    extra = 0


class EmotionInline(admin.TabularInline):
    model = Emotion
    extra = 0


class MoodTriggerInline(admin.TabularInline):
    model = MoodTrigger
    extra = 0


@admin.register(MoodEntry)
class MoodEntryAdmin(admin.ModelAdmin):
    list_display = ['user', 'mood_value', 'time_of_day', 'entry_date', 'entry_time', 'created_at']
    list_filter = ['time_of_day', 'entry_date', 'created_at']
    search_fields = ['user__email', 'notes']
    date_hierarchy = 'entry_date'
    inlines = [MoodFactorInline, EmotionInline, MoodTriggerInline]


@admin.register(MoodFactor)
class MoodFactorAdmin(admin.ModelAdmin):
    list_display = ['category', 'impact', 'rating', 'mood_entry', 'created_at']
    list_filter = ['category', 'impact', 'created_at']


@admin.register(Emotion)
class EmotionAdmin(admin.ModelAdmin):
    list_display = ['primary_emotion', 'specific_emotion', 'intensity', 'is_dominant', 'mood_entry']
    list_filter = ['primary_emotion', 'intensity', 'is_dominant']


@admin.register(MoodTrigger)
class MoodTriggerAdmin(admin.ModelAdmin):
    list_display = ['trigger_type', 'is_positive', 'mood_entry', 'created_at']
    list_filter = ['trigger_type', 'is_positive']


@admin.register(MoodCorrelation)
class MoodCorrelationAdmin(admin.ModelAdmin):
    list_display = ['correlation_type', 'coefficient', 'strength', 'user', 'computed_at']
    list_filter = ['correlation_type', 'strength', 'computed_at']


@admin.register(MoodInsight)
class MoodInsightAdmin(admin.ModelAdmin):
    list_display = ['title', 'insight_type', 'confidence', 'is_dismissed', 'user', 'created_at']
    list_filter = ['insight_type', 'is_dismissed', 'created_at']


@admin.register(MoodStats)
class MoodStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_entries', 'current_streak', 'avg_mood_7d', 'avg_mood_30d', 'updated_at']


@admin.register(MoodJournalLink)
class MoodJournalLinkAdmin(admin.ModelAdmin):
    list_display = ['mood_entry', 'journal_entry', 'created_at']
