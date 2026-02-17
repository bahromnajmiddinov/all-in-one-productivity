from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

from .models import (
    MoodScale, MoodEntry, MoodFactor, Emotion, MoodTrigger,
    MoodInsight, MoodStats
)

User = get_user_model()


class MoodScaleModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_numeric_scale(self):
        scale = MoodScale.objects.create(
            user=self.user,
            name='Test Scale',
            scale_type='numeric',
            min_value=1,
            max_value=10
        )
        self.assertEqual(scale.name, 'Test Scale')
        self.assertEqual(scale.scale_type, 'numeric')
        self.assertTrue(scale.is_active)
    
    def test_default_scale_uniqueness(self):
        scale1 = MoodScale.objects.create(
            user=self.user,
            name='Scale 1',
            is_default=True
        )
        scale2 = MoodScale.objects.create(
            user=self.user,
            name='Scale 2',
            is_default=True
        )
        
        scale1.refresh_from_db()
        self.assertFalse(scale1.is_default)
        self.assertTrue(scale2.is_default)


class MoodEntryModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.scale = MoodScale.objects.create(
            user=self.user,
            name='Test Scale',
            scale_type='numeric',
            min_value=1,
            max_value=10,
            scale_labels={'5': {'label': 'Okay', 'emoji': '😐'}}
        )
    
    def test_create_mood_entry(self):
        entry = MoodEntry.objects.create(
            user=self.user,
            scale=self.scale,
            mood_value=7,
            time_of_day='morning',
            entry_date=date.today()
        )
        self.assertEqual(entry.mood_value, 7)
        self.assertEqual(entry.time_of_day, 'morning')
        self.assertEqual(str(entry.mood_emoji), '')  # 7 not in scale_labels
    
    def test_mood_entry_with_scale_label(self):
        entry = MoodEntry.objects.create(
            user=self.user,
            scale=self.scale,
            mood_value=5,
            time_of_day='evening',
            entry_date=date.today()
        )
        self.assertEqual(entry.mood_label, 'Okay')
        self.assertEqual(entry.mood_emoji, '😐')


class MoodFactorModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.entry = MoodEntry.objects.create(
            user=self.user,
            mood_value=6,
            entry_date=date.today()
        )
    
    def test_create_factor(self):
        factor = MoodFactor.objects.create(
            mood_entry=self.entry,
            category='sleep',
            impact=3,
            rating=8
        )
        self.assertEqual(factor.category, 'sleep')
        self.assertEqual(factor.impact, 3)
        self.assertEqual(str(factor), 'Sleep: +3')


class EmotionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.entry = MoodEntry.objects.create(
            user=self.user,
            mood_value=8,
            entry_date=date.today()
        )
    
    def test_create_emotion(self):
        emotion = Emotion.objects.create(
            mood_entry=self.entry,
            primary_emotion='joy',
            specific_emotion='Excited',
            intensity=3,
            is_dominant=True
        )
        self.assertEqual(emotion.primary_emotion, 'joy')
        self.assertTrue(emotion.is_dominant)


class MoodStatsModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_stats_creation(self):
        stats = MoodStats.objects.create(user=self.user)
        self.assertEqual(stats.total_entries, 0)
        self.assertEqual(stats.current_streak, 0)
    
    def test_update_stats(self):
        # Create some entries
        for i in range(5):
            MoodEntry.objects.create(
                user=self.user,
                mood_value=6 + i,
                entry_date=date.today() - timedelta(days=i)
            )
        
        stats = MoodStats.objects.create(user=self.user)
        stats.update_stats()
        
        self.assertEqual(stats.total_entries, 5)
        self.assertIsNotNone(stats.avg_mood_7d)


class MoodInsightModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_insight(self):
        insight = MoodInsight.objects.create(
            user=self.user,
            insight_type='pattern',
            title='Test Pattern',
            description='This is a test insight',
            confidence=0.85
        )
        self.assertEqual(insight.insight_type, 'pattern')
        self.assertFalse(insight.is_dismissed)
