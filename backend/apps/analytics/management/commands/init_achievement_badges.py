from django.core.management.base import BaseCommand
from apps.analytics.models import AchievementBadge


class Command(BaseCommand):
    help = 'Initialize default achievement badges'

    def handle(self, *args, **kwargs):
        badges = [
            # Consistency badges
            {
                'name': 'first_entry',
                'display_name': 'First Steps',
                'description': 'Create your first entry in any module',
                'category': 'consistency',
                'level': 'bronze',
                'icon': 'footprints',
                'color': '#CD7F32',
                'criteria_type': 'first_entry',
                'criteria_value': 1,
            },
            {
                'name': 'week_streak',
                'display_name': 'Week Warrior',
                'description': 'Maintain a 7-day streak in any module',
                'category': 'consistency',
                'level': 'silver',
                'icon': 'calendar-check',
                'color': '#C0C0C0',
                'criteria_type': 'streak_days',
                'criteria_value': 7,
            },
            {
                'name': 'month_streak',
                'display_name': 'Monthly Master',
                'description': 'Maintain a 30-day streak in any module',
                'category': 'consistency',
                'level': 'gold',
                'icon': 'calendar-star',
                'color': '#FFD700',
                'criteria_type': 'streak_days',
                'criteria_value': 30,
            },
            {
                'name': 'century_streak',
                'display_name': 'Century Club',
                'description': 'Maintain a 100-day streak in any module',
                'category': 'consistency',
                'level': 'platinum',
                'icon': 'award',
                'color': '#E5E4E2',
                'criteria_type': 'streak_days',
                'criteria_value': 100,
            },
            # Milestone badges
            {
                'name': 'task_master',
                'display_name': 'Task Master',
                'description': 'Complete 100 tasks',
                'category': 'milestone',
                'level': 'silver',
                'icon': 'check-circle',
                'color': '#C0C0C0',
                'criteria_type': 'total_count',
                'criteria_value': 100,
                'criteria_module': 'tasks',
            },
            {
                'name': 'habit_former',
                'display_name': 'Habit Former',
                'description': 'Complete 500 habit check-ins',
                'category': 'milestone',
                'level': 'gold',
                'icon': 'repeat',
                'color': '#FFD700',
                'criteria_type': 'total_count',
                'criteria_value': 500,
                'criteria_module': 'habits',
            },
            {
                'name': 'mood_tracker',
                'display_name': 'Emotion Explorer',
                'description': 'Log 200 mood entries',
                'category': 'milestone',
                'level': 'gold',
                'icon': 'smile',
                'color': '#FFD700',
                'criteria_type': 'total_count',
                'criteria_value': 200,
                'criteria_module': 'mood',
            },
            {
                'name': 'sleep_champion',
                'display_name': 'Sleep Champion',
                'description': 'Track 90 nights of sleep',
                'category': 'milestone',
                'level': 'silver',
                'icon': 'moon',
                'color': '#C0C0C0',
                'criteria_type': 'total_count',
                'criteria_value': 90,
                'criteria_module': 'sleep',
            },
            # Exploration badges
            {
                'name': 'module_explorer',
                'display_name': 'Explorer',
                'description': 'Use 3 different modules',
                'category': 'exploration',
                'level': 'bronze',
                'icon': 'compass',
                'color': '#CD7F32',
                'criteria_type': 'modules_used',
                'criteria_value': 3,
            },
            {
                'name': 'module_master',
                'display_name': 'Module Master',
                'description': 'Use 6 different modules',
                'category': 'exploration',
                'level': 'silver',
                'icon': 'layers',
                'color': '#C0C0C0',
                'criteria_type': 'modules_used',
                'criteria_value': 6,
            },
            {
                'name': 'power_user',
                'display_name': 'Power User',
                'description': 'Use all available modules',
                'category': 'exploration',
                'level': 'gold',
                'icon': 'zap',
                'color': '#FFD700',
                'criteria_type': 'modules_used',
                'criteria_value': 8,
            },
            # Special badges
            {
                'name': 'early_bird',
                'display_name': 'Early Bird',
                'description': 'Complete a task before 6 AM',
                'category': 'special',
                'level': 'bronze',
                'icon': 'sunrise',
                'color': '#CD7F32',
                'criteria_type': 'early_completion',
                'criteria_value': 1,
            },
            {
                'name': 'night_owl',
                'display_name': 'Night Owl',
                'description': 'Complete a task after 10 PM',
                'category': 'special',
                'level': 'bronze',
                'icon': 'moon',
                'color': '#CD7F32',
                'criteria_type': 'late_completion',
                'criteria_value': 1,
            },
            {
                'name': 'weekend_warrior',
                'display_name': 'Weekend Warrior',
                'description': 'Complete activities on 10 weekends',
                'category': 'special',
                'level': 'silver',
                'icon': 'calendar',
                'color': '#C0C0C0',
                'criteria_type': 'weekend_activities',
                'criteria_value': 10,
            },
        ]

        created_count = 0
        for badge_data in badges:
            badge, created = AchievementBadge.objects.get_or_create(
                name=badge_data['name'],
                defaults=badge_data
            )
            if created:
                created_count += 1
                self.stdout.write(f"Created badge: {badge.display_name}")

        self.stdout.write(
            self.style.SUCCESS(f"\nSuccessfully created {created_count} achievement badges")
        )
