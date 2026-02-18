from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, TagViewSet, TaskTimeLogViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'tasks/time-logs', TaskTimeLogViewSet, basename='task-time-log')

urlpatterns = [
    path('', include(router.urls)),
]
