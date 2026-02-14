from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.pomodoro.views import PomodoroSettingsViewSet, PomodoroSessionViewSet
from apps.tasks.views import ProjectViewSet, TaskViewSet, TagViewSet
from apps.calendar.views import CalendarEventViewSet, CalendarPreferenceViewSet
from apps.health.views import (
    WaterIntakeSettingsViewSet,
    WaterLogViewSet,
    SleepLogViewSet,
    ExerciseTypeViewSet,
    ExerciseLogViewSet,
    BodyMetricsViewSet,
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'pomodoro/settings', PomodoroSettingsViewSet, basename='pomodoro-settings')
router.register(r'pomodoro/sessions', PomodoroSessionViewSet, basename='pomodoro-session')
router.register(r'calendar/events', CalendarEventViewSet, basename='calendar-event')
router.register(r'calendar/preferences', CalendarPreferenceViewSet, basename='calendar-preference')
router.register(r'health/water/settings', WaterIntakeSettingsViewSet, basename='water-settings')
router.register(r'health/water/logs', WaterLogViewSet, basename='water-log')
router.register(r'health/sleep', SleepLogViewSet, basename='sleep-log')
router.register(r'health/exercise/types', ExerciseTypeViewSet, basename='exercise-type')
router.register(r'health/exercise/logs', ExerciseLogViewSet, basename='exercise-log')
router.register(r'health/body-metrics', BodyMetricsViewSet, basename='body-metrics')

urlpatterns = [
    path('admin/', admin.site.urls),
    path(
        'api/v1/pomodoro/settings/',
        PomodoroSettingsViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}),
    ),
    path(
        'api/v1/health/water/settings/',
        WaterIntakeSettingsViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}),
    ),
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/', include('apps.core.urls')),
    path('api/v1/notes/', include('apps.notes.urls')),
    path('api/v1/', include('apps.habits.urls')),
]
