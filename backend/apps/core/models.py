import uuid
from datetime import date

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]

    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
    ]

    DATE_FORMAT_CHOICES = [
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
    ]

    TIME_FORMAT_CHOICES = [
        ('12h', '12 Hour'),
        ('24h', '24 Hour'),
    ]

    DEFAULT_VIEW_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('tasks', 'Tasks'),
        ('calendar', 'Calendar'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    date_of_birth = models.DateField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True)
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='system')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    date_format = models.CharField(max_length=15, choices=DATE_FORMAT_CHOICES, default='YYYY-MM-DD')
    time_format = models.CharField(max_length=3, choices=TIME_FORMAT_CHOICES, default='24h')
    week_starts_on = models.IntegerField(default=0)  # 0=Monday, 6=Sunday
    default_view = models.CharField(max_length=20, choices=DEFAULT_VIEW_CHOICES, default='dashboard')
    enable_notifications = models.BooleanField(default=True)
    compact_mode = models.BooleanField(default=False)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.user.email}'s profile"


class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    theme = models.CharField(max_length=10, default='system')
    language = models.CharField(max_length=5, default='en')
    date_format = models.CharField(max_length=15, default='YYYY-MM-DD')
    time_format = models.CharField(max_length=3, default='24h')
    week_starts_on = models.IntegerField(default=0)
    default_view = models.CharField(max_length=20, default='dashboard')
    enable_notifications = models.BooleanField(default=True)
    compact_mode = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    desktop_notifications = models.BooleanField(default=True)
    reminder_time = models.IntegerField(default=30)  # minutes before
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_preferences'

    def __str__(self):
        return f"{self.user.email}'s preferences"
