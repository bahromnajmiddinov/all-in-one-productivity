from datetime import timedelta

from django.db.models import Sum, Avg, Count
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    WaterIntakeSettings,
    WaterLog,
    SleepLog,
    ExerciseType,
    ExerciseLog,
    BodyMetrics,
)
from .serializers import (
    WaterIntakeSettingsSerializer,
    WaterLogSerializer,
    SleepLogSerializer,
    ExerciseTypeSerializer,
    ExerciseLogSerializer,
    BodyMetricsSerializer,
)


class WaterIntakeSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = WaterIntakeSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WaterIntakeSettings.objects.filter(user=self.request.user)

    def get_object(self):
        obj, _ = WaterIntakeSettings.objects.get_or_create(
            user=self.request.user,
            defaults={'daily_goal_ml': 2500},
        )
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WaterLogViewSet(viewsets.ModelViewSet):
    serializer_class = WaterLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WaterLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, date=timezone.localdate())

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        logs = self.get_queryset().filter(date=today)
        total = logs.aggregate(Sum('amount_ml'))['amount_ml__sum'] or 0

        settings, _ = WaterIntakeSettings.objects.get_or_create(
            user=request.user,
            defaults={'daily_goal_ml': 2500},
        )

        return Response(
            {
                'logs': WaterLogSerializer(logs, many=True).data,
                'total_ml': total,
                'goal_ml': settings.daily_goal_ml,
                'percentage': min(int((total / settings.daily_goal_ml) * 100), 100)
                if settings.daily_goal_ml
                else 0,
                'remaining_ml': max(settings.daily_goal_ml - total, 0),
            }
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.localdate()
        stats = []

        settings, _ = WaterIntakeSettings.objects.get_or_create(
            user=request.user,
            defaults={'daily_goal_ml': 2500},
        )

        for i in range(7):
            day = today - timedelta(days=i)
            day_logs = WaterLog.objects.filter(user=request.user, date=day)
            total = day_logs.aggregate(Sum('amount_ml'))['amount_ml__sum'] or 0

            stats.append(
                {
                    'date': day.isoformat(),
                    'total_ml': total,
                    'goal_ml': settings.daily_goal_ml,
                    'percentage': min(int((total / settings.daily_goal_ml) * 100), 100)
                    if settings.daily_goal_ml
                    else 0,
                    'log_count': day_logs.count(),
                }
            )

        return Response(stats)


class SleepLogViewSet(viewsets.ModelViewSet):
    serializer_class = SleepLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SleepLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        bed_time = serializer.validated_data.get('bed_time')
        wake_time = serializer.validated_data.get('wake_time')
        duration = int((wake_time - bed_time).total_seconds() // 60)
        log_date = wake_time.date()

        serializer.save(
            user=self.request.user,
            duration_minutes=duration,
            date=log_date,
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        last_30_days = timezone.localdate() - timedelta(days=30)
        logs = self.get_queryset().filter(date__gte=last_30_days)

        avg_duration = logs.aggregate(Avg('duration_minutes'))['duration_minutes__avg'] or 0
        avg_quality = logs.aggregate(Avg('quality'))['quality__avg'] or 0

        streak = 0
        check_date = timezone.localdate()
        while SleepLog.objects.filter(user=request.user, date=check_date).exists():
            streak += 1
            check_date -= timedelta(days=1)

        return Response(
            {
                'avg_duration_hours': round(avg_duration / 60, 1),
                'avg_quality': round(avg_quality, 1),
                'total_logs': logs.count(),
                'streak_days': streak,
            }
        )


class ExerciseTypeViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseType.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExerciseLogViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        last_30_days = timezone.localdate() - timedelta(days=30)
        logs = self.get_queryset().filter(date__gte=last_30_days)

        total_workouts = logs.count()
        total_duration = logs.aggregate(Sum('duration_minutes'))['duration_minutes__sum'] or 0
        total_calories = logs.aggregate(Sum('calories_burned'))['calories_burned__sum'] or 0

        favorite = (
            logs.values('exercise_type__name')
            .exclude(exercise_type__name__isnull=True)
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )

        streak = 0
        check_date = timezone.localdate()
        while ExerciseLog.objects.filter(user=request.user, date=check_date).exists():
            streak += 1
            check_date -= timedelta(days=1)

        return Response(
            {
                'total_workouts': total_workouts,
                'total_duration': total_duration,
                'total_calories': total_calories,
                'current_streak': streak,
                'favorite_exercise': favorite['exercise_type__name'] if favorite else None,
            }
        )


class BodyMetricsViewSet(viewsets.ModelViewSet):
    serializer_class = BodyMetricsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BodyMetrics.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
