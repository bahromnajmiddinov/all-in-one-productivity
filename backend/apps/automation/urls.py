from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AutomationRuleViewSet,
    BatchOperationViewSet,
    ExternalIntegrationViewSet,
    SmartNotificationViewSet,
    TaskHabitLinkViewSet,
    VoiceCommandViewSet,
)

router = DefaultRouter()
router.register(r'task-habit-links', TaskHabitLinkViewSet, basename='task-habit-link')
router.register(r'smart-notifications', SmartNotificationViewSet, basename='smart-notification')
router.register(r'automation-rules', AutomationRuleViewSet, basename='automation-rule')
router.register(r'integrations', ExternalIntegrationViewSet, basename='external-integration')
router.register(r'voice-commands', VoiceCommandViewSet, basename='voice-command')
router.register(r'batch-operations', BatchOperationViewSet, basename='batch-operation')

urlpatterns = [
    path('', include(router.urls)),
]
