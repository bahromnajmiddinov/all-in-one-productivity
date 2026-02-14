from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import NoteFolder, NoteTag, Note, NoteChecklistItem
from .serializers import (
    NoteFolderSerializer, NoteTagSerializer, 
    NoteSerializer, NoteListSerializer, NoteChecklistItemSerializer
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
        root_folders = self.get_queryset().filter(parent=None)
        serializer = self.get_serializer(root_folders, many=True)
        return Response(serializer.data)


class NoteTagViewSet(viewsets.ModelViewSet):
    serializer_class = NoteTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NoteTag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']
    
    def get_queryset(self):
        queryset = Note.objects.filter(user=self.request.user, is_archived=False)
        
        # Filter by folder
        folder = self.request.query_params.get('folder')
        if folder:
            queryset = queryset.filter(folder_id=folder)
        
        # Filter by tag
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__id=tag)
        
        # Filter by favorites
        favorites = self.request.query_params.get('favorites')
        if favorites:
            queryset = queryset.filter(is_favorite=True)
        
        # Filter by pinned
        pinned = self.request.query_params.get('pinned')
        if pinned:
            queryset = queryset.filter(is_pinned=True)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NoteListSerializer
        return NoteSerializer
    
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


class NoteChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = NoteChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NoteChecklistItem.objects.filter(note__user=self.request.user)
    
    def perform_create(self, serializer):
        note_id = self.request.data.get('note')
        note = Note.objects.get(id=note_id, user=self.request.user)
        serializer.save(note=note)
