from datetime import date, timedelta
from rest_framework import serializers
from .models import Habit, HabitCompletion


class HabitSerializer(serializers.ModelSerializer):
    current_streak = serializers.SerializerMethodField()
    longest_streak = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()
    completed_today = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'frequency', 'target_per_week', 'is_active',
            'current_streak', 'longest_streak', 'completion_rate',
            'completed_today', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_current_streak(self, obj):
        return self._calculate_streak(obj)

    def get_longest_streak(self, obj):
        return self._calculate_longest_streak(obj)

    def get_completion_rate(self, obj):
        completions = obj.completions.count()
        days_since_created = (date.today() - obj.created_at.date()).days + 1
        if days_since_created <= 0:
            return 0
        return round((completions / days_since_created) * 100, 1)

    def get_completed_today(self, obj):
        return obj.completions.filter(date=date.today()).exists()

    def _calculate_streak(self, habit):
        """Calculate current consecutive days streak"""
        completions = habit.completions.order_by('-date').values_list('date', flat=True)
        if not completions:
            return 0

        streak = 0
        check_date = date.today()

        # If not completed today, start from yesterday
        if completions[0] != check_date:
            check_date = date.today() - timedelta(days=1)

        for completion_date in completions:
            if completion_date == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        return streak

    def _calculate_longest_streak(self, habit):
        """Calculate longest streak ever"""
        completions = list(habit.completions.order_by('date').values_list('date', flat=True))
        if not completions:
            return 0

        longest = 1
        current = 1

        for i in range(1, len(completions)):
            if (completions[i] - completions[i-1]).days == 1:
                current += 1
                longest = max(longest, current)
            else:
                current = 1

        return longest


class HabitCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCompletion
        fields = ['id', 'habit', 'date', 'completed_at', 'notes']
        read_only_fields = ['id', 'completed_at']
