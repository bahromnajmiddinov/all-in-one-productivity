from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.pomodoro.views import PomodoroSettingsViewSet, PomodoroSessionViewSet
from apps.tasks.views import ProjectViewSet, TaskViewSet, TagViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'pomodoro/settings', PomodoroSettingsViewSet, basename='pomodoro-settings')
router.register(r'pomodoro/sessions', PomodoroSessionViewSet, basename='pomodoro-session')

urlpatterns = [
    path('admin/', admin.site.urls),
    path(
        'api/v1/pomodoro/settings/',
        PomodoroSettingsViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}),
    ),
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/', include('apps.core.urls')),
]
