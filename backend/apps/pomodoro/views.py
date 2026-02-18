from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, Sum, Q, F, FloatField, Case, When, Value
from django.db.models.functions import ExtractHour, ExtractWeekDay
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from collections import defaultdict

from .models import (
    PomodoroSettings, 
    PomodoroSession, 
    DistractionLog, 
    FocusStreak,
    DeepWorkSession
)
from .serializers import (
    PomodoroSettingsSerializer,
    PomodoroSessionSerializer,
    PomodoroSessionCreateSerializer,
    PomodoroSessionUpdateSerializer,
    DistractionLogSerializer,
    FocusStreakSerializer,
    DeepWorkSessionSerializer,
    PomodoroStatsSerializer,
    TimeOfDayAnalyticsSerializer,
    DailyAnalyticsSerializer,
    ProjectAnalyticsSerializer,
    ProductivityScoreSerializer,
)
from apps.tasks.models import TaskTimeLog


class PomodoroSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = PomodoroSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PomodoroSettings.objects.filter(user=self.request.user)

    def get_object(self):
        obj, _ = PomodoroSettings.objects.get_or_create(
            user=self.request.user,
            defaults={
                'work_duration': 25,
                'short_break': 5,
                'long_break': 15,
                'long_break_interval': 4,
                'daily_pomodoro_goal': 8,
            },
        )
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PomodoroSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PomodoroSession.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PomodoroSessionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PomodoroSessionUpdateSerializer
        return PomodoroSessionSerializer

    def perform_create(self, serializer):
        # Set project from task if not provided
        task = serializer.validated_data.get('task')
        project = serializer.validated_data.get('project')
        
        if task and not project:
            project = task.project
        
        session = serializer.save(user=self.request.user, project=project)
        
        # Update or create focus streak
        streak, _ = FocusStreak.objects.get_or_create(user=self.request.user)
        streak.reset_streak()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        session = self.get_object()
        session.completed = True
        session.ended_at = timezone.now()
        session.save()

        if session.session_type == 'work' and session.task:
            TaskTimeLog.objects.get_or_create(
                pomodoro_session=session,
                defaults={
                    'user': session.user,
                    'task': session.task,
                    'source': 'pomodoro',
                    'minutes': session.duration,
                    'started_at': session.started_at,
                    'ended_at': session.ended_at,
                    'notes': session.notes,
                },
            )
        
        # Update streak for completed work sessions
        if session.session_type == 'work':
            streak, _ = FocusStreak.objects.get_or_create(user=request.user)
            streak.record_session(session)
        
        return Response({'status': 'completed', 'session': PomodoroSessionSerializer(session).data})

    @action(detail=True, methods=['post'])
    def interrupt(self, request, pk=None):
        """Record an interruption for a session"""
        session = self.get_object()
        session.interruptions += 1
        session.save()
        
        # Create distraction log
        distraction_data = {
            'session': session.id,
            'distraction_type': request.data.get('distraction_type', 'other'),
            'description': request.data.get('description', ''),
        }
        
        serializer = DistractionLogSerializer(data=distraction_data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                'status': 'interrupted',
                'interruptions': session.interruptions,
                'distraction': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Mark session as resumed after interruption"""
        session = self.get_object()
        
        # Update the most recent distraction to mark as recovered
        distraction = session.distractions.filter(recovered=False).first()
        if distraction:
            distraction.recovered = True
            distraction.recovery_time_seconds = request.data.get('recovery_time_seconds')
            distraction.save()
        
        return Response({'status': 'resumed'})

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        sessions = self.get_queryset().filter(started_at__date=today)
        serializer = PomodoroSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get detailed session history with filtering"""
        queryset = self.get_queryset()
        
        # Filter by date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(started_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(started_at__date__lte=end_date)
        
        # Filter by session type
        session_type = request.query_params.get('session_type')
        if session_type:
            queryset = queryset.filter(session_type=session_type)
        
        # Filter by task
        task_id = request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        
        # Filter by project
        project_id = request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by completion status
        completed = request.query_params.get('completed')
        if completed is not None:
            queryset = queryset.filter(completed=completed.lower() == 'true')
        
        serializer = PomodoroSessionSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive statistics"""
        user = request.user
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Today's stats
        today_sessions = PomodoroSession.objects.filter(
            user=user,
            started_at__date=today,
            session_type='work',
        )
        today_completed = today_sessions.filter(completed=True)
        today_productivity = today_completed.aggregate(
            avg=Avg('productivity_score')
        )['avg'] or 0
        
        # Week stats
        week_sessions = PomodoroSession.objects.filter(
            user=user,
            started_at__date__gte=week_ago,
            session_type='work',
        )
        week_completed = week_sessions.filter(completed=True)
        week_productivity = week_completed.aggregate(
            avg=Avg('productivity_score')
        )['avg'] or 0
        
        # Month stats
        month_sessions = PomodoroSession.objects.filter(
            user=user,
            started_at__date__gte=month_ago,
            session_type='work',
        )
        month_completed = month_sessions.filter(completed=True)
        month_productivity = month_completed.aggregate(
            avg=Avg('productivity_score')
        )['avg'] or 0
        
        # Streak info
        streak, _ = FocusStreak.objects.get_or_create(user=user)
        streak.reset_streak()
        
        # Distraction stats
        distractions = DistractionLog.objects.filter(
            user=user,
            timestamp__date__gte=month_ago
        )
        total_sessions = month_completed.count()
        avg_distractions = distractions.count() / max(total_sessions, 1)
        
        # Most productive hour
        hour_stats = PomodoroSession.objects.filter(
            user=user,
            started_at__date__gte=month_ago,
            completed=True,
            productivity_score__isnull=False
        ).values('hour_of_day').annotate(
            avg_productivity=Avg('productivity_score'),
            count=Count('id')
        ).filter(count__gte=3).order_by('-avg_productivity').first()
        
        most_productive_hour = hour_stats['hour_of_day'] if hour_stats else None
        
        # Most productive day
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_stats = PomodoroSession.objects.filter(
            user=user,
            started_at__date__gte=month_ago,
            completed=True,
            productivity_score__isnull=False
        ).values('day_of_week').annotate(
            avg_productivity=Avg('productivity_score'),
            count=Count('id')
        ).filter(count__gte=3).order_by('-avg_productivity').first()
        
        most_productive_day = day_names[day_stats['day_of_week']] if day_stats else None
        
        # Deep work stats
        deep_work_sessions = DeepWorkSession.objects.filter(
            user=user,
            started_at__date__gte=month_ago
        )
        
        stats = {
            'today_count': today_sessions.count(),
            'today_minutes': sum(s.duration for s in today_sessions if s.completed),
            'today_completed': today_completed.count(),
            'today_productivity_avg': round(today_productivity, 1),
            
            'week_count': week_sessions.count(),
            'week_minutes': sum(s.duration for s in week_completed),
            'week_completed': week_completed.count(),
            'week_productivity_avg': round(week_productivity, 1),
            
            'month_count': month_sessions.count(),
            'month_minutes': sum(s.duration for s in month_completed),
            'month_completed': month_completed.count(),
            'month_productivity_avg': round(month_productivity, 1),
            
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            
            'total_distractions': distractions.count(),
            'avg_distractions_per_session': round(avg_distractions, 2),
            
            'most_productive_hour': most_productive_hour,
            'most_productive_day': most_productive_day,
            
            'deep_work_sessions_this_month': deep_work_sessions.count(),
            'total_deep_work_hours': sum(dw.duration_hours for dw in deep_work_sessions),
        }
        
        return Response(stats)

    @action(detail=False, methods=['get'])
    def time_of_day(self, request):
        """Get time-of-day productivity heatmap data"""
        user = request.user
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        hour_data = PomodoroSession.objects.filter(
            user=user,
            started_at__gte=since,
            session_type='work'
        ).values('hour_of_day').annotate(
            session_count=Count('id'),
            total_minutes=Sum('duration'),
            avg_productivity=Avg('productivity_score'),
            completed_count=Count(Case(When(completed=True, then=1))),
        ).order_by('hour_of_day')
        
        result = []
        for data in hour_data:
            completion_rate = 0
            if data['session_count'] > 0:
                completion_rate = (data['completed_count'] / data['session_count']) * 100
            
            result.append({
                'hour': data['hour_of_day'],
                'session_count': data['session_count'],
                'total_minutes': data['total_minutes'] or 0,
                'avg_productivity': round(data['avg_productivity'] or 0, 1),
                'completion_rate': round(completion_rate, 1),
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def daily_analytics(self, request):
        """Get daily productivity breakdown"""
        user = request.user
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        sessions = PomodoroSession.objects.filter(
            user=user,
            started_at__gte=since,
            session_type='work'
        )
        
        daily_data = defaultdict(lambda: {
            'session_count': 0,
            'total_minutes': 0,
            'completed_sessions': 0,
            'productivity_sum': 0,
            'productivity_count': 0,
        })
        
        for session in sessions:
            date = session.started_at.date()
            daily_data[date]['session_count'] += 1
            if session.completed:
                daily_data[date]['total_minutes'] += session.duration
                daily_data[date]['completed_sessions'] += 1
            if session.productivity_score:
                daily_data[date]['productivity_sum'] += session.productivity_score
                daily_data[date]['productivity_count'] += 1
        
        # Get distraction counts per day
        distractions = DistractionLog.objects.filter(
            user=user,
            timestamp__gte=since
        )
        
        for distraction in distractions:
            date = distraction.timestamp.date()
            if date in daily_data:
                daily_data[date]['distractions'] = daily_data[date].get('distractions', 0) + 1
        
        result = []
        for date, data in sorted(daily_data.items()):
            avg_productivity = 0
            if data['productivity_count'] > 0:
                avg_productivity = data['productivity_sum'] / data['productivity_count']
            
            result.append({
                'date': date,
                'session_count': data['session_count'],
                'total_minutes': data['total_minutes'],
                'completed_sessions': data['completed_sessions'],
                'distractions': data.get('distractions', 0),
                'avg_productivity': round(avg_productivity, 1),
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def project_analytics(self, request):
        """Get analytics grouped by project"""
        user = request.user
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        project_data = PomodoroSession.objects.filter(
            user=user,
            started_at__gte=since,
            session_type='work',
            project__isnull=False
        ).values('project_id', 'project__name').annotate(
            session_count=Count('id'),
            total_minutes=Sum('duration'),
            avg_productivity=Avg('productivity_score'),
        ).order_by('-total_minutes')
        
        result = []
        for data in project_data:
            result.append({
                'project_id': str(data['project_id']),
                'project_name': data['project__name'],
                'session_count': data['session_count'],
                'total_minutes': data['total_minutes'] or 0,
                'avg_productivity': round(data['avg_productivity'] or 0, 1),
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def productivity_score(self, request):
        """Calculate overall productivity score"""
        user = request.user
        period = request.query_params.get('period', 'week')
        
        if period == 'week':
            days = 7
        elif period == 'month':
            days = 30
        else:
            days = 7
        
        since = timezone.now() - timedelta(days=days)
        period_start = since.date()
        period_end = timezone.now().date()
        
        sessions = PomodoroSession.objects.filter(
            user=user,
            started_at__gte=since,
            session_type='work'
        )
        
        completed = sessions.filter(completed=True)
        total_count = sessions.count()
        completed_count = completed.count()
        
        if total_count == 0:
            return Response({
                'overall_score': 0,
                'focus_quality_score': 0,
                'consistency_score': 0,
                'completion_rate_score': 0,
                'streak_score': 0,
                'period': period,
                'period_start': period_start,
                'period_end': period_end,
            })
        
        # Focus quality score (0-25) - based on productivity ratings and distractions
        productivity_avg = completed.aggregate(avg=Avg('productivity_score'))['avg'] or 5
        distractions_count = DistractionLog.objects.filter(
            user=user,
            timestamp__gte=since
        ).count()
        distraction_penalty = min(distractions_count * 2, 10)
        focus_quality = max(0, min(25, (productivity_avg / 10) * 25 - distraction_penalty))
        
        # Consistency score (0-25) - based on daily sessions
        daily_counts = sessions.values('started_at__date').annotate(count=Count('id'))
        active_days = daily_counts.count()
        avg_per_day = total_count / max(active_days, 1)
        consistency = min(25, (avg_per_day / 8) * 25)  # 8 sessions = perfect consistency
        
        # Completion rate score (0-25)
        completion_rate = (completed_count / total_count) * 100
        completion_score = min(25, (completion_rate / 100) * 25)
        
        # Streak score (0-25)
        streak, _ = FocusStreak.objects.get_or_create(user=user)
        streak.reset_streak()
        streak_score = min(25, streak.current_streak * 5)  # 5 days = perfect streak
        
        overall_score = int(focus_quality + consistency + completion_score + streak_score)
        
        return Response({
            'overall_score': overall_score,
            'focus_quality_score': int(focus_quality),
            'consistency_score': int(consistency),
            'completion_rate_score': int(completion_score),
            'streak_score': int(streak_score),
            'period': period,
            'period_start': period_start,
            'period_end': period_end,
        })


class DistractionLogViewSet(viewsets.ModelViewSet):
    serializer_class = DistractionLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DistractionLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of distractions by type"""
        user = request.user
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        summary = DistractionLog.objects.filter(
            user=user,
            timestamp__gte=since
        ).values('distraction_type').annotate(
            count=Count('id'),
            avg_recovery=Avg('recovery_time_seconds')
        ).order_by('-count')
        
        return Response(list(summary))


class FocusStreakViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FocusStreakSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FocusStreak.objects.filter(user=self.request.user)

    def get_object(self):
        streak, _ = FocusStreak.objects.get_or_create(user=self.request.user)
        streak.reset_streak()
        return streak


class DeepWorkSessionViewSet(viewsets.ModelViewSet):
    serializer_class = DeepWorkSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeepWorkSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        task = serializer.validated_data.get('task')
        project = serializer.validated_data.get('project')
        
        if task and not project:
            project = task.project
        
        serializer.save(user=self.request.user, project=project)

    @action(detail=True, methods=['post'])
    def add_pomodoro(self, request, pk=None):
        """Add a pomodoro to this deep work session"""
        session = self.get_object()
        pomodoro_id = request.data.get('pomodoro_id')
        
        if pomodoro_id:
            try:
                pomodoro = PomodoroSession.objects.get(id=pomodoro_id, user=request.user)
                session.pomodoro_count += 1
                session.total_focus_minutes += pomodoro.duration
                session.save()
                return Response({'status': 'added', 'pomodoro_count': session.pomodoro_count})
            except PomodoroSession.DoesNotExist:
                return Response({'error': 'Pomodoro not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'pomodoro_id required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a deep work session"""
        session = self.get_object()
        session.ended_at = timezone.now()
        session.productivity_score = request.data.get('productivity_score')
        session.notes = request.data.get('notes', '')
        session.save()
        
        return Response({'status': 'completed', 'session': DeepWorkSessionSerializer(session).data})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get deep work statistics"""
        user = request.user
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        sessions = DeepWorkSession.objects.filter(
            user=user,
            started_at__gte=since
        )
        
        total_sessions = sessions.count()
        if total_sessions == 0:
            return Response({
                'total_sessions': 0,
                'total_pomodoros': 0,
                'total_focus_hours': 0,
                'avg_pomodoros_per_session': 0,
                'avg_session_duration_hours': 0,
                'avg_focus_ratio': 0,
            })
        
        total_pomodoros = sum(s.pomodoro_count for s in sessions)
        total_focus_hours = sum(s.duration_hours for s in sessions)
        avg_focus_ratio = sum(s.focus_ratio for s in sessions) / total_sessions
        
        return Response({
            'total_sessions': total_sessions,
            'total_pomodoros': total_pomodoros,
            'total_focus_hours': round(total_focus_hours, 2),
            'avg_pomodoros_per_session': round(total_pomodoros / total_sessions, 1),
            'avg_session_duration_hours': round(total_focus_hours / total_sessions, 2),
            'avg_focus_ratio': round(avg_focus_ratio, 2),
        })
