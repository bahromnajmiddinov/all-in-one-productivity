from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PomodoroSettings, PomodoroSession
from .serializers import PomodoroSettingsSerializer, PomodoroSessionSerializer


class PomodoroSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = PomodoroSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PomodoroSettings.objects.filter(user=self.request.user)

    def get_object(self):
        obj, _ = PomodoroSettings.objects.get_or_create(
            user=self.request.user,
            defaults={'work_duration': 25, 'short_break': 5, 'long_break': 15},
        )
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PomodoroSessionViewSet(viewsets.ModelViewSet):
    serializer_class = PomodoroSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PomodoroSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        session = self.get_object()
        session.completed = True
        session.ended_at = timezone.now()
        session.save()
        return Response({'status': 'completed'})

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        sessions = self.get_queryset().filter(started_at__date=today, session_type='work')
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        today = timezone.now().date()

        today_sessions = PomodoroSession.objects.filter(
            user=user,
            started_at__date=today,
            completed=True,
            session_type='work',
        )

        week_ago = today - timedelta(days=7)
        week_sessions = PomodoroSession.objects.filter(
            user=user,
            started_at__date__gte=week_ago,
            completed=True,
            session_type='work',
        )

        return Response(
            {
                'today_count': today_sessions.count(),
                'today_minutes': sum(session.duration for session in today_sessions),
                'week_count': week_sessions.count(),
                'week_minutes': sum(session.duration for session in week_sessions),
            }
        )
