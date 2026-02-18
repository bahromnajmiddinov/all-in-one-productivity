from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    AutomationRule,
    BatchOperation,
    ExternalIntegration,
    SmartNotification,
    TaskHabitLink,
    VoiceCommand,
)
from .serializers import (
    AutomationRuleSerializer,
    BatchOperationSerializer,
    ExternalIntegrationSerializer,
    SmartNotificationSerializer,
    TaskHabitLinkSerializer,
    VoiceCommandSerializer,
)


class TaskHabitLinkViewSet(viewsets.ModelViewSet):
    serializer_class = TaskHabitLinkSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['task', 'habit']

    def get_queryset(self):
        return TaskHabitLink.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SmartNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = SmartNotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'context_type']

    def get_queryset(self):
        return SmartNotification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        notification = self.get_object()
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save(update_fields=['status', 'sent_at'])
        return Response(self.get_serializer(notification).data)


class AutomationRuleViewSet(viewsets.ModelViewSet):
    serializer_class = AutomationRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['trigger_type', 'is_active']

    def get_queryset(self):
        return AutomationRule.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExternalIntegrationViewSet(viewsets.ModelViewSet):
    serializer_class = ExternalIntegrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'status', 'provider']

    def get_queryset(self):
        return ExternalIntegration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        integration = self.get_object()
        integration.last_sync_at = timezone.now()
        integration.status = 'connected'
        integration.save(update_fields=['last_sync_at', 'status'])
        return Response(self.get_serializer(integration).data)


class VoiceCommandViewSet(viewsets.ModelViewSet):
    serializer_class = VoiceCommandSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'intent']

    def get_queryset(self):
        return VoiceCommand.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        command = self.get_object()
        command.status = 'processed'
        command.processed_at = timezone.now()
        command.save(update_fields=['status', 'processed_at'])
        return Response(self.get_serializer(command).data)


class BatchOperationViewSet(viewsets.ModelViewSet):
    serializer_class = BatchOperationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['target_type', 'action_type', 'status']

    def get_queryset(self):
        return BatchOperation.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        operation = serializer.save(user=request.user)
        raw_execute = request.data.get('execute', True)
        execute = raw_execute if isinstance(raw_execute, bool) else str(raw_execute).lower() == 'true'
        if execute:
            try:
                operation.apply()
            except Exception as exc:
                operation.status = 'failed'
                operation.error_message = str(exc)
                operation.completed_at = timezone.now()
                operation.save(update_fields=['status', 'error_message', 'completed_at'])
                return Response(self.get_serializer(operation).data, status=status.HTTP_400_BAD_REQUEST)
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(operation).data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        operation = self.get_object()
        try:
            operation.apply()
        except Exception as exc:
            operation.status = 'failed'
            operation.error_message = str(exc)
            operation.completed_at = timezone.now()
            operation.save(update_fields=['status', 'error_message', 'completed_at'])
            return Response(self.get_serializer(operation).data, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(operation).data)
