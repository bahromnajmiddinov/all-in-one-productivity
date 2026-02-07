from rest_framework import serializers
from .models import Project, Task, Tag

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
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'priority', 
                  'due_date', 'project', 'project_info', 'parent',
                  'tags', 'tags_info', 'subtasks', 'order', 
                  'created_at', 'completed_at']
        read_only_fields = ['id', 'created_at', 'completed_at']
    
    def get_subtasks(self, obj):
        # Prevent infinite recursion by not serializing subtasks of subtasks if needed
        # but the task says "Subtasks are returned nested in API response"
        # and "subtasks = serializers.SerializerMethodField()"
        return TaskSerializer(obj.subtasks.all(), many=True).data
