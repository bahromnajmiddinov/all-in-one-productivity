from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from .models import (
    JournalTag, JournalMood, JournalPrompt, JournalTemplate,
    JournalEntry, JournalStreak, EntryAnalytics
)

User = get_user_model()


class JournalTagModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.tag = JournalTag.objects.create(
            user=self.user,
            name='Personal',
            color='#FF5733'
        )
    
    def test_tag_creation(self):
        self.assertEqual(self.tag.name, 'Personal')
        self.assertEqual(self.tag.user, self.user)
    
    def test_tag_str(self):
        self.assertEqual(str(self.tag), 'Personal')


class JournalMoodModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.mood = JournalMood.objects.create(
            user=self.user,
            mood=4,
            energy_level=7,
            stress_level=3
        )
    
    def test_mood_creation(self):
        self.assertEqual(self.mood.mood, 4)
        self.assertEqual(self.mood.user, self.user)
    
    def test_mood_str(self):
        self.assertIn('Good', str(self.mood))


class JournalEntryModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.entry = JournalEntry.objects.create(
            user=self.user,
            title='Test Entry',
            content='This is a test entry with some content.'
        )
    
    def test_entry_creation(self):
        self.assertEqual(self.entry.title, 'Test Entry')
        self.assertEqual(self.entry.user, self.user)
        self.assertGreater(self.entry.word_count, 0)
    
    def test_word_count_calculation(self):
        self.assertEqual(self.entry.word_count, 9)
    
    def test_sentiment_analysis(self):
        # Test with positive content
        self.entry.content = 'I am happy and grateful for today'
        self.entry.save()
        
        sentiment = self.entry.get_sentiment_score()
        self.assertGreater(sentiment, 0)
    
    def test_keyword_extraction(self):
        keywords = self.entry.get_keywords()
        self.assertIsInstance(keywords, list)


class JournalStreakModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.streak = JournalStreak.objects.create(
            user=self.user,
            current_streak=5,
            last_entry_date=timezone.now().date()
        )
    
    def test_streak_creation(self):
        self.assertEqual(self.streak.current_streak, 5)
        self.assertEqual(self.streak.user, self.user)
    
    def test_streak_update_consecutive(self):
        tomorrow = timezone.now().date() + timedelta(days=1)
        self.streak.update_streak(tomorrow)
        
        self.assertEqual(self.streak.current_streak, 6)
        self.assertEqual(self.streak.total_entries, 1)


class EntryAnalyticsModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.entry = JournalEntry.objects.create(
            user=self.user,
            title='Test Entry',
            content='This is a test entry with some content.'
        )
        self.analytics = EntryAnalytics.objects.create(entry=self.entry)
    
    def test_analytics_creation(self):
        self.assertEqual(self.analytics.entry, self.entry)
    
    def test_analytics_update(self):
        self.analytics.update_analytics()
        
        self.assertGreater(self.analytics.word_count, 0)
        self.assertGreater(self.analytics.character_count, 0)
        self.assertIn(self.analytics.sentiment_label, ['positive', 'negative', 'neutral'])
