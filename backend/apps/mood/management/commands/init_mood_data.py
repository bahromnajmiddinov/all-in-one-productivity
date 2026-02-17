from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.mood.models import MoodScale

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize default mood scales for users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='Email of specific user to initialize (default: all users)'
        )

    def handle(self, *args, **options):
        user_email = options.get('user')
        
        if user_email:
            users = User.objects.filter(email=user_email)
        else:
            users = User.objects.all()
        
        for user in users:
            self.create_default_scales(user)
        
        self.stdout.write(self.style.SUCCESS(f'Created default mood scales for {users.count()} user(s)'))
    
    def create_default_scales(self, user):
        """Create default mood scales for a user"""
        
        # 1-10 Numeric Scale (default)
        numeric_scale, created = MoodScale.objects.get_or_create(
            user=user,
            name='1-10 Scale',
            defaults={
                'scale_type': 'numeric',
                'description': 'Standard 1-10 mood rating scale',
                'min_value': 1,
                'max_value': 10,
                'is_default': True,
                'is_active': True,
                'scale_labels': {
                    '1': {'label': 'Terrible', 'emoji': '😢'},
                    '2': {'label': 'Very Bad', 'emoji': '😞'},
                    '3': {'label': 'Bad', 'emoji': '☹️'},
                    '4': {'label': 'Not Good', 'emoji': '😕'},
                    '5': {'label': 'Okay', 'emoji': '😐'},
                    '6': {'label': 'Fine', 'emoji': '🙂'},
                    '7': {'label': 'Good', 'emoji': '😊'},
                    '8': {'label': 'Very Good', 'emoji': '😄'},
                    '9': {'label': 'Great', 'emoji': '😁'},
                    '10': {'label': 'Excellent', 'emoji': '🤩'},
                }
            }
        )
        
        if created:
            self.stdout.write(f'  Created numeric scale for {user.email}')
        
        # Emoji Scale
        emoji_scale, created = MoodScale.objects.get_or_create(
            user=user,
            name='Emoji Scale',
            defaults={
                'scale_type': 'emoji',
                'description': 'Simple emoji-based mood scale',
                'min_value': 1,
                'max_value': 5,
                'is_default': False,
                'is_active': True,
                'scale_labels': {
                    '1': {'label': 'Awful', 'emoji': '😫'},
                    '2': {'label': 'Bad', 'emoji': '😕'},
                    '3': {'label': 'Okay', 'emoji': '😐'},
                    '4': {'label': 'Good', 'emoji': '🙂'},
                    '5': {'label': 'Great', 'emoji': '😄'},
                }
            }
        )
        
        if created:
            self.stdout.write(f'  Created emoji scale for {user.email}')
        
        # Descriptive Scale
        descriptive_scale, created = MoodScale.objects.get_or_create(
            user=user,
            name='Descriptive Scale',
            defaults={
                'scale_type': 'descriptive',
                'description': 'Words-based mood scale',
                'min_value': 1,
                'max_value': 7,
                'is_default': False,
                'is_active': True,
                'scale_labels': {
                    '1': {'label': 'Depressed', 'emoji': '😢'},
                    '2': {'label': 'Sad', 'emoji': '😞'},
                    '3': {'label': 'Down', 'emoji': '😔'},
                    '4': {'label': 'Neutral', 'emoji': '😐'},
                    '5': {'label': 'Content', 'emoji': '🙂'},
                    '6': {'label': 'Happy', 'emoji': '😊'},
                    '7': {'label': 'Euphoric', 'emoji': '🤩'},
                }
            }
        )
        
        if created:
            self.stdout.write(f'  Created descriptive scale for {user.email}')
