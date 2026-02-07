from datetime import timedelta
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, Task, Tag
from .serializers import ProjectSerializer, TaskSerializer, TagSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(user=self.request.user, is_archived=False)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'priority', 'due_date']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at', 'order']
    ordering = ['order', '-created_at']
    
    def get_queryset(self):
        # The ticket says: return Task.objects.filter(user=self.request.user, parent=None)
        # This is likely to only show top-level tasks in the main list.
        return Task.objects.filter(user=self.request.user, parent=None)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        return Response({'status': 'completed'})
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        tasks = self.get_queryset().filter(due_date=today)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = timezone.now().date()
        week_later = today + timedelta(days=7)
        tasks = self.get_queryset().filter(due_date__range=[today, week_later])
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def inbox(self, request):
        tasks = self.get_queryset().filter(project=None)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
