from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PomodoroSettingsViewSet,
    PomodoroSessionViewSet,
    DistractionLogViewSet,
    FocusStreakViewSet,
    DeepWorkSessionViewSet,
)

router = DefaultRouter()
router.register(r'sessions', PomodoroSessionViewSet, basename='pomodoro-session')
router.register(r'distractions', DistractionLogViewSet, basename='distraction-log')
router.register(r'streak', FocusStreakViewSet, basename='focus-streak')
router.register(r'deep-work', DeepWorkSessionViewSet, basename='deep-work-session')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'settings/',
        PomodoroSettingsViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}),
        name='pomodoro-settings'
    ),
]
