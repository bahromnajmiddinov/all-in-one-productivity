from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MoodScaleViewSet, MoodEntryViewSet, MoodFactorViewSet,
    EmotionViewSet, MoodTriggerViewSet, MoodCorrelationViewSet,
    MoodInsightViewSet, MoodStatsViewSet, MoodJournalLinkViewSet
)

router = DefaultRouter()
router.register(r'scales', MoodScaleViewSet, basename='mood-scale')
router.register(r'entries', MoodEntryViewSet, basename='mood-entry')
router.register(r'factors', MoodFactorViewSet, basename='mood-factor')
router.register(r'emotions', EmotionViewSet, basename='mood-emotion')
router.register(r'triggers', MoodTriggerViewSet, basename='mood-trigger')
router.register(r'correlations', MoodCorrelationViewSet, basename='mood-correlation')
router.register(r'insights', MoodInsightViewSet, basename='mood-insight')
router.register(r'stats', MoodStatsViewSet, basename='mood-stats')
router.register(r'journal-links', MoodJournalLinkViewSet, basename='mood-journal-link')

urlpatterns = [
    path('', include(router.urls)),
]
