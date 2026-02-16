from rest_framework import serializers
from .models import (
    NoteFolder, NoteTag, Note, NoteChecklistItem,
    NoteAttachment, NoteLink, NoteTemplate, NoteRevision,
    NoteAnalytics, QuickCapture
)


class NoteFolderSerializer(serializers.ModelSerializer):
    note_count = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = NoteFolder
        fields = ['id', 'name', 'color', 'icon', 'parent', 'is_default', 'note_count', 'full_path', 'children', 'created_at']
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
    
    def get_children(self, obj):
        if hasattr(obj, 'children'):
            return NoteFolderSerializer(obj.children.all(), many=True).data
        return []


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


class NoteAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = NoteAttachment
        fields = ['id', 'attachment_type', 'file', 'file_url', 'url', 'title', 'description', 
                  'file_size', 'mime_type', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class NoteLinkSerializer(serializers.ModelSerializer):
    target_note_title = serializers.CharField(source='target_note.title', read_only=True)
    target_note_id = serializers.UUIDField(source='target_note.id', read_only=True)
    
    class Meta:
        model = NoteLink
        fields = ['id', 'target_note', 'target_note_id', 'target_note_title', 'link_text', 'context', 'created_at']
        read_only_fields = ['id', 'created_at']


class BacklinkSerializer(serializers.ModelSerializer):
    source_note_title = serializers.CharField(source='source_note.title', read_only=True)
    source_note_id = serializers.UUIDField(source='source_note.id', read_only=True)
    
    class Meta:
        model = NoteLink
        fields = ['id', 'source_note_id', 'source_note_title', 'link_text', 'context', 'created_at']
        read_only_fields = ['id', 'created_at']


class NoteTemplateSerializer(serializers.ModelSerializer):
    default_tags = NoteTagSerializer(many=True, read_only=True)
    default_tag_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    
    class Meta:
        model = NoteTemplate
        fields = [
            'id', 'name', 'template_type', 'description', 'icon', 'color',
            'title_template', 'content_template', 'default_tags', 'default_tag_ids',
            'default_folder', 'is_default', 'is_system', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        default_tag_ids = validated_data.pop('default_tag_ids', [])
        template = super().create(validated_data)
        if default_tag_ids:
            template.default_tags.set(default_tag_ids)
        return template
    
    def update(self, instance, validated_data):
        default_tag_ids = validated_data.pop('default_tag_ids', None)
        template = super().update(instance, validated_data)
        if default_tag_ids is not None:
            template.default_tags.set(default_tag_ids)
        return template


class NoteRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteRevision
        fields = ['id', 'title', 'word_count', 'edited_at']
        read_only_fields = ['id', 'edited_at']


class NoteAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteAnalytics
        fields = [
            'word_count', 'character_count', 'reading_time_minutes',
            'view_count', 'edit_count', 'outgoing_link_count', 'incoming_link_count',
            'first_viewed_at', 'last_viewed_at', 'last_edited_at'
        ]


class QuickCaptureSerializer(serializers.ModelSerializer):
    tags = NoteTagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)
    
    class Meta:
        model = QuickCapture
        fields = [
            'id', 'capture_type', 'content', 'title',
            'source_url', 'source_title', 'audio_file',
            'transcription', 'duration_seconds',
            'folder', 'tags', 'tag_ids',
            'is_processed', 'converted_note',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'is_processed', 'converted_note']
    
    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        capture = super().create(validated_data)
        if tag_ids:
            capture.tags.set(tag_ids)
        return capture


class NoteListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    preview = serializers.SerializerMethodField()
    tag_list = NoteTagSerializer(source='tags', many=True, read_only=True)
    word_count = serializers.SerializerMethodField()
    link_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'preview', 'note_type', 'folder_name', 
            'is_pinned', 'is_favorite', 'is_archived',
            'tag_list', 'word_count', 'link_count',
            'created_at', 'updated_at'
        ]
    
    def get_preview(self, obj):
        # Return first 150 characters of content
        content = obj.content or ''
        if len(content) > 150:
            return content[:150] + '...'
        return content
    
    def get_word_count(self, obj):
        if hasattr(obj, 'analytics'):
            return obj.analytics.word_count
        return len(obj.content.split()) if obj.content else 0
    
    def get_link_count(self, obj):
        return obj.outgoing_links.count()


class NoteSerializer(serializers.ModelSerializer):
    folder_info = NoteFolderSerializer(source='folder', read_only=True)
    tags_info = NoteTagSerializer(source='tags', many=True, read_only=True)
    checklist_items = NoteChecklistItemSerializer(many=True, read_only=True)
    attachments = NoteAttachmentSerializer(many=True, read_only=True)
    outgoing_links = NoteLinkSerializer(many=True, read_only=True)
    backlinks = serializers.SerializerMethodField()
    analytics = NoteAnalyticsSerializer(read_only=True)
    revisions = NoteRevisionSerializer(many=True, read_only=True)
    linked_notes = serializers.SerializerMethodField()
    template_info = NoteTemplateSerializer(source='template', read_only=True)
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'rendered_content', 'note_type',
            'folder', 'folder_info', 'tags', 'tags_info',
            'is_pinned', 'is_archived', 'is_favorite',
            'checklist_items', 'attachments', 
            'outgoing_links', 'backlinks', 'linked_notes',
            'analytics', 'revisions', 'template', 'template_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'rendered_content']
    
    def get_backlinks(self, obj):
        backlinks = NoteLink.objects.filter(target_note=obj).select_related('source_note')[:20]
        return BacklinkSerializer(backlinks, many=True).data
    
    def get_linked_notes(self, obj):
        """Get IDs of all linked notes for graph view"""
        outgoing = list(obj.outgoing_links.values_list('target_note_id', flat=True))
        incoming = list(obj.incoming_links.values_list('source_note_id', flat=True))
        return list(set(outgoing + incoming))


class NoteGraphNodeSerializer(serializers.ModelSerializer):
    """Serializer for knowledge graph nodes"""
    link_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'note_type', 'is_favorite', 'link_count', 'updated_at']
    
    def get_link_count(self, obj):
        return obj.outgoing_links.count() + obj.incoming_links.count()


class NoteGraphEdgeSerializer(serializers.ModelSerializer):
    """Serializer for knowledge graph edges"""
    source = serializers.UUIDField(source='source_note_id')
    target = serializers.UUIDField(source='target_note_id')
    
    class Meta:
        model = NoteLink
        fields = ['id', 'source', 'target', 'link_text']


class GlobalNoteAnalyticsSerializer(serializers.Serializer):
    """Serializer for global note analytics"""
    total_notes = serializers.IntegerField()
    total_words = serializers.IntegerField()
    notes_this_week = serializers.IntegerField()
    notes_this_month = serializers.IntegerField()
    most_active_day = serializers.CharField()
    most_used_tags = serializers.ListField()
    most_linked_notes = serializers.ListField()
    daily_creation_trend = serializers.ListField()


class WebClipSerializer(serializers.Serializer):
    """Serializer for web clip data"""
    url = serializers.URLField()
    title = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField(required=False, allow_blank=True)
    selected_text = serializers.CharField(required=False, allow_blank=True)
    folder = serializers.UUIDField(required=False, allow_null=True)
    tags = serializers.ListField(child=serializers.UUIDField(), required=False)
