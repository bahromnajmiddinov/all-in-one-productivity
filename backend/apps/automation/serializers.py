from rest_framework import serializers

from .models import (
    AutomationRule,
    BatchOperation,
    ExternalIntegration,
    SmartNotification,
    TaskHabitLink,
    VoiceCommand,
)


class TaskHabitLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskHabitLink
        fields = [
            'id',
            'task',
            'habit',
            'trigger_on_complete',
            'completion_source',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SmartNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmartNotification
        fields = [
            'id',
            'title',
            'message',
            'context_type',
            'context_payload',
            'location_context',
            'scheduled_for',
            'sent_at',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'sent_at', 'created_at']


class AutomationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationRule
        fields = [
            'id',
            'name',
            'description',
            'trigger_type',
            'condition',
            'action_type',
            'action_payload',
            'is_active',
            'last_triggered_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'last_triggered_at', 'created_at', 'updated_at']


class ExternalIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalIntegration
        fields = [
            'id',
            'provider',
            'category',
            'auth_type',
            'status',
            'config',
            'last_sync_at',
            'created_at',
        ]
        read_only_fields = ['id', 'last_sync_at', 'created_at']


class VoiceCommandSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceCommand
        fields = [
            'id',
            'transcript',
            'intent',
            'action_payload',
            'status',
            'processed_at',
            'created_at',
        ]
        read_only_fields = ['id', 'processed_at', 'created_at']


class BatchOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchOperation
        fields = [
            'id',
            'target_type',
            'action_type',
            'target_ids',
            'payload',
            'status',
            'result_summary',
            'error_message',
            'created_at',
            'completed_at',
        ]
        read_only_fields = ['id', 'status', 'result_summary', 'error_message', 'created_at', 'completed_at']
