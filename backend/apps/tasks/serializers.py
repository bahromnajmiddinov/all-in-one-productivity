from rest_framework import serializers
from .models import Project, Task, Tag, TaskDependency


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'color', 'order', 'is_archived', 'created_at']
        read_only_fields = ['id', 'created_at']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']
        read_only_fields = ['id']


class TaskSerializer(serializers.ModelSerializer):
    project_info = ProjectSerializer(source='project', read_only=True)
    tags_info = TagSerializer(source='tags', many=True, read_only=True)
    subtasks = serializers.SerializerMethodField()
    depends_on_ids = serializers.SerializerMethodField()
    is_urgent = serializers.ReadOnlyField()
    is_important = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'due_date', 'project', 'project_info', 'parent',
            'estimated_minutes', 'actual_minutes', 'energy_level', 'recurrence_rule',
            'tags', 'tags_info', 'depends_on', 'depends_on_ids',
            'subtasks', 'order', 'created_at', 'completed_at',
            'is_urgent', 'is_important',
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']

    def get_subtasks(self, obj):
        depth = self.context.get('subtask_depth', 3)
        current = self.context.get('_current_depth', 0)
        if current >= depth:
            return []
        child_ctx = {**self.context, '_current_depth': current + 1}
        return TaskSerializer(obj.subtasks.all().order_by('order', 'created_at'), many=True, context=child_ctx).data

    def get_depends_on_ids(self, obj):
        return list(obj.dependency_outgoing.values_list('depends_on_task_id', flat=True))


class TaskDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDependency
        fields = ['id', 'task', 'depends_on_task']

    def validate(self, attrs):
        if attrs['task'] == attrs['depends_on_task']:
            raise serializers.ValidationError('Task cannot depend on itself.')
        return attrs
