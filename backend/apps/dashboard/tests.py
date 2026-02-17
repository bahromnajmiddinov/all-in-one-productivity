from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Dashboard, DashboardWidget, DashboardPreference

User = get_user_model()


class DashboardModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_dashboard_creation(self):
        dashboard = Dashboard.objects.create(
            user=self.user,
            name='Test Dashboard',
            dashboard_type='custom',
            description='Test description'
        )
        self.assertEqual(dashboard.name, 'Test Dashboard')
        self.assertEqual(dashboard.user, self.user)
        self.assertFalse(dashboard.is_default)
    
    def test_default_dashboard_uniqueness(self):
        dashboard1 = Dashboard.objects.create(
            user=self.user,
            name='Dashboard 1',
            dashboard_type='custom',
            is_default=True
        )
        dashboard2 = Dashboard.objects.create(
            user=self.user,
            name='Dashboard 2',
            dashboard_type='custom',
            is_default=True
        )
        
        # Refresh from database
        dashboard1.refresh_from_db()
        self.assertFalse(dashboard1.is_default)
        self.assertTrue(dashboard2.is_default)
    
    def test_widget_creation(self):
        dashboard = Dashboard.objects.create(
            user=self.user,
            name='Test Dashboard',
            dashboard_type='custom'
        )
        widget = DashboardWidget.objects.create(
            dashboard=dashboard,
            widget_type='metric_card',
            title='Test Widget',
            data_source='tasks',
            config={'metric': 'completed_today'}
        )
        
        self.assertEqual(widget.title, 'Test Widget')
        self.assertEqual(widget.dashboard, dashboard)
        self.assertEqual(widget.widget_type, 'metric_card')


class DashboardPreferenceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_preference_creation(self):
        preference = DashboardPreference.objects.create(
            user=self.user,
            timezone='America/New_York',
            default_time_range='7d'
        )
        self.assertEqual(preference.user, self.user)
        self.assertEqual(preference.timezone, 'America/New_York')
