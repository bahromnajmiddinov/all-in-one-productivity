from datetime import timedelta, datetime
from math import sqrt
from collections import defaultdict

from django.db.models import Sum, Avg, Count, StdDev, F, ExpressionWrapper, DurationField
from django.utils import timezone
from django.db.models.functions import ExtractHour, ExtractWeekDay
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.journal.models import JournalMood
from apps.pomodoro.models import PomodoroSession

from .models import (
    WaterIntakeSettings,
    WaterLog,
    WaterContainer,
    SleepLog,
    SleepDisruption,
    SleepNap,
    SleepGoal,
    SleepStats,
    SleepDebt,
    SleepCorrelation,
    SleepInsight,
    ExerciseType,
    ExerciseLog,
    BodyMetrics,
    MuscleGroup,
    Equipment,
    Exercise,
    Workout,
    WorkoutExercise,
    ExerciseSet,
    WorkoutLog,
    WorkoutPlan,
    WorkoutPlanWeek,
    WorkoutPlanDay,
    PersonalRecord,
    FitnessGoal,
    RestDay,
    ExerciseStats,
    ProgressiveOverload,
)
from .serializers import (
    WaterIntakeSettingsSerializer,
    WaterLogSerializer,
    WaterContainerSerializer,
    SleepLogSerializer,
    SleepDisruptionSerializer,
    SleepNapSerializer,
    SleepGoalSerializer,
    SleepStatsSerializer,
    SleepDebtSerializer,
    SleepCorrelationSerializer,
    SleepInsightSerializer,
    ExerciseTypeSerializer,
    ExerciseLogSerializer,
    BodyMetricsSerializer,
    MuscleGroupSerializer,
    EquipmentSerializer,
    ExerciseSerializer,
    WorkoutSerializer,
    WorkoutExerciseSerializer,
    ExerciseSetSerializer,
    WorkoutLogSerializer,
    WorkoutPlanSerializer,
    WorkoutPlanWeekSerializer,
    WorkoutPlanDaySerializer,
    PersonalRecordSerializer,
    FitnessGoalSerializer,
    RestDaySerializer,
    ExerciseStatsSerializer,
    ProgressiveOverloadSerializer,
    WorkoutHeatmapEntry,
    ExerciseVolumeData,
    MuscleGroupBalanceData,
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
        return SleepLog.objects.filter(user=self.request.user).select_related('user')

    def perform_create(self, serializer):
        bed_time = serializer.validated_data.get('bed_time')
        wake_time = serializer.validated_data.get('wake_time')
        duration = int((wake_time - bed_time).total_seconds() / 60)
        log_date = wake_time.date()

        serializer.save(
            user=self.request.user,
            duration_minutes=duration,
            date=log_date,
        )

        # Update stats after creating log
        stats, _ = SleepStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()

    def perform_update(self, serializer):
        serializer.save()

        # Update stats after updating log
        stats, _ = SleepStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()

    def perform_destroy(self, instance):
        instance.delete()

        # Update stats after deleting log
        stats, _ = SleepStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats, _ = SleepStats.objects.get_or_create(user=request.user)
        serializer = SleepStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        """Get calendar heatmap data for sleep duration and quality"""
        days = int(request.query_params.get('days', 90))
        start_date = timezone.localdate() - timedelta(days=days)

        logs = self.get_queryset().filter(date__gte=start_date).order_by('-date')

        heatmap_data = [
            {
                'date': log.date.isoformat(),
                'duration_hours': round(log.duration_minutes / 60, 1),
                'quality': log.quality,
                'sleep_score': float(log.sleep_score) if log.sleep_score else None,
            }
            for log in logs
        ]

        return Response(heatmap_data)

    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get sleep duration and quality trends over time"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.localdate() - timedelta(days=days)

        logs = self.get_queryset().filter(date__gte=start_date).order_by('date')

        duration_data = [
            {
                'date': log.date.isoformat(),
                'duration_hours': round(log.duration_minutes / 60, 1),
            }
            for log in logs
        ]

        quality_data = [
            {
                'date': log.date.isoformat(),
                'quality': log.quality,
            }
            for log in logs
        ]

        score_data = [
            {
                'date': log.date.isoformat(),
                'score': float(log.sleep_score) if log.sleep_score else None,
            }
            for log in logs
        ]

        return Response({
            'duration': duration_data,
            'quality': quality_data,
            'score': score_data,
        })

    @action(detail=False, methods=['get'])
    def consistency(self, request):
        """Calculate sleep schedule consistency metrics"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.localdate() - timedelta(days=days)

        logs = self.get_queryset().filter(date__gte=start_date)

        # Calculate average bed time and wake time
        bed_hours = []
        wake_hours = []

        for log in logs:
            bed_time = timezone.localtime(log.bed_time)
            wake_time = timezone.localtime(log.wake_time)
            bed_hours.append(bed_time.hour + bed_time.minute / 60)
            wake_hours.append(wake_time.hour + wake_time.minute / 60)

        consistency_score = 0
        if bed_hours and wake_hours:
            # Calculate standard deviation
            import statistics
            bed_stddev = statistics.stdev(bed_hours) if len(bed_hours) > 1 else 0
            wake_stddev = statistics.stdev(wake_hours) if len(wake_hours) > 1 else 0

            # Consistency score: lower stddev = higher consistency
            bed_consistency = max(0, 100 - (bed_stddev * 10))
            wake_consistency = max(0, 100 - (wake_stddev * 10))
            consistency_score = (bed_consistency + wake_consistency) / 2

        # Calculate days meeting schedule goals
        goals, _ = SleepGoal.objects.get_or_create(user=request.user)
        days_on_schedule = 0

        for log in logs:
            if goals.target_bed_time and goals.target_wake_time:
                bed_time = timezone.localtime(log.bed_time)
                wake_time = timezone.localtime(log.wake_time)

                target_bed = datetime.combine(log.date, goals.target_bed_time)
                target_wake = datetime.combine(log.date, goals.target_wake_time)

                bed_diff = abs((bed_time - target_bed).total_seconds() / 60)
                wake_diff = abs((wake_time - target_wake).total_seconds() / 60)

                if bed_diff <= goals.bed_time_window_minutes and wake_diff <= goals.wake_time_window_minutes:
                    days_on_schedule += 1

        schedule_compliance = (days_on_schedule / logs.count() * 100) if logs.count() > 0 else 0

        return Response({
            'consistency_score': round(consistency_score, 1),
            'schedule_compliance': round(schedule_compliance, 1),
            'days_on_schedule': days_on_schedule,
            'total_days': logs.count(),
        })

    @action(detail=False, methods=['get'])
    def optimal_window(self, request):
        """Find optimal sleep window based on quality data"""
        logs = self.get_queryset()

        if logs.count() < 7:
            return Response({'error': 'Need at least 7 sleep logs'}, status=status.HTTP_400_BAD_REQUEST)

        # Group logs by bed time hour
        hour_scores = defaultdict(list)
        for log in logs:
            if log.sleep_score:
                bed_hour = timezone.localtime(log.bed_time).hour
                hour_scores[bed_hour].append(log.sleep_score)

        # Find best hour
        best_hour = None
        best_avg = 0

        for hour, scores in hour_scores.items():
            if len(scores) >= 3:  # Need at least 3 data points
                avg_score = sum(scores) / len(scores)
                if avg_score > best_avg:
                    best_avg = avg_score
                    best_hour = hour

        if best_hour is not None:
            return Response({
                'optimal_bed_time_start': f"{best_hour:02d}:00",
                'optimal_bed_time_end': f"{best_hour + 1:02d}:00",
                'avg_score': round(best_avg, 2),
                'data_points': len(hour_scores[best_hour]),
            })

        return Response({'error': 'Insufficient data'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def correlations(self, request):
        """Calculate correlations between sleep and other metrics"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.localdate() - timedelta(days=days)

        logs = self.get_queryset().filter(date__gte=start_date)
        if logs.count() < 5:
            return Response({'error': 'Need at least 5 sleep logs'}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare sleep data by date
        sleep_by_date = {log.date: log for log in logs}

        # Correlate with mood
        mood_entries = JournalMood.objects.filter(
            user=request.user,
            date__gte=start_date
        ).values('date', 'mood', 'energy_level')

        mood_pairs = []
        energy_pairs = []

        for entry in mood_entries:
            log = sleep_by_date.get(entry['date'])
            if log and log.sleep_score and entry['mood']:
                mood_pairs.append((float(log.sleep_score), entry['mood']))
            if log and log.sleep_score and entry.get('energy_level'):
                energy_pairs.append((float(log.sleep_score), entry['energy_level']))

        # Correlate with productivity (Pomodoro)
        pomodoro_sessions = PomodoroSession.objects.filter(
            user=request.user,
            started_at__date__gte=start_date
        ).values('started_at__date').annotate(
            avg_productivity=Avg('productivity_score'),
            total_minutes=Sum('duration_minutes')
        )

        productivity_pairs = []
        for session in pomodoro_sessions:
            log = sleep_by_date.get(session['started_at__date'])
            if log and log.sleep_score and session['avg_productivity']:
                productivity_pairs.append((float(log.sleep_score), float(session['avg_productivity'])))

        # Correlate with exercise
        exercise_logs = ExerciseLog.objects.filter(
            user=request.user,
            date__gte=start_date
        ).values('date').annotate(total_duration=Sum('duration_minutes'))

        exercise_pairs = []
        for ex in exercise_logs:
            log = sleep_by_date.get(ex['date'])
            if log and log.sleep_score:
                exercise_pairs.append((float(log.sleep_score), ex['total_duration'] or 0))

        return Response({
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
            'exercise': {
                'coefficient': _calculate_pearson(exercise_pairs),
                'data_points': len(exercise_pairs),
            },
        })

    @action(detail=False, methods=['get'])
    def insights(self, request):
        """Get personalized sleep insights"""
        stats, _ = SleepStats.objects.get_or_create(user=request.user)
        insights = []

        # Check sleep debt
        if stats.sleep_debt_minutes > 240:  # More than 4 hours debt
            insights.append({
                'type': 'warning',
                'title': 'High Sleep Debt',
                'description': f"You have accumulated {round(stats.sleep_debt_minutes / 60, 1)} hours of sleep debt. Try to get extra sleep this weekend.",
                'priority': 'high',
            })

        # Check consistency
        if stats.current_streak >= 7:
            insights.append({
                'type': 'achievement',
                'title': 'Great Consistency!',
                'description': f"You've logged sleep for {stats.current_streak} consecutive days. Keep it up!",
                'priority': 'low',
            })

        # Check average quality
        if stats.avg_quality_7d and stats.avg_quality_7d < 5:
            insights.append({
                'type': 'recommendation',
                'title': 'Low Sleep Quality',
                'description': "Your sleep quality has been below average this week. Consider reducing screen time before bed.",
                'priority': 'medium',
            })

        # Check efficiency
        if stats.avg_efficiency_7d and stats.avg_efficiency_7d < 80:
            insights.append({
                'type': 'recommendation',
                'title': 'Improve Sleep Efficiency',
                'description': "Your sleep efficiency is below 80%. Try maintaining a consistent sleep schedule and comfortable environment.",
                'priority': 'medium',
            })

        return Response(insights)


class SleepDisruptionViewSet(viewsets.ModelViewSet):
    serializer_class = SleepDisruptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SleepDisruption.objects.filter(sleep_log__user=self.request.user)

    def perform_create(self, serializer):
        sleep_log_id = self.request.data.get('sleep_log')
        sleep_log = SleepLog.objects.get(id=sleep_log_id, user=self.request.user)
        serializer.save(sleep_log=sleep_log)

        # Update disruptions count
        sleep_log.disruptions_count = SleepDisruption.objects.filter(sleep_log=sleep_log).count()
        sleep_log.save()


class SleepNapViewSet(viewsets.ModelViewSet):
    serializer_class = SleepNapSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SleepNap.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

        # Update stats
        stats, _ = SleepStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()


class SleepGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SleepGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SleepGoal.objects.filter(user=self.request.user)

    def get_object(self):
        obj, _ = SleepGoal.objects.get_or_create(user=self.request.user)
        self.check_object_permissions(self.request, obj)
        return obj


class SleepStatsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SleepStatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SleepStats.objects.filter(user=self.request.user)

    def get_object(self):
        obj, _ = SleepStats.objects.get_or_create(user=self.request.user)
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Manually refresh sleep statistics"""
        stats, _ = SleepStats.objects.get_or_create(user=request.user)
        stats.update_stats()
        serializer = self.get_serializer(stats)
        return Response(serializer.data)


class SleepDebtViewSet(viewsets.ModelViewSet):
    serializer_class = SleepDebtSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SleepDebt.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get sleep debt summary"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.localdate() - timedelta(days=days)

        debts = SleepDebt.objects.filter(user=request.user, date__gte=start_date)
        total_debt = sum(d.debt_minutes for d in debts if d.debt_minutes > 0)
        total_surplus = sum(abs(d.debt_minutes) for d in debts if d.debt_minutes < 0)

        return Response({
            'total_debt_minutes': total_debt,
            'total_surplus_minutes': total_surplus,
            'net_balance_minutes': total_surplus - total_debt,
            'average_daily_debt': round(total_debt / days, 1) if days > 0 else 0,
        })


class SleepInsightViewSet(viewsets.ModelViewSet):
    serializer_class = SleepInsightSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SleepInsight.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an insight"""
        insight = self.get_object()
        insight.is_dismissed = True
        insight.save()
        return Response({'status': 'dismissed'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark an insight as read"""
        insight = self.get_object()
        insight.is_read = True
        insight.save()
        return Response({'status': 'read'})


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


class MuscleGroupViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MuscleGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MuscleGroup.objects.all()


class EquipmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EquipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Equipment.objects.all()


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Exercise.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workout.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutExercise.objects.filter(workout__user=self.request.user)


class ExerciseSetViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseSet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutLogViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

        # Update stats
        stats, _ = ExerciseStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()

    def perform_update(self, serializer):
        serializer.save()

        # Update stats
        stats, _ = ExerciseStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()

    def perform_destroy(self, instance):
        instance.delete()

        # Update stats
        stats, _ = ExerciseStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()

    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        """Get workout heatmap data for visualization"""
        days = int(request.query_params.get('days', 90))
        start_date = timezone.localdate() - timedelta(days=days)

        logs = self.get_queryset().filter(date__gte=start_date).order_by('-date')

        heatmap_data = [
            {
                'date': log.date.isoformat(),
                'workout_count': 1,
                'total_duration': log.duration_minutes or 0,
                'avg_intensity': float(log.intensity) if log.intensity else None,
            }
            for log in logs
        ]

        return Response(heatmap_data)

    @action(detail=False, methods=['get'])
    def volume_over_time(self, request):
        """Get exercise volume trends over time"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.localdate() - timedelta(days=days)

        logs = self.get_queryset().filter(date__gte=start_date).order_by('date')

        volume_data = [
            {
                'date': log.date.isoformat(),
                'total_volume': float(log.total_volume_kg) if log.total_volume_kg else 0,
                'exercise_count': log.total_exercises or 0,
            }
            for log in logs
        ]

        return Response(volume_data)

    @action(detail=False, methods=['get'])
    def muscle_group_balance(self, request):
        """Get muscle group training balance"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.localdate() - timedelta(days=days)

        sets = ExerciseSet.objects.filter(
            user=request.user,
            completed_at__date__gte=start_date
        ).select_related('exercise')

        muscle_counts = {}
        total_sets = sets.count()

        for exercise_set in sets:
            if exercise_set.exercise:
                for muscle in exercise_set.exercise.muscle_groups.all():
                    muscle_counts[muscle.display_name] = muscle_counts.get(muscle.display_name, 0) + 1

        balance_data = [
            {
                'muscle_group': muscle,
                'workout_count': count,
                'percentage': round((count / total_sets * 100), 2) if total_sets > 0 else 0,
            }
            for muscle, count in muscle_counts.items()
        ]

        return Response(balance_data)


class WorkoutPlanViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlan.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a workout plan"""
        plan = self.get_object()
        plan.is_active = True
        plan.save()

        # Deactivate other plans
        WorkoutPlan.objects.filter(user=request.user).exclude(pk=plan.pk).update(is_active=False)

        return Response({'status': 'activated'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a workout plan as completed"""
        plan = self.get_object()
        plan.is_completed = True
        plan.is_active = False
        plan.save()

        return Response({'status': 'completed'})


class WorkoutPlanWeekViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlanWeekSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlanWeek.objects.filter(plan__user=self.request.user)


class WorkoutPlanDayViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlanDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlanDay.objects.filter(week__plan__user=self.request.user)


class PersonalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PersonalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PersonalRecord.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_exercise(self, request):
        """Get personal records grouped by exercise"""
        records = self.get_queryset().filter(is_active=True).select_related('exercise')

        grouped = {}
        for record in records:
            exercise_id = str(record.exercise.id)
            if exercise_id not in grouped:
                grouped[exercise_id] = {
                    'exercise_id': exercise_id,
                    'exercise_name': record.exercise.name,
                    'records': [],
                }
            grouped[exercise_id]['records'].append(PersonalRecordSerializer(record).data)

        return Response(list(grouped.values()))


class FitnessGoalViewSet(viewsets.ModelViewSet):
    serializer_class = FitnessGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FitnessGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update progress for a fitness goal"""
        goal = self.get_object()
        current_value = request.data.get('current_value')

        if current_value is not None:
            goal.current_value = current_value
            goal.status = 'in_progress'

            # Check if goal is achieved
            if goal.goal_type == 'weight_loss' and goal.target_weight_kg:
                if goal.current_value <= goal.target_weight_kg:
                    goal.is_achieved = True
                    goal.status = 'completed'
            elif goal.goal_type == 'weight_gain' and goal.target_weight_kg:
                if goal.current_value >= goal.target_weight_kg:
                    goal.is_achieved = True
                    goal.status = 'completed'

            goal.save()

        return Response(FitnessGoalSerializer(goal).data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active fitness goals"""
        goals = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(goals, many=True)
        return Response(serializer.data)


class RestDayViewSet(viewsets.ModelViewSet):
    serializer_class = RestDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RestDay.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExerciseStatsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExerciseStatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseStats.objects.filter(user=self.request.user)

    def get_object(self):
        obj, _ = ExerciseStats.objects.get_or_create(user=self.request.user)
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Manually refresh exercise statistics"""
        stats, _ = ExerciseStats.objects.get_or_create(user=request.user)
        stats.update_stats()
        serializer = self.get_serializer(stats)
        return Response(serializer.data)


class ProgressiveOverloadViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressiveOverloadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProgressiveOverload.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
