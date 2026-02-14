from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HabitViewSet, HabitCompletionViewSet

router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'completions', HabitCompletionViewSet, basename='habit-completion')
from .views import HabitCategoryViewSet, HabitReminderViewSet, HabitStackViewSet
router.register(r'categories', HabitCategoryViewSet, basename='habit-category')
router.register(r'reminders', HabitReminderViewSet, basename='habit-reminder')
router.register(r'stacks', HabitStackViewSet, basename='habit-stack')

urlpatterns = [
    path('', include(router.urls)),
]
