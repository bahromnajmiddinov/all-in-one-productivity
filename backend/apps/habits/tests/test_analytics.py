from datetime import timedelta, date

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from ..models import Habit, HabitCompletion


class HabitAnalyticsTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email='u@example.com', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

        # create two habits
        self.h1 = Habit.objects.create(user=self.user, name='H1', frequency='daily')
        self.h2 = Habit.objects.create(user=self.user, name='H2', frequency='daily')

        today = date.today()
        # h1 completed last 5 days
        for i in range(5):
            d = today - timedelta(days=i)
            HabitCompletion.objects.create(habit=self.h1, date=d, completed=True)

        # h2 completed 3 of last 5 days (days 0,2,4)
        for i in [0, 2, 4]:
            d = today - timedelta(days=i)
            HabitCompletion.objects.create(habit=self.h2, date=d, completed=True)

    def test_analytics_endpoint(self):
        resp = self.client.get('/api/v1/habits/analytics/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('habits', data)
        ids = [h['name'] for h in data['habits']]
        self.assertIn('H1', ids)
        self.assertIn('H2', ids)

    def test_correlations_endpoint(self):
        resp = self.client.get('/api/v1/habits/correlations/?days=7')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('matrix', data)
        self.assertEqual(len(data['matrix']), 2)

    def test_chains_endpoint(self):
        resp = self.client.get('/api/v1/habits/chains/?days=30')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('habits', data)
        # find H1 runs
        h1 = next(h for h in data['habits'] if h['name'] == 'H1')
        self.assertTrue(len(h1['runs']) >= 1)
