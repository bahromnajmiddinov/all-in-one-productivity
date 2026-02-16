from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import math
from django.urls import reverse

from .models import Habit, HabitCompletion, HabitCategory, HabitReminder, HabitStack
from .serializers import (
    HabitSerializer, HabitCompletionSerializer,
    HabitCategorySerializer, HabitReminderSerializer, HabitStackSerializer,
)
from rest_framework import mixins


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_archived=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """List habits that are due today with their completion status."""
        today = timezone.localdate()
        habits = self.get_queryset()
        due_today = [h for h in habits if h.is_due_on_date(today)]
        serializer = self.get_serializer(due_today, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle completion for a habit on a given date (default today)."""
        habit = self.get_object()
        date_str = request.data.get('date')
        if date_str:
            from datetime import datetime
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                date = timezone.localdate()
        else:
            date = timezone.localdate()
        if not habit.is_due_on_date(date):
            return Response(
                {'detail': 'Habit is not due on this date.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        completion, created = HabitCompletion.objects.get_or_create(
            habit=habit,
            date=date,
            defaults={'completed': True},
        )
        completion.completed = not completion.completed
        # update timestamp and time_of_day
        now = timezone.now()
        completion.timestamp = now
        if 'time_of_day_minutes' in request.data:
            try:
                completion.time_of_day_minutes = int(request.data.get('time_of_day_minutes'))
            except Exception:
                completion.time_of_day_minutes = now.hour * 60 + now.minute
        else:
            completion.time_of_day_minutes = now.hour * 60 + now.minute
        completion.save()
        # refresh habit cached stats
        try:
            habit.recalc_stats()
        except Exception:
            pass
        return Response({
            'date': str(date),
            'completed': completion.completed,
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark habit as complete for a date (default today)."""
        habit = self.get_object()
        date_str = request.data.get('date')
        if date_str:
            from datetime import datetime
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                date = timezone.localdate()
        else:
            date = timezone.localdate()
        if not habit.is_due_on_date(date):
            return Response(
                {'detail': 'Habit is not due on this date.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        completion, created = HabitCompletion.objects.get_or_create(habit=habit, date=date)
        completion.completed = True
        now = timezone.now()
        completion.timestamp = now
        if 'time_of_day_minutes' in request.data:
            try:
                completion.time_of_day_minutes = int(request.data.get('time_of_day_minutes'))
            except Exception:
                completion.time_of_day_minutes = now.hour * 60 + now.minute
        else:
            completion.time_of_day_minutes = now.hour * 60 + now.minute
        completion.save()
        try:
            habit.recalc_stats()
        except Exception:
            pass
        return Response({'date': str(date), 'completed': True})

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Summary for master dashboard: today's habits, top streaks."""
        today = timezone.localdate()
        habits = self.get_queryset()
        due_today = [h for h in habits if h.is_due_on_date(today)]
        serializer = self.get_serializer(due_today, many=True)
        completed_count = sum(
            1 for h in due_today
            if HabitCompletion.objects.filter(habit=h, date=today, completed=True).exists()
        )
        return Response({
            'habits_today': serializer.data,
            'total_due': len(due_today),
            'completed_count': completed_count,
        })

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Completions for a month (query params: year, month)."""
        today = timezone.localdate()
        year = int(request.query_params.get('year', today.year))
        month = int(request.query_params.get('month', today.month))
        from calendar import monthrange
        _, last = monthrange(year, month)
        start = timezone.datetime(year, month, 1).date()
        end = timezone.datetime(year, month, last).date()
        habits = self.get_queryset()
        completions = HabitCompletion.objects.filter(
            habit__in=habits,
            date__range=[start, end],
            completed=True,
        ).values_list('habit_id', 'date')
        by_date = {}
        for hid, d in completions:
            key = d.isoformat()
            if key not in by_date:
                by_date[key] = []
            by_date[key].append(str(hid))
        return Response({'completions': by_date})

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Return habit analytics: per-habit completion rate, strength score, trends."""
        days = int(request.query_params.get('days', 90))
        end = timezone.now().date()
        start = end - timedelta(days=days - 1)
        prev_end = start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=days - 1)

        habits = list(self.get_queryset())
        completions_qs = HabitCompletion.objects.filter(habit__in=habits, date__range=[prev_start, end], completed=True)
        completions_by_habit = {}
        for hid, d in completions_qs.values_list('habit_id', 'date'):
            completions_by_habit.setdefault(str(hid), set()).add(d)

        results = []
        for h in habits:
            hid = str(h.id)
            comp_dates = completions_by_habit.get(hid, set())
            due_count = 0
            prev_due_count = 0
            for i in range(days):
                current_day = start + timedelta(days=i)
                prev_day = prev_start + timedelta(days=i)
                if h.is_due_on_date(current_day):
                    due_count += 1
                if h.is_due_on_date(prev_day):
                    prev_due_count += 1
            completed_count = sum(1 for d in comp_dates if start <= d <= end)
            prev_completed_count = sum(1 for d in comp_dates if prev_start <= d <= prev_end)
            completion_rate = round(100.0 * completed_count / due_count, 1) if due_count > 0 else 0.0
            prev_completion_rate = (
                round(100.0 * prev_completed_count / prev_due_count, 1) if prev_due_count > 0 else 0.0
            )
            trend_change = round(completion_rate - prev_completion_rate, 1)
            if trend_change > 0.1:
                trend_direction = 'up'
            elif trend_change < -0.1:
                trend_direction = 'down'
            else:
                trend_direction = 'flat'

            days_since = (end - max(comp_dates)).days if comp_dates else None
            recency = 1.0 if days_since is None else max(0.0, 1.0 - (days_since / max(90, days)))
            streak_factor = min(h.current_streak / 30.0, 1.0)
            strength = 0.6 * (completion_rate / 100.0) + 0.25 * streak_factor + 0.15 * recency
            strength_score = int(round(strength * 100))

            results.append({
                'id': hid,
                'name': h.name,
                'completion_rate': completion_rate,
                'previous_completion_rate': prev_completion_rate,
                'trend_change': trend_change,
                'trend_direction': trend_direction,
                'total_completions': completed_count,
                'due_count': due_count,
                'current_streak': h.current_streak,
                'longest_streak': h.longest_streak,
                'strength_score': strength_score,
            })

        return Response({'start': str(start), 'end': str(end), 'habits': results})

    @action(detail=False, methods=['get'])
    def correlations(self, request):
        """Return a habit correlation matrix (pairwise Pearson) over a window of days."""
        days = int(request.query_params.get('days', 90))
        end = timezone.now().date()
        start = end - timedelta(days=days - 1)

        habits = list(self.get_queryset())
        if not habits:
            return Response({'habits': [], 'matrix': []})

        # build completion sets
        completions = HabitCompletion.objects.filter(habit__in=habits, date__range=[start, end], completed=True)
        comp_map = {str(h.id): set() for h in habits}
        for hid, d in completions.values_list('habit_id', 'date'):
            comp_map[str(hid)].add(d)

        # prepare binary vectors
        dates = [start + timedelta(days=i) for i in range(days)]
        vecs = {}
        for h in habits:
            hid = str(h.id)
            s = comp_map.get(hid, set())
            vecs[hid] = [1 if d in s else 0 for d in dates]

        def pearson(a, b):
            n = len(a)
            if n == 0:
                return 0.0
            mean_a = sum(a) / n
            mean_b = sum(b) / n
            cov = sum((ai - mean_a) * (bi - mean_b) for ai, bi in zip(a, b))
            var_a = sum((ai - mean_a) ** 2 for ai in a)
            var_b = sum((bi - mean_b) ** 2 for bi in b)
            denom = math.sqrt(var_a * var_b)
            if denom == 0:
                return 0.0
            return cov / denom

        ids = [str(h.id) for h in habits]
        matrix = []
        for i, hi in enumerate(ids):
            row = []
            for j, hj in enumerate(ids):
                val = pearson(vecs[hi], vecs[hj])
                row.append(round(val, 3))
            matrix.append(row)

        meta = [{'id': str(h.id), 'name': h.name} for h in habits]
        return Response({'start': str(start), 'end': str(end), 'habits': meta, 'matrix': matrix})

    @action(detail=False, methods=['get'])
    def chains(self, request):
        """Return chains (consecutive completion runs) per habit."""
        days = int(request.query_params.get('days', 365))
        end = timezone.now().date()
        start = end - timedelta(days=days - 1)

        habits = list(self.get_queryset())
        completions = HabitCompletion.objects.filter(habit__in=habits, date__range=[start, end], completed=True)
        comp_map = {str(h.id): sorted([d for (_, d) in completions.filter(habit=h).values_list('habit_id', 'date')]) for h in habits}

        out = []
        for h in habits:
            hid = str(h.id)
            dates = comp_map.get(hid, [])
            runs = []
            if dates:
                run_start = dates[0]
                prev = dates[0]
                length = 1
                for d in dates[1:]:
                    if (d - prev).days == 1:
                        length += 1
                        prev = d
                    else:
                        runs.append({'start': str(run_start), 'end': str(prev), 'length': length})
                        run_start = d
                        prev = d
                        length = 1
                runs.append({'start': str(run_start), 'end': str(prev), 'length': length})

            out.append({'id': hid, 'name': h.name, 'runs': runs})

        return Response({'start': str(start), 'end': str(end), 'habits': out})

    @action(detail=False, methods=['get'])
    def time_of_day(self, request):
        """Return time-of-day completion patterns and optimal times per habit."""
        days = int(request.query_params.get('days', 90))
        end = timezone.now().date()
        start = end - timedelta(days=days - 1)

        habits = list(self.get_queryset())
        completions = HabitCompletion.objects.filter(
            habit__in=habits,
            date__range=[start, end],
            completed=True,
            time_of_day_minutes__isnull=False,
        )

        data = {str(h.id): {'counts': [0] * 24, 'total_minutes': 0, 'total': 0} for h in habits}
        for hid, minutes in completions.values_list('habit_id', 'time_of_day_minutes'):
            hid = str(hid)
            hour = minutes // 60
            bucket = data.get(hid)
            if bucket is None:
                continue
            bucket['counts'][hour] += 1
            bucket['total_minutes'] += minutes
            bucket['total'] += 1

        results = []
        for h in habits:
            hid = str(h.id)
            bucket = data.get(hid, {'counts': [0] * 24, 'total_minutes': 0, 'total': 0})
            total = bucket['total']
            avg_minutes = int(round(bucket['total_minutes'] / total)) if total else None
            best_time_minutes = None
            if total:
                best_hour = max(range(24), key=lambda idx: bucket['counts'][idx])
                best_time_minutes = best_hour * 60
            elif h.preferred_times:
                best_time_minutes = h.preferred_times[0]
            results.append({
                'id': hid,
                'name': h.name,
                'counts': bucket['counts'],
                'total_completions': total,
                'average_minutes': avg_minutes,
                'best_time_minutes': best_time_minutes,
            })

        return Response({'start': str(start), 'end': str(end), 'habits': results})


class HabitCompletionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HabitCompletionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HabitCompletion.objects.filter(habit__user=self.request.user)


class HabitCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = HabitCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HabitCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HabitReminderViewSet(viewsets.ModelViewSet):
    serializer_class = HabitReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HabitReminder.objects.filter(habit__user=self.request.user)

    def perform_create(self, serializer):
        # enforce habit ownership
        habit = serializer.validated_data.get('habit')
        if habit.user != self.request.user:
            raise PermissionError('Cannot add reminder for this habit')
        serializer.save()

    @action(detail=True, methods=['get'])
    def suggest_time(self, request, pk=None):
        """Suggest an optimal time based on past completions (last 30 days)."""
        reminder = self.get_object()
        habit = reminder.habit
        cutoff = timezone.now().date() - timedelta(days=30)
        times = HabitCompletion.objects.filter(
            habit=habit, completed=True, date__gte=cutoff
        ).values_list('time_of_day_minutes', flat=True)
        times = [t for t in times if t is not None]
        if not times:
            # fall back to first preferred time or 8:00
            if habit.preferred_times:
                suggestion = habit.preferred_times[0]
                return Response({'suggestion_minutes': suggestion})
            return Response({'suggestion_minutes': 8 * 60})
        # pick mode; if multiple, pick median
        from collections import Counter
        cnt = Counter(times)
        most_common = cnt.most_common()
        suggestion = most_common[0][0]
        return Response({'suggestion_minutes': suggestion})


class HabitStackViewSet(viewsets.ModelViewSet):
    serializer_class = HabitStackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HabitStack.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
