from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
        }

    def test_user_registration(self):
        """Test user registration"""
        response = self.client.post('/api/v1/auth/register/', self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], self.user_data['email'])

    def test_user_login(self):
        """Test user login"""
        # Register user first
        self.client.post('/api/v1/auth/register/', self.user_data)
        
        # Login
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password'],
        }
        response = self.client.post('/api/v1/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_get_current_user(self):
        """Test getting current user info"""
        # Register and login
        register_response = self.client.post('/api/v1/auth/register/', self.user_data)
        token = register_response.data['access']
        
        # Get current user
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user_data['email'])

    def test_unauthenticated_access(self):
        """Test that unauthenticated requests are denied"""
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
        }
        self.client.post('/api/v1/auth/register/', self.user_data)
        login_response = self.client.post(
            '/api/v1/auth/login/',
            {'email': self.user_data['email'], 'password': self.user_data['password']}
        )
        self.token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_get_user_profile(self):
        """Test getting user profile"""
        response = self.client.get('/api/v1/auth/me/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('timezone', response.data)
        self.assertIn('theme', response.data)

    def test_update_user_profile(self):
        """Test updating user profile"""
        update_data = {'bio': 'This is my bio', 'timezone': 'America/New_York'}
        response = self.client.patch('/api/v1/auth/me/profile/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], update_data['bio'])
        self.assertEqual(response.data['timezone'], update_data['timezone'])

    def test_get_user_preferences(self):
        """Test getting user preferences"""
        response = self.client.get('/api/v1/auth/me/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('theme', response.data)
        self.assertIn('language', response.data)
