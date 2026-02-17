from django.core.management.base import BaseCommand
from apps.journal.serializers import create_system_prompts, create_system_templates


class Command(BaseCommand):
    help = 'Initialize journal system with default prompts and templates'

    def handle(self, *args, **options):
        self.stdout.write('Creating system prompts...')
        create_system_prompts()
        self.stdout.write(self.style.SUCCESS('✓ System prompts created'))

        self.stdout.write('Creating system templates...')
        create_system_templates()
        self.stdout.write(self.style.SUCCESS('✓ System templates created'))

        self.stdout.write(self.style.SUCCESS('\nJournal data initialized successfully!'))
