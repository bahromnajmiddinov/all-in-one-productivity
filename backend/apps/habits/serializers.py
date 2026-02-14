from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from .models import Habit, HabitCompletion, HabitCategory, HabitReminder, HabitStack


def _compute_streaks(habit):
    """Compute current and longest streak for a habit."""
    today = timezone.localdate()
    completions = list(
        HabitCompletion.objects.filter(habit=habit, completed=True)
        .values_list('date', flat=True)
        .order_by('-date')
    )
    if not completions:
        return 0, 0

    # Longest streak: walk sorted dates backward and find max consecutive run
    dates_set = set(completions)
    longest = 0
    current_run = 0
    # Iterate by date descending to find runs
    sorted_dates = sorted(dates_set, reverse=True)
    prev = None
    for d in sorted_dates:
        if prev is None:
            current_run = 1
        elif (prev - d).days == 1:
            current_run += 1
        else:
            longest = max(longest, current_run)
            current_run = 1
        prev = d
    longest = max(longest, current_run)

    # Current streak: from today (or last completion before a gap) going back
    current = 0
    if habit.frequency == 'daily':
        d = today
        while d in dates_set:
            current += 1
            d -= timedelta(days=1)
    else:
        # Weekly: count consecutive weeks where all target days were completed
        week_start = today - timedelta(days=today.weekday())
        while True:
            week_dates = [week_start + timedelta(days=i) for i in (habit.target_weekdays or [])]
            if all(wd <= today and wd in dates_set for wd in week_dates):
                current += 1
                week_start -= timedelta(days=7)
            else:
                break

    return current, longest


class HabitCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCompletion
        fields = ['id', 'habit', 'date', 'completed', 'timestamp', 'time_of_day_minutes', 'created_at']
        read_only_fields = ['id', 'created_at']


class HabitSerializer(serializers.ModelSerializer):
    current_streak = serializers.SerializerMethodField()
    longest_streak = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()
    completed_today = serializers.SerializerMethodField()
    category = serializers.CharField(source='category.name', read_only=True)
    total_completions = serializers.IntegerField(read_only=True)
    preferred_times = serializers.JSONField(read_only=True)

    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'description', 'frequency', 'target_weekdays',
            'custom_interval_days',
            'order', 'is_archived', 'created_at',
            'current_streak', 'longest_streak',
            'completion_rate', 'completed_today',
            'category', 'total_completions', 'preferred_times',
        ]
        read_only_fields = ['id', 'created_at']

    def get_current_streak(self, obj):
        cur, _ = _compute_streaks(obj)
        return cur

    def get_longest_streak(self, obj):
        _, long = _compute_streaks(obj)
        return long

    def get_completion_rate(self, obj):
        today = timezone.localdate()
        start = today - timedelta(days=30)
        due_dates = []
        d = start
        while d <= today:
            if obj.is_due_on_date(d):
                due_dates.append(d)
            d += timedelta(days=1)
        if not due_dates:
            return 0.0
        completed = HabitCompletion.objects.filter(
            habit=obj, date__in=due_dates, completed=True
        ).count()
        return round(100.0 * completed / len(due_dates), 1)

    def get_completed_today(self, obj):
        today = timezone.localdate()
        return HabitCompletion.objects.filter(
            habit=obj, date=today, completed=True
        ).exists()


class HabitCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCategory
        fields = ['id', 'name']
        read_only_fields = ['id']


class HabitReminderSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source='habit.name', read_only=True)

    class Meta:
        model = HabitReminder
        fields = ['id', 'habit', 'habit_name', 'times', 'smart', 'active', 'last_sent']
        read_only_fields = ['id', 'last_sent']


class HabitStackSerializer(serializers.ModelSerializer):
    previous_name = serializers.CharField(source='previous.name', read_only=True)
    next_name = serializers.CharField(source='next.name', read_only=True)

    class Meta:
        model = HabitStack
        fields = ['id', 'user', 'previous', 'previous_name', 'next', 'next_name', 'order', 'gap_minutes']
        read_only_fields = ['id']
