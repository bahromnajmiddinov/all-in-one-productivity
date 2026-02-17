from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    JournalTagViewSet, JournalMoodViewSet, JournalPromptViewSet,
    JournalTemplateViewSet, JournalEntryViewSet, EntryAnalyticsViewSet,
    JournalStreakViewSet, JournalReminderViewSet, JournalStatsViewSet
)

router = DefaultRouter()
router.register(r'tags', JournalTagViewSet, basename='journal-tags')
router.register(r'moods', JournalMoodViewSet, basename='journal-moods')
router.register(r'prompts', JournalPromptViewSet, basename='journal-prompts')
router.register(r'templates', JournalTemplateViewSet, basename='journal-templates')
router.register(r'entries', JournalEntryViewSet, basename='journal-entries')
router.register(r'analytics', EntryAnalyticsViewSet, basename='journal-analytics')
router.register(r'streaks', JournalStreakViewSet, basename='journal-streaks')
router.register(r'reminders', JournalReminderViewSet, basename='journal-reminders')
router.register(r'stats', JournalStatsViewSet, basename='journal-stats')

urlpatterns = [
    path('', include(router.urls)),
]
