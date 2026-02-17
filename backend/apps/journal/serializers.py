from rest_framework import serializers
from .models import (
    JournalTag, JournalMood, JournalPrompt, JournalTemplate,
    JournalEntry, JournalStreak, EntryAnalytics, JournalReminder, JournalStats
)


class JournalTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalTag
        fields = ['id', 'name', 'color', 'icon']
        read_only_fields = ['id']


class JournalMoodSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalMood
        fields = [
            'id', 'user', 'user_display', 'mood', 'energy_level',
            'stress_level', 'sleep_quality', 'notes', 'created_at', 'date'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_user_display(self, obj):
        return obj.user.email
    
    def validate_mood(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Mood must be between 1 and 5")
        return value
    
    def validate_energy_level(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Energy level must be between 1 and 10")
        return value
    
    def validate_stress_level(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Stress level must be between 1 and 10")
        return value
    
    def validate_sleep_quality(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError("Sleep quality must be between 1 and 10")
        return value


class JournalPromptSerializer(serializers.ModelSerializer):
    tags_info = JournalTagSerializer(source='tags', many=True, read_only=True)
    created_by_display = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalPrompt
        fields = [
            'id', 'prompt_type', 'question', 'suggestions', 'tags',
            'tags_info', 'difficulty', 'usage_count', 'is_system',
            'created_by', 'created_by_display', 'created_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at']
    
    def get_created_by_display(self, obj):
        return obj.created_by.email if obj.created_by else None


class JournalTemplateSerializer(serializers.ModelSerializer):
    prompts_info = JournalPromptSerializer(source='prompts', many=True, read_only=True)
    default_tags_info = JournalTagSerializer(source='default_tags', many=True, read_only=True)
    
    class Meta:
        model = JournalTemplate
        fields = [
            'id', 'name', 'template_type', 'description', 'icon', 'color',
            'content', 'prompts', 'prompts_info', 'default_tags', 'default_tags_info',
            'suggest_mood', 'usage_count', 'is_system', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class JournalEntryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    tags_info = JournalTagSerializer(source='tags', many=True, read_only=True)
    template_info = JournalTemplateSerializer(source='template', read_only=True)
    mood_info = JournalMoodSerializer(source='mood', read_only=True)
    prompt_info = JournalPromptSerializer(source='prompt', read_only=True)
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'title', 'entry_date', 'created_at', 'updated_at',
            'tags', 'tags_info', 'template', 'template_info', 'mood',
            'mood_info', 'prompt', 'prompt_info', 'is_favorite', 'word_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'word_count']


class JournalEntrySerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    tags_info = JournalTagSerializer(source='tags', many=True, read_only=True)
    template_info = JournalTemplateSerializer(source='template', read_only=True)
    mood_info = JournalMoodSerializer(source='mood', read_only=True)
    prompt_info = JournalPromptSerializer(source='prompt', read_only=True)
    
    # Computed fields
    sentiment_score = serializers.SerializerMethodField()
    sentiment_label = serializers.SerializerMethodField()
    keywords = serializers.SerializerMethodField()
    analytics = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'title', 'content', 'rendered_content', 'entry_date',
            'created_at', 'updated_at', 'tags', 'tags_info', 'template',
            'template_info', 'mood', 'mood_info', 'prompt', 'prompt_info',
            'is_favorite', 'is_private', 'word_count', 'sentiment_score',
            'sentiment_label', 'keywords', 'analytics'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'word_count']
    
    def get_sentiment_score(self, obj):
        return obj.get_sentiment_score()
    
    def get_sentiment_label(self, obj):
        score = obj.get_sentiment_score()
        if score > 0.3:
            return 'positive'
        elif score < -0.3:
            return 'negative'
        return 'neutral'
    
    def get_keywords(self, obj):
        return obj.get_keywords(top_n=10)
    
    def get_analytics(self, obj):
        if hasattr(obj, 'analytics') and obj.analytics:
            return EntryAnalyticsSerializer(obj.analytics).data
        return None
    
    def validate_entry_date(self, value):
        # Prevent future dates
        if value > timezone.now().date():
            raise serializers.ValidationError("Entry date cannot be in the future")
        return value
    
    def validate(self, data):
        # Check for duplicate entry date if it's being set/changed
        user = self.context['request'].user
        entry_date = data.get('entry_date')
        
        # If updating and entry_date is in the data, check for conflicts
        if self.instance and entry_date:
            existing = JournalEntry.objects.filter(
                user=user,
                entry_date=entry_date
            ).exclude(id=self.instance.id).first()
            if existing:
                raise serializers.ValidationError({
                    'entry_date': 'An entry already exists for this date'
                })
        
        # If creating and entry_date is provided
        if not self.instance and entry_date:
            existing = JournalEntry.objects.filter(
                user=user,
                entry_date=entry_date
            ).first()
            if existing:
                raise serializers.ValidationError({
                    'entry_date': 'An entry already exists for this date'
                })
        
        return data


class EntryAnalyticsSerializer(serializers.ModelSerializer):
    entry_title = serializers.SerializerMethodField()
    entry_date = serializers.SerializerMethodField()
    
    class Meta:
        model = EntryAnalytics
        fields = [
            'id', 'entry', 'entry_title', 'entry_date',
            'word_count', 'character_count', 'sentence_count', 'paragraph_count',
            'sentiment_score', 'sentiment_label', 'keywords',
            'reading_time_minutes', 'view_count', 'edit_count',
            'first_viewed_at', 'last_viewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_entry_title(self, obj):
        return obj.entry.title or f"Entry for {obj.entry.entry_date}"
    
    def get_entry_date(self, obj):
        return obj.entry.entry_date


class JournalStreakSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    streak_percentage = serializers.SerializerMethodField()
    days_this_month = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalStreak
        fields = [
            'id', 'user', 'user_email', 'current_streak', 'last_entry_date',
            'best_streak', 'best_streak_start', 'best_streak_end',
            'total_entries', 'total_word_count',
            'longest_streak_this_month', 'longest_streak_this_year',
            'updated_at', 'streak_percentage', 'days_this_month'
        ]
        read_only_fields = ['id', 'updated_at']
    
    def get_user_email(self, obj):
        return obj.user.email
    
    def get_streak_percentage(self, obj):
        """Calculate what percentage of days in the current month have entries"""
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        days_in_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        days_in_month = days_in_month.day
        
        days_with_entries = JournalEntry.objects.filter(
            user=obj.user,
            entry_date__year=today.year,
            entry_date__month=today.month
        ).count()
        
        return round((days_with_entries / days_in_month) * 100, 1) if days_in_month > 0 else 0
    
    def get_days_this_month(self, obj):
        """Get number of entries this month"""
        from django.utils import timezone
        
        today = timezone.now().date()
        return JournalEntry.objects.filter(
            user=obj.user,
            entry_date__year=today.year,
            entry_date__month=today.month
        ).count()


class JournalReminderSerializer(serializers.ModelSerializer):
    entry_info = JournalEntryListSerializer(source='entry', read_only=True)
    is_due = serializers.SerializerMethodField()
    days_until = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalReminder
        fields = [
            'id', 'user', 'entry', 'entry_info', 'reminder_type',
            'next_reminder_date', 'highlight_excerpt', 'reflection_question',
            'is_sent', 'is_dismissed', 'sent_at', 'created_at',
            'is_due', 'days_until'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_is_due(self, obj):
        return obj.next_reminder_date <= timezone.now().date()
    
    def get_days_until(self, obj):
        today = timezone.now().date()
        delta = (obj.next_reminder_date - today).days
        return delta


class JournalStatsSerializer(serializers.ModelSerializer):
    consistency_score = serializers.SerializerMethodField()
    mood_trend = serializers.SerializerMethodField()
    writing_velocity = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalStats
        fields = [
            'id', 'user', 'total_entries', 'total_word_count', 'avg_word_count',
            'current_streak', 'longest_streak', 'avg_mood', 'mood_distribution',
            'most_used_tags', 'entries_this_week', 'entries_this_month',
            'entries_this_year', 'most_productive_day', 'avg_entries_per_week',
            'updated_at', 'consistency_score', 'mood_trend', 'writing_velocity'
        ]
        read_only_fields = ['id', 'updated_at']
    
    def get_consistency_score(self, obj):
        """Calculate overall consistency score (0-100)"""
        if obj.total_entries == 0:
            return 0
        
        # Factor in streak, weekly average, and recent activity
        streak_score = min(100, obj.current_streak * 10)
        avg_score = min(100, obj.avg_entries_per_week * 20)
        recent_score = min(100, obj.entries_this_week * 14.3)  # 7 entries = 100%
        
        return round((streak_score + avg_score + recent_score) / 3, 1)
    
    def get_mood_trend(self, obj):
        """Calculate mood trend: improving, declining, stable"""
        if not obj.avg_mood:
            return 'unknown'
        
        # Get recent mood vs average
        from django.db.models import Avg
        from django.utils import timezone
        
        recent_moods = JournalMood.objects.filter(
            user=obj.user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).aggregate(avg=Avg('mood'))['avg']
        
        if recent_moods:
            if recent_moods > obj.avg_mood + 0.3:
                return 'improving'
            elif recent_moods < obj.avg_mood - 0.3:
                return 'declining'
        
        return 'stable'
    
    def get_writing_velocity(self, obj):
        """Calculate writing velocity trend"""
        if obj.total_entries < 2:
            return 'unknown'
        
        from django.utils import timezone
        
        # Compare word count from last 30 days vs previous 30 days
        today = timezone.now().date()
        last_30 = today - timedelta(days=30)
        prev_30 = last_30 - timedelta(days=30)
        
        recent_words = JournalEntry.objects.filter(
            user=obj.user,
            entry_date__gte=last_30
        ).aggregate(total=Count('word_count'))['total'] or 0
        
        prev_words = JournalEntry.objects.filter(
            user=obj.user,
            entry_date__gte=prev_30,
            entry_date__lt=last_30
        ).aggregate(total=Count('word_count'))['total'] or 0
        
        if prev_words == 0:
            return 'increasing'
        
        ratio = recent_words / prev_words
        if ratio > 1.1:
            return 'increasing'
        elif ratio < 0.9:
            return 'decreasing'
        return 'stable'


from django.db.models import Count
from datetime import timedelta


# Create system prompts
def create_system_prompts():
    """Create default journal prompts if they don't exist"""
    prompts_data = [
        {
            'prompt_type': 'reflection',
            'question': 'What are three things you learned today?',
            'suggestions': '1. Something new about yourself\n2. Something new about others\n3. Something new about the world',
            'difficulty': 2,
            'is_system': True
        },
        {
            'prompt_type': 'gratitude',
            'question': 'What are three things you are grateful for today?',
            'suggestions': 'Think about people, experiences, or simple pleasures',
            'difficulty': 1,
            'is_system': True
        },
        {
            'prompt_type': 'gratitude',
            'question': 'Who made a positive impact on your day?',
            'suggestions': 'Friends, family, coworkers, or even strangers',
            'difficulty': 2,
            'is_system': True
        },
        {
            'prompt_type': 'goal',
            'question': 'What is one goal you want to accomplish tomorrow?',
            'suggestions': 'Make it specific, measurable, and achievable',
            'difficulty': 2,
            'is_system': True
        },
        {
            'prompt_type': 'goal',
            'question': 'What progress did you make on your long-term goals today?',
            'suggestions': 'Small steps count - celebrate your progress',
            'difficulty': 3,
            'is_system': True
        },
        {
            'prompt_type': 'reflection',
            'question': 'How did you handle challenges today?',
            'suggestions': 'What worked? What would you do differently?',
            'difficulty': 3,
            'is_system': True
        },
        {
            'prompt_type': 'creativity',
            'question': 'If today had a theme song, what would it be?',
            'suggestions': 'Think about the mood, energy, and feelings of your day',
            'difficulty': 2,
            'is_system': True
        },
        {
            'prompt_type': 'mindfulness',
            'question': 'What moments of peace or calm did you experience today?',
            'suggestions': 'Even brief moments count - a deep breath, a quiet moment',
            'difficulty': 1,
            'is_system': True
        },
        {
            'prompt_type': 'reflection',
            'question': 'What drained your energy today? What gave you energy?',
            'suggestions': 'Track your energy patterns throughout the day',
            'difficulty': 2,
            'is_system': True
        },
        {
            'prompt_type': 'goal',
            'question': 'What habit do you want to build or break?',
            'suggestions': 'Focus on one habit at a time',
            'difficulty': 3,
            'is_system': True
        },
    ]
    
    for prompt_data in prompts_data:
        JournalPrompt.objects.get_or_create(
            question=prompt_data['question'],
            defaults=prompt_data
        )


# Create system templates
def create_system_templates():
    """Create default journal templates if they don't exist"""
    templates_data = [
        {
            'name': 'Morning Pages',
            'template_type': 'morning',
            'description': 'Start your day with reflection and intention setting',
            'icon': 'sunrise',
            'color': '#F59E0B',
            'content': '''## Morning Intention
What is your main intention for today?

## Gratitude
I am grateful for:
- 
- 
- 

## Today\'s Focus
Top 3 priorities:
1. 
2. 
3. 

## Energy Check
Energy level: ___/10
Mood: _____

## Thoughts for the Day
{{prompt}}''',
            'suggest_mood': True,
            'is_system': True,
            'is_default': True
        },
        {
            'name': 'Evening Reflection',
            'template_type': 'evening',
            'description': 'Reflect on your day and prepare for tomorrow',
            'icon': 'moon',
            'color': '#6366F1',
            'content': '''## Daily Review
What went well today?



## What didn\'t go as planned?



## Gratitude
Three things I\'m grateful for:
1. 
2. 
3. 

## Tomorrow\'s Plan
One thing I want to accomplish:



## Mood Check
Overall mood today: _____
Stress level: _____/10
Energy level: _____/10

## Reflection
{{prompt}}''',
            'suggest_mood': True,
            'is_system': True,
            'is_default': True
        },
        {
            'name': 'Weekly Review',
            'template_type': 'weekly',
            'description': 'Review your week and plan ahead',
            'icon': 'calendar',
            'color': '#10B981',
            'content': '''## This Week\'s Wins



## Challenges and Learnings



## Goal Progress
Goals worked on:
- Goal: _____ Progress: _____
- Goal: _____ Progress: _____

## Habits Tracker
Which habits did you maintain? Which slipped?



## Next Week\'s Focus
Top 3 priorities:
1. 
2. 
3. 

## Gratitude
Best moment of the week:



## Reflection
{{prompt}}''',
            'suggest_mood': False,
            'is_system': True,
            'is_default': False
        },
        {
            'name': 'Gratitude Journal',
            'template_type': 'gratitude',
            'description': 'Practice daily gratitude',
            'icon': 'heart',
            'color': '#EF4444',
            'content': '''## Today\'s Gratitude

### People I\'m Thankful For
- 
- 

### Experiences I Appreciate
- 
- 

### Simple Pleasures
- 
- 

### Personal Growth
I\'m proud of myself for...



### Opportunities for Tomorrow
I\'m looking forward to...


{{prompt}}''',
            'suggest_mood': False,
            'is_system': True,
            'is_default': False
        },
        {
            'name': 'Goal Setting',
            'template_type': 'goal',
            'description': 'Define and track your goals',
            'icon': 'target',
            'color': '#3B82F6',
            'content': '''## Goal Definition
What is your main goal?



## Why This Goal Matters



## Action Plan
Step 1: 
Step 2: 
Step 3: 

## Potential Obstacles



## Support Needed



## Success Criteria
How will you know when you\'ve achieved this goal?



## Timeline
Start date: _____
Target date: _____

## Daily Check-in
Progress made today:

{{prompt}}''',
            'suggest_mood': False,
            'is_system': True,
            'is_default': False
        },
    ]
    
    for template_data in templates_data:
        JournalTemplate.objects.get_or_create(
            name=template_data['name'],
            defaults=template_data
        )
