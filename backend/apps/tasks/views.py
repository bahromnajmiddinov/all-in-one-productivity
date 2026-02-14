from collections import defaultdict
from datetime import timedelta
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.pomodoro.models import PomodoroSession
from .models import Project, Task, Tag
from .serializers import ProjectSerializer, TaskSerializer, TagSerializer


def next_recurrence_date(rule, from_date):
    """Return next due date from recurrence rule. from_date is the completed task's due_date or today."""
    if not rule or not from_date:
        return None
    freq = rule.get('frequency', 'daily')
    interval = rule.get('interval', 1)
    weekdays = rule.get('weekdays')  # 0=Mon, 6=Sun
    if freq == 'daily':
        return from_date + timedelta(days=interval)
    if freq == 'weekly':
        if weekdays:
            # Next occurrence on one of weekdays
            for d in range(1, 8):
                candidate = from_date + timedelta(days=d)
                if candidate.weekday() in weekdays:
                    return candidate
        return from_date + timedelta(weeks=interval)
    if freq == 'monthly':
        year = from_date.year
        month = from_date.month + interval
        while month > 12:
            month -= 12
            year += 1
        day = min(from_date.day, 28)
        try:
            return from_date.replace(year=year, month=month, day=day)
        except ValueError:
            return from_date.replace(year=year, month=month, day=28)
    return from_date + timedelta(days=1)


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
        return Task.objects.filter(user=self.request.user, parent=None)

    def get_full_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        # Create next occurrence for recurring tasks
        rule = task.recurrence_rule
        from_date = task.due_date or timezone.now().date()
        next_due = next_recurrence_date(rule, from_date) if rule else None
        if next_due:
            Task.objects.create(
                user=task.user,
                project=task.project,
                parent=task.parent,
                title=task.title,
                description=task.description or '',
                status='inbox',
                priority=task.priority,
                due_date=next_due,
                estimated_minutes=task.estimated_minutes,
                energy_level=task.energy_level,
                recurrence_rule=task.recurrence_rule,
                order=task.order,
            )
        return Response({'status': 'completed', 'next_due': str(next_due) if next_due else None})

    @action(detail=False, methods=['get'])
    def eisenhower(self, request):
        """Return tasks grouped by Eisenhower quadrants: urgent+important, not urgent+important, urgent+not important, neither."""
        qs = self.get_queryset().filter(status__in=['inbox', 'active'])
        quadrants = {
            'urgent_important': [],   # P4
            'not_urgent_important': [],  # P3
            'urgent_not_important': [],  # P2
            'not_urgent_not_important': [],  # P1
        }
        for task in qs:
            if task.priority == 4:
                quadrants['urgent_important'].append(task)
            elif task.priority == 3:
                quadrants['not_urgent_important'].append(task)
            elif task.priority == 2:
                quadrants['urgent_not_important'].append(task)
            else:
                quadrants['not_urgent_not_important'].append(task)
        serializer = self.get_serializer
        return Response({
            'urgent_important': TaskSerializer(quadrants['urgent_important'], many=True).data,
            'not_urgent_important': TaskSerializer(quadrants['not_urgent_important'], many=True).data,
            'urgent_not_important': TaskSerializer(quadrants['urgent_not_important'], many=True).data,
            'not_urgent_not_important': TaskSerializer(quadrants['not_urgent_not_important'], many=True).data,
        })

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Completion rates, overdue count, time estimation accuracy."""
        user = request.user
        today = timezone.now().date()
        days = int(request.query_params.get('days', 30))
        start = today - timedelta(days=days)
        qs = self.get_full_queryset().filter(created_at__date__gte=start)
        total = qs.count()
        completed = qs.filter(status='completed').count()
        completion_rate = round(100.0 * completed / total, 1) if total else 0
        overdue_count = self.get_full_queryset().filter(
            due_date__lt=today, status__in=['inbox', 'active']
        ).count()
        with_estimate = qs.filter(estimated_minutes__isnull=False).exclude(estimated_minutes=0)
        with_actual = with_estimate.filter(actual_minutes__isnull=False).exclude(actual_minutes=0)
        estimation_count = with_actual.count()
        if estimation_count:
            accuracy_sum = 0
            for t in with_actual:
                diff = abs((t.actual_minutes or 0) - (t.estimated_minutes or 0))
                accuracy_sum += max(0, 100 - (100 * diff / max(t.estimated_minutes, 1)))
            estimation_accuracy = round(accuracy_sum / estimation_count, 1)
        else:
            estimation_accuracy = None
        return Response({
            'completion_rate': completion_rate,
            'total_tasks': total,
            'completed_count': completed,
            'overdue_count': overdue_count,
            'estimation_accuracy': estimation_accuracy,
            'estimation_sample_count': estimation_count,
        })

    @action(detail=False, methods=['get'])
    def distribution(self, request):
        """Tasks by project, priority, status."""
        user = request.user
        qs = self.get_full_queryset().filter(status__in=['inbox', 'active'])
        by_project = list(
            qs.values('project__name').annotate(count=Count('id')).order_by('-count')
        )
        by_priority = list(
            qs.values('priority').annotate(count=Count('id')).order_by('priority')
        )
        by_status = list(
            qs.values('status').annotate(count=Count('id')).order_by('status')
        )
        return Response({
            'by_project': [{'name': p['project__name'] or 'No project', 'count': p['count']} for p in by_project],
            'by_priority': [{'priority': p['priority'], 'count': p['count']} for p in by_priority],
            'by_status': [{'status': p['status'], 'count': p['count']} for p in by_status],
        })

    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        """Task completion intensity by day (for calendar heatmap)."""
        user = request.user
        days = int(request.query_params.get('days', 365))
        today = timezone.now().date()
        start = today - timedelta(days=days)
        qs = self.get_full_queryset().filter(
            status='completed',
            completed_at__date__gte=start,
            completed_at__date__lte=today,
        )
        by_date = defaultdict(int)
        for t in qs:
            if t.completed_at:
                by_date[t.completed_at.date().isoformat()] += 1
        return Response({'completions': dict(by_date)})

    @action(detail=True, methods=['get'])
    def time_logged(self, request, pk=None):
        """Total focus time logged for this task via Pomodoro sessions."""
        task = self.get_object()
        total = PomodoroSession.objects.filter(
            task=task, session_type='work', completed=True
        ).aggregate(s=Sum('duration'))['s'] or 0
        return Response({'minutes': total})

    @action(detail=True, methods=['post'])
    def skip_recurrence(self, request, pk=None):
        """Mark this task's next occurrence as skipped (delete if it's the only next, or set due_date to None). Not creating next is already optional; this can set recurrence_rule to null to stop."""
        task = self.get_object()
        task.recurrence_rule = None
        task.save(update_fields=['recurrence_rule'])
        return Response({'status': 'recurrence_removed'})

    @action(detail=True, methods=['post'])
    def reschedule_recurrence(self, request, pk=None):
        """Reschedule due_date for this task (recurring instance)."""
        task = self.get_object()
        new_date = request.data.get('due_date')
        if not new_date:
            return Response({'detail': 'due_date required'}, status=status.HTTP_400_BAD_REQUEST)
        task.due_date = new_date
        task.save(update_fields=['due_date'])
        return Response({'due_date': str(task.due_date)})

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        tasks = self.get_queryset().filter(due_date=today)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            due_date__lt=today,
            status__in=['inbox', 'active'],
        )
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
