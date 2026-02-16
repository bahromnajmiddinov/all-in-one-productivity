from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta, datetime
import re

from .models import (
    NoteFolder, NoteTag, Note, NoteChecklistItem,
    NoteAttachment, NoteLink, NoteTemplate, NoteRevision,
    NoteAnalytics, QuickCapture
)
from .serializers import (
    NoteFolderSerializer, NoteTagSerializer, 
    NoteSerializer, NoteListSerializer, NoteChecklistItemSerializer,
    NoteAttachmentSerializer, NoteLinkSerializer, NoteTemplateSerializer,
    NoteRevisionSerializer, NoteAnalyticsSerializer, QuickCaptureSerializer,
    NoteGraphNodeSerializer, NoteGraphEdgeSerializer,
    GlobalNoteAnalyticsSerializer, WebClipSerializer
)


class NoteFolderViewSet(viewsets.ModelViewSet):
    serializer_class = NoteFolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NoteFolder.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get folder tree structure"""
        root_folders = self.get_queryset().filter(parent=None).prefetch_related('children')
        serializer = self.get_serializer(root_folders, many=True)
        return Response(serializer.data)


class NoteTagViewSet(viewsets.ModelViewSet):
    serializer_class = NoteTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NoteTag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most frequently used tags"""
        tags = self.get_queryset().annotate(
            note_count_active=Count('notes', filter=Q(notes__is_archived=False))
        ).order_by('-note_count_active')[:10]
        serializer = self.get_serializer(tags, many=True)
        return Response(serializer.data)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']
    
    def get_queryset(self):
        queryset = Note.objects.filter(user=self.request.user)
        
        # Filter by archived status
        archived = self.request.query_params.get('archived')
        if archived == 'true':
            queryset = queryset.filter(is_archived=True)
        elif archived != 'all':
            queryset = queryset.filter(is_archived=False)
        
        # Filter by folder
        folder = self.request.query_params.get('folder')
        if folder:
            queryset = queryset.filter(folder_id=folder)
        
        # Filter by tag
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__id=tag)
        
        # Filter by note type
        note_type = self.request.query_params.get('note_type')
        if note_type:
            queryset = queryset.filter(note_type=note_type)
        
        # Filter by favorites
        favorites = self.request.query_params.get('favorites')
        if favorites:
            queryset = queryset.filter(is_favorite=True)
        
        # Filter by pinned
        pinned = self.request.query_params.get('pinned')
        if pinned:
            queryset = queryset.filter(is_pinned=True)
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(updated_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(updated_at__date__lte=date_to)
        
        # Full-text search in content
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )
        
        return queryset.select_related('folder', 'template').prefetch_related(
            'tags', 'checklist_items', 'attachments', 'outgoing_links', 'incoming_links', 'revisions'
        ).order_by('-is_pinned', '-updated_at')
    
    def perform_create(self, serializer):
        note = serializer.save(user=self.request.user)
        # Create analytics record
        NoteAnalytics.objects.create(note=note)
        # Process any [[link]] syntax in content
        self._process_note_links(note)
        return note
    
    def perform_update(self, serializer):
        note = serializer.instance
        # Save revision before updating
        note.save_revision()
        
        note = serializer.save()
        # Update analytics
        if hasattr(note, 'analytics'):
            note.analytics.update_stats()
            note.analytics.record_edit()
        # Re-process links
        self._process_note_links(note)
        return note
    
    def _process_note_links(self, note):
        """Process [[Note Title]] links and create NoteLink records"""
        if not note.content:
            return
        
        # Find all [[link]] patterns
        pattern = r'\[\[([^\]]+)\]\]'
        matches = re.findall(pattern, note.content)
        
        # Clear existing outgoing links
        note.outgoing_links.all().delete()
        
        # Create new links
        for link_text in matches:
            # Try to find note by exact title match
            target_notes = Note.objects.filter(
                user=note.user,
                title__iexact=link_text.strip()
            )
            
            if target_notes.exists():
                target = target_notes.first()
                if target.id != note.id:  # Don't link to self
                    NoteLink.objects.get_or_create(
                        source_note=note,
                        target_note=target,
                        defaults={'link_text': link_text}
                    )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NoteListSerializer
        return NoteSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Override to record view analytics"""
        instance = self.get_object()
        
        # Record view
        if hasattr(instance, 'analytics'):
            instance.analytics.record_view()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        note = self.get_object()
        note.is_pinned = not note.is_pinned
        note.save()
        return Response({'is_pinned': note.is_pinned})
    
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        note = self.get_object()
        note.is_favorite = not note.is_favorite
        note.save()
        return Response({'is_favorite': note.is_favorite})
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        note = self.get_object()
        note.is_archived = True
        note.save()
        return Response({'status': 'archived'})
    
    @action(detail=False, methods=['get'])
    def archived(self, request):
        """List archived notes"""
        notes = Note.objects.filter(user=request.user, is_archived=True)
        serializer = NoteListSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        note = self.get_object()
        note.is_archived = False
        note.save()
        return Response({'status': 'restored'})
    
    @action(detail=True, methods=['post'])
    def add_tag(self, request, pk=None):
        note = self.get_object()
        tag_id = request.data.get('tag_id')
        if tag_id:
            tag = NoteTag.objects.get(id=tag_id, user=request.user)
            note.tags.add(tag)
        return Response({'status': 'tag added'})
    
    @action(detail=True, methods=['post'])
    def remove_tag(self, request, pk=None):
        note = self.get_object()
        tag_id = request.data.get('tag_id')
        if tag_id:
            tag = NoteTag.objects.get(id=tag_id, user=request.user)
            note.tags.remove(tag)
        return Response({'status': 'tag removed'})
    
    @action(detail=True, methods=['post'])
    def add_link(self, request, pk=None):
        """Add a bidirectional link to another note"""
        note = self.get_object()
        target_id = request.data.get('target_note_id')
        link_text = request.data.get('link_text', '')
        
        if target_id:
            target = Note.objects.get(id=target_id, user=request.user)
            link, created = NoteLink.objects.get_or_create(
                source_note=note,
                target_note=target,
                defaults={'link_text': link_text}
            )
            if not created:
                link.link_text = link_text
                link.save()
            
            # Update analytics
            if hasattr(note, 'analytics'):
                note.analytics.update_stats()
            
            return Response({'status': 'link added', 'created': created})
        return Response({'error': 'target_note_id required'}, status=400)
    
    @action(detail=True, methods=['post'])
    def remove_link(self, request, pk=None):
        """Remove a link to another note"""
        note = self.get_object()
        target_id = request.data.get('target_note_id')
        
        if target_id:
            NoteLink.objects.filter(
                source_note=note,
                target_note_id=target_id
            ).delete()
            
            # Update analytics
            if hasattr(note, 'analytics'):
                note.analytics.update_stats()
            
            return Response({'status': 'link removed'})
        return Response({'error': 'target_note_id required'}, status=400)
    
    @action(detail=True, methods=['get'])
    def backlinks(self, request, pk=None):
        """Get all backlinks to this note"""
        note = self.get_object()
        backlinks = NoteLink.objects.filter(target_note=note).select_related('source_note')
        serializer = NoteLinkSerializer(backlinks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def quick_capture(self, request):
        """Quick capture endpoint for rapid note entry"""
        data = request.data.copy()
        data['user'] = request.user.id
        data['capture_type'] = data.get('capture_type', 'text')
        
        serializer = QuickCaptureSerializer(data=data)
        if serializer.is_valid():
            capture = serializer.save(user=request.user)
            
            # Auto-convert to note if requested
            if request.data.get('auto_convert', False):
                note = self._convert_capture_to_note(capture)
                return Response({
                    'capture': serializer.data,
                    'note_id': str(note.id),
                    'converted': True
                })
            
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
    def _convert_capture_to_note(self, capture):
        """Convert a quick capture to a full note"""
        note_type = 'text'
        if capture.capture_type == 'voice':
            note_type = 'voice'
        elif capture.capture_type == 'web_clip':
            note_type = 'web_clip'
        
        content = capture.content
        if capture.source_url:
            content += f"\n\nSource: {capture.source_url}"
        
        note = Note.objects.create(
            user=capture.user,
            title=capture.title or 'Quick Capture',
            content=content,
            note_type=note_type,
            folder=capture.folder
        )
        
        if capture.tags.exists():
            note.tags.set(capture.tags.all())
        
        capture.is_processed = True
        capture.converted_note = note
        capture.save()
        
        # Create analytics
        NoteAnalytics.objects.create(note=note)
        
        return note
    
    @action(detail=False, methods=['post'])
    def web_clip(self, request):
        """Clip content from a web page"""
        serializer = WebClipSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Create note from web clip
            content = data.get('content', '')
            if data.get('selected_text'):
                content = f"> {data['selected_text']}\n\n{content}"
            
            note_data = {
                'title': data.get('title') or 'Web Clip',
                'content': f"{content}\n\n---\nClipped from: {data['url']}",
                'note_type': 'web_clip',
            }
            
            if data.get('folder'):
                note_data['folder'] = data['folder']
            
            note = Note.objects.create(user=request.user, **note_data)
            
            if data.get('tags'):
                note.tags.set(data['tags'])
            
            NoteAnalytics.objects.create(note=note)
            
            return Response({
                'note_id': str(note.id),
                'status': 'created'
            }, status=201)
        return Response(serializer.errors, status=400)
    
    @action(detail=False, methods=['get'])
    def graph(self, request):
        """Get knowledge graph data for visualization"""
        # Get all non-archived notes
        notes = Note.objects.filter(user=request.user, is_archived=False)
        
        # Get all links
        links = NoteLink.objects.filter(
            source_note__user=request.user,
            target_note__is_archived=False,
            source_note__is_archived=False
        )
        
        nodes_serializer = NoteGraphNodeSerializer(notes, many=True)
        edges_serializer = NoteGraphEdgeSerializer(links, many=True)
        
        return Response({
            'nodes': nodes_serializer.data,
            'edges': edges_serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get global note analytics for the user"""
        user_notes = Note.objects.filter(user=request.user, is_archived=False)
        
        total_notes = user_notes.count()
        
        # Word count from analytics
        analytics_qs = NoteAnalytics.objects.filter(note__user=request.user)
        total_words = sum(a.word_count for a in analytics_qs)
        
        # Notes this week
        week_ago = timezone.now() - timedelta(days=7)
        notes_this_week = user_notes.filter(created_at__gte=week_ago).count()
        
        # Notes this month
        month_ago = timezone.now() - timedelta(days=30)
        notes_this_month = user_notes.filter(created_at__gte=month_ago).count()
        
        # Most active day
        daily_counts = user_notes.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(count=Count('id')).order_by('-count')
        most_active_day = daily_counts.first()['date'].strftime('%Y-%m-%d') if daily_counts else None
        
        # Most used tags
        popular_tags = NoteTag.objects.filter(
            user=request.user,
            notes__is_archived=False
        ).annotate(
            note_count=Count('notes')
        ).order_by('-note_count')[:5]
        
        # Most linked notes
        most_linked = user_notes.annotate(
            link_count=Count('incoming_links')
        ).filter(link_count__gt=0).order_by('-link_count')[:5]
        
        # Daily creation trend (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        daily_trend = user_notes.filter(
            created_at__gte=thirty_days_ago
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(count=Count('id')).order_by('date')
        
        data = {
            'total_notes': total_notes,
            'total_words': total_words,
            'notes_this_week': notes_this_week,
            'notes_this_month': notes_this_month,
            'most_active_day': most_active_day,
            'most_used_tags': [
                {'name': t.name, 'count': t.note_count} for t in popular_tags
            ],
            'most_linked_notes': [
                {'id': str(n.id), 'title': n.title, 'link_count': n.link_count} 
                for n in most_linked
            ],
            'daily_creation_trend': [
                {'date': item['date'].strftime('%Y-%m-%d'), 'count': item['count']}
                for item in daily_trend
            ]
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search with filters"""
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({'results': []})
        
        # Search in title and content
        notes = Note.objects.filter(
            user=request.user,
            is_archived=False
        ).filter(
            Q(title__icontains=query) | Q(content__icontains=query)
        )
        
        # Additional filters
        folder = request.query_params.get('folder')
        if folder:
            notes = notes.filter(folder_id=folder)
        
        tag = request.query_params.get('tag')
        if tag:
            notes = notes.filter(tags__id=tag)
        
        note_type = request.query_params.get('note_type')
        if note_type:
            notes = notes.filter(note_type=note_type)
        
        # Date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            notes = notes.filter(updated_at__date__gte=date_from)
        if date_to:
            notes = notes.filter(updated_at__date__lte=date_to)
        
        serializer = NoteListSerializer(notes[:50], many=True)
        return Response({'results': serializer.data, 'count': notes.count()})


class NoteChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = NoteChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NoteChecklistItem.objects.filter(note__user=self.request.user)
    
    def perform_create(self, serializer):
        note_id = self.request.data.get('note')
        note = Note.objects.get(id=note_id, user=self.request.user)
        serializer.save(note=note)


class NoteAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = NoteAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NoteAttachment.objects.filter(note__user=self.request.user)
    
    def perform_create(self, serializer):
        note_id = self.request.data.get('note')
        note = Note.objects.get(id=note_id, user=self.request.user)
        serializer.save(note=note)


class NoteTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = NoteTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return user's templates + system templates
        return NoteTemplate.objects.filter(
            models.Q(user=self.request.user) | models.Q(is_system=True)
        )
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use(self, request, pk=None):
        """Create a new note using this template"""
        template = self.get_object()
        
        # Increment usage count
        template.increment_usage()
        
        # Create note from template
        note = Note.objects.create(
            user=request.user,
            title=template.title_template or 'New Note',
            content=template.content_template or '',
            folder=template.default_folder,
            template=template
        )
        
        if template.default_tags.exists():
            note.tags.set(template.default_tags.all())
        
        # Create analytics
        NoteAnalytics.objects.create(note=note)
        
        return Response({
            'note_id': str(note.id),
            'status': 'created from template'
        })
    
    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """Get default/system templates"""
        templates = NoteTemplate.objects.filter(
            models.Q(is_system=True) | models.Q(is_default=True, user=request.user)
        )
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class QuickCaptureViewSet(viewsets.ModelViewSet):
    serializer_class = QuickCaptureSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuickCapture.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """Convert quick capture to full note"""
        capture = self.get_object()
        
        # Create note from capture
        content = capture.content
        if capture.source_url:
            content += f"\n\nSource: {capture.source_url}"
        
        note = Note.objects.create(
            user=request.user,
            title=capture.title or 'Quick Capture',
            content=content,
            note_type=capture.capture_type,
            folder=capture.folder
        )
        
        if capture.tags.exists():
            note.tags.set(capture.tags.all())
        
        capture.is_processed = True
        capture.converted_note = note
        capture.save()
        
        NoteAnalytics.objects.create(note=note)
        
        return Response({
            'note_id': str(note.id),
            'status': 'converted'
        })


class NoteAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NoteAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NoteAnalytics.objects.filter(note__user=self.request.user)
