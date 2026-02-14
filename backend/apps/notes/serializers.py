from rest_framework import serializers
from .models import NoteFolder, NoteTag, Note, NoteChecklistItem


class NoteFolderSerializer(serializers.ModelSerializer):
    note_count = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    
    class Meta:
        model = NoteFolder
        fields = ['id', 'name', 'color', 'icon', 'parent', 'is_default', 'note_count', 'full_path', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_note_count(self, obj):
        return obj.notes.filter(is_archived=False).count()
    
    def get_full_path(self, obj):
        path = [obj.name]
        current = obj
        while current.parent:
            path.insert(0, current.parent.name)
            current = current.parent
        return ' / '.join(path)


class NoteTagSerializer(serializers.ModelSerializer):
    note_count = serializers.SerializerMethodField()
    
    class Meta:
        model = NoteTag
        fields = ['id', 'name', 'color', 'note_count']
        read_only_fields = ['id']
    
    def get_note_count(self, obj):
        return obj.notes.filter(is_archived=False).count()


class NoteChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteChecklistItem
        fields = ['id', 'content', 'is_checked', 'order']
        read_only_fields = ['id']


class NoteSerializer(serializers.ModelSerializer):
    folder_info = NoteFolderSerializer(source='folder', read_only=True)
    tags_info = NoteTagSerializer(source='tags', many=True, read_only=True)
    checklist_items = NoteChecklistItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'note_type',
            'folder', 'folder_info', 'tags', 'tags_info',
            'is_pinned', 'is_archived', 'is_favorite',
            'checklist_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NoteListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'preview', 'folder_name', 'is_pinned', 'is_favorite', 'updated_at']
    
    def get_preview(self, obj):
        # Return first 150 characters of content
        return obj.content[:150] + '...' if len(obj.content) > 150 else obj.content
