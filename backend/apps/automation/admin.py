from django.contrib import admin

from .models import (
    AutomationRule,
    BatchOperation,
    ExternalIntegration,
    SmartNotification,
    TaskHabitLink,
    VoiceCommand,
)


@admin.register(TaskHabitLink)
class TaskHabitLinkAdmin(admin.ModelAdmin):
    list_display = ('task', 'habit', 'user', 'trigger_on_complete', 'completion_source', 'created_at')
    list_filter = ('trigger_on_complete', 'completion_source', 'user')
    search_fields = ('task__title', 'habit__name')


@admin.register(SmartNotification)
class SmartNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'context_type', 'scheduled_for', 'sent_at')
    list_filter = ('status', 'context_type', 'user')
    search_fields = ('title', 'message')


@admin.register(AutomationRule)
class AutomationRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'trigger_type', 'action_type', 'is_active', 'updated_at')
    list_filter = ('trigger_type', 'action_type', 'is_active', 'user')
    search_fields = ('name', 'description')


@admin.register(ExternalIntegration)
class ExternalIntegrationAdmin(admin.ModelAdmin):
    list_display = ('provider', 'category', 'user', 'status', 'last_sync_at')
    list_filter = ('category', 'status', 'user')
    search_fields = ('provider',)


@admin.register(VoiceCommand)
class VoiceCommandAdmin(admin.ModelAdmin):
    list_display = ('transcript', 'user', 'intent', 'status', 'processed_at', 'created_at')
    list_filter = ('status', 'intent', 'user')
    search_fields = ('transcript',)


@admin.register(BatchOperation)
class BatchOperationAdmin(admin.ModelAdmin):
    list_display = ('target_type', 'action_type', 'user', 'status', 'created_at', 'completed_at')
    list_filter = ('target_type', 'action_type', 'status', 'user')
    search_fields = ('error_message',)
