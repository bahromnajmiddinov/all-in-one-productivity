from datetime import timedelta
from math import sqrt

from django.db.models import Sum, Avg, Count
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.journal.models import JournalMood
from apps.pomodoro.models import PomodoroSession

from .models import (
    WaterIntakeSettings,
    WaterLog,
    WaterContainer,
    SleepLog,
    ExerciseType,
    ExerciseLog,
    BodyMetrics,
)
from .serializers import (
    WaterIntakeSettingsSerializer,
    WaterLogSerializer,
    WaterContainerSerializer,
    SleepLogSerializer,
    ExerciseTypeSerializer,
    ExerciseLogSerializer,
    BodyMetricsSerializer,
)


def _calculate_pearson(pairs):
    if len(pairs) < 2:
        return None

    x_values = [pair[0] for pair in pairs]
    y_values = [pair[1] for pair in pairs]
    x_mean = sum(x_values) / len(x_values)
    y_mean = sum(y_values) / len(y_values)

    numerator = sum((x - x_mean) * (y - y_mean) for x, y in pairs)
    denominator_x = sum((x - x_mean) ** 2 for x in x_values)
    denominator_y = sum((y - y_mean) ** 2 for y in y_values)

    if denominator_x == 0 or denominator_y == 0:
        return None

    return round(numerator / sqrt(denominator_x * denominator_y), 3)


def _get_daily_total(user, day):
    return (
        WaterLog.objects.filter(user=user, date=day).aggregate(Sum('amount_ml'))['amount_ml__sum']
        or 0
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

    @action(detail=False, methods=['get'])
    def adjusted_goal(self, request):
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response({'adjusted_goal_ml': serializer.data['adjusted_goal_ml']})


class WaterContainerViewSet(viewsets.ModelViewSet):
    serializer_class = WaterContainerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WaterContainer.objects.filter(user=self.request.user)

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
        serializer = WaterIntakeSettingsSerializer(settings)
        goal_ml = serializer.data['adjusted_goal_ml']

        return Response(
            {
                'logs': WaterLogSerializer(logs, many=True).data,
                'total_ml': total,
                'goal_ml': goal_ml,
                'percentage': min(int((total / goal_ml) * 100), 100) if goal_ml else 0,
                'remaining_ml': max(goal_ml - total, 0),
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
        serializer = WaterIntakeSettingsSerializer(settings)
        goal_ml = serializer.data['adjusted_goal_ml']

        for i in range(7):
            day = today - timedelta(days=i)
            day_logs = WaterLog.objects.filter(user=request.user, date=day)
            total = day_logs.aggregate(Sum('amount_ml'))['amount_ml__sum'] or 0

            stats.append(
                {
                    'date': day.isoformat(),
                    'total_ml': total,
                    'goal_ml': goal_ml,
                    'percentage': min(int((total / goal_ml) * 100), 100) if goal_ml else 0,
                    'log_count': day_logs.count(),
                }
            )

        return Response(stats)

    @action(detail=False, methods=['get'])
    def timeline(self, request):
        today = timezone.localdate()
        logs = self.get_queryset().filter(date=today)
        hourly_totals = {hour: 0 for hour in range(24)}

        for log in logs:
            hour = log.logged_at.astimezone(timezone.get_current_timezone()).hour
            hourly_totals[hour] += log.amount_ml

        timeline = [
            {'hour': hour, 'total_ml': total}
            for hour, total in hourly_totals.items()
        ]

        return Response(timeline)

    @action(detail=False, methods=['get'])
    def trends(self, request):
        today = timezone.localdate()
        last_week = today - timedelta(days=6)
        last_month = today - timedelta(days=29)

        week_total = (
            WaterLog.objects.filter(user=request.user, date__gte=last_week, date__lte=today)
            .aggregate(Sum('amount_ml'))['amount_ml__sum']
            or 0
        )
        month_total = (
            WaterLog.objects.filter(user=request.user, date__gte=last_month, date__lte=today)
            .aggregate(Sum('amount_ml'))['amount_ml__sum']
            or 0
        )

        return Response(
            {
                'weekly_average_ml': int(week_total / 7),
                'monthly_average_ml': int(month_total / 30),
            }
        )

    @action(detail=False, methods=['get'])
    def streaks(self, request):
        settings, _ = WaterIntakeSettings.objects.get_or_create(
            user=request.user,
            defaults={'daily_goal_ml': 2500},
        )
        serializer = WaterIntakeSettingsSerializer(settings)
        goal_ml = serializer.data['adjusted_goal_ml']

        current_streak = 0
        check_date = timezone.localdate()
        while _get_daily_total(request.user, check_date) >= goal_ml and goal_ml:
            current_streak += 1
            check_date -= timedelta(days=1)

        best_streak = 0
        streak = 0
        for i in range(30):
            day = timezone.localdate() - timedelta(days=i)
            if _get_daily_total(request.user, day) >= goal_ml and goal_ml:
                streak += 1
                best_streak = max(best_streak, streak)
            else:
                streak = 0

        return Response({'current_streak': current_streak, 'best_streak': best_streak})

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        settings, _ = WaterIntakeSettings.objects.get_or_create(
            user=request.user,
            defaults={'daily_goal_ml': 2500},
        )
        serializer = WaterIntakeSettingsSerializer(settings)
        goal_ml = serializer.data['adjusted_goal_ml']

        total_days = 30
        met_goal = 0
        total_intake = 0
        for i in range(total_days):
            day = timezone.localdate() - timedelta(days=i)
            daily_total = _get_daily_total(request.user, day)
            total_intake += daily_total
            if goal_ml and daily_total >= goal_ml:
                met_goal += 1

        hydration_score = int((met_goal / total_days) * 100) if total_days else 0

        return Response(
            {
                'hydration_score': hydration_score,
                'days_met_goal': met_goal,
                'average_daily_ml': int(total_intake / total_days) if total_days else 0,
            }
        )

    @action(detail=False, methods=['get'])
    def reminders(self, request):
        settings, _ = WaterIntakeSettings.objects.get_or_create(
            user=request.user,
            defaults={'daily_goal_ml': 2500},
        )
        serializer = WaterIntakeSettingsSerializer(settings)
        goal_ml = serializer.data['adjusted_goal_ml']

        today = timezone.localdate()
        total = _get_daily_total(request.user, today)
        last_log = self.get_queryset().filter(date=today).order_by('-logged_at').first()

        interval_minutes = settings.reminder_interval
        if settings.smart_reminders_enabled and goal_ml:
            start_hour = 6
            end_hour = 22
            now_hour = timezone.localtime().hour
            elapsed_hours = max(now_hour - start_hour, 1)
            expected_total = min(goal_ml, int((elapsed_hours / (end_hour - start_hour)) * goal_ml))
            if total < expected_total:
                interval_minutes = max(int(interval_minutes / 2), 15)

        next_reminder_at = None
        if last_log:
            next_reminder_at = last_log.logged_at + timedelta(minutes=interval_minutes)

        return Response(
            {
                'interval_minutes': interval_minutes,
                'next_reminder_at': next_reminder_at,
            }
        )

    @action(detail=False, methods=['get'])
    def correlations(self, request):
        start_date = timezone.localdate() - timedelta(days=30)
        daily_totals = {
            log['date']: log['total']
            for log in WaterLog.objects.filter(user=request.user, date__gte=start_date)
            .values('date')
            .annotate(total=Sum('amount_ml'))
        }

        mood_entries = (
            JournalMood.objects.filter(user=request.user, date__gte=start_date)
            .values('date')
            .annotate(avg_mood=Avg('mood'), avg_energy=Avg('energy_level'))
        )
        pomodoro_entries = (
            PomodoroSession.objects.filter(user=request.user, started_at__date__gte=start_date)
            .values('started_at__date')
            .annotate(avg_productivity=Avg('productivity_score'))
        )

        mood_pairs = []
        energy_pairs = []
        productivity_pairs = []

        mood_by_date = {entry['date']: entry for entry in mood_entries}
        productivity_by_date = {
            entry['started_at__date']: entry['avg_productivity'] for entry in pomodoro_entries
        }

        for day, total in daily_totals.items():
            mood_entry = mood_by_date.get(day)
            if mood_entry and mood_entry['avg_mood'] is not None:
                mood_pairs.append((total, float(mood_entry['avg_mood'])))
            if mood_entry and mood_entry['avg_energy'] is not None:
                energy_pairs.append((total, float(mood_entry['avg_energy'])))

            productivity_value = productivity_by_date.get(day)
            if productivity_value is not None:
                productivity_pairs.append((total, float(productivity_value)))

        return Response(
            {
                'mood': {
                    'coefficient': _calculate_pearson(mood_pairs),
                    'data_points': len(mood_pairs),
                },
                'energy': {
                    'coefficient': _calculate_pearson(energy_pairs),
                    'data_points': len(energy_pairs),
                },
                'productivity': {
                    'coefficient': _calculate_pearson(productivity_pairs),
                    'data_points': len(productivity_pairs),
                },
            }
        )


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
