from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta, date
import uuid
import re

User = get_user_model()


class JournalTag(models.Model):
    """Tags for categorizing journal entries by themes, people, events"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')
    icon = models.CharField(max_length=50, blank=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return self.name


class JournalMood(models.Model):
    """Mood tracking linked to journal entries"""
    MOOD_CHOICES = [
        (5, 'Amazing'),
        (4, 'Good'),
        (3, 'Okay'),
        (2, 'Bad'),
        (1, 'Terrible'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_moods')
    
    # Mood rating
    mood = models.PositiveSmallIntegerField(choices=MOOD_CHOICES)
    
    # Additional context
    energy_level = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10")
    stress_level = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10")
    sleep_quality = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10")
    
    # Optional notes
    notes = models.TextField(blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    date = models.DateField(default=timezone.now)
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['mood']),
        ]
    
    def __str__(self):
        return f"{self.get_mood_display()} on {self.date}"


class JournalPrompt(models.Model):
    """Daily reflection questions, gratitude prompts, goal reviews"""
    PROMPT_TYPES = [
        ('reflection', 'Daily Reflection'),
        ('gratitude', 'Gratitude'),
        ('goal', 'Goal Review'),
        ('creativity', 'Creative Writing'),
        ('mindfulness', 'Mindfulness'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    prompt_type = models.CharField(max_length=20, choices=PROMPT_TYPES)
    question = models.TextField(help_text="The prompt/question for the user")
    
    # Optional: predefined answers or suggestions
    suggestions = models.TextField(blank=True, help_text="Suggested answers or starter phrases")
    
    # Categorization
    tags = models.ManyToManyField(JournalTag, blank=True)
    
    # Difficulty or depth level
    difficulty = models.PositiveSmallIntegerField(default=3, help_text="1-5 difficulty level")
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)
    
    # System vs custom prompts
    is_system = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='created_prompts')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['prompt_type', 'difficulty', 'question']
        indexes = [
            models.Index(fields=['prompt_type']),
            models.Index(fields=['difficulty']),
        ]
    
    def __str__(self):
        return f"{self.get_prompt_type_display()}: {self.question[:50]}..."
    
    def increment_usage(self):
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class JournalTemplate(models.Model):
    """Entry templates for morning pages, evening reflections, weekly reviews"""
    TEMPLATE_TYPES = [
        ('morning', 'Morning Pages'),
        ('evening', 'Evening Reflection'),
        ('weekly', 'Weekly Review'),
        ('monthly', 'Monthly Review'),
        ('gratitude', 'Gratitude Journal'),
        ('goal', 'Goal Setting'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_templates')
    
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='book')
    color = models.CharField(max_length=7, default='#3B82F6')
    
    # Template structure
    content = models.TextField(help_text="Template content with {{prompt}} placeholders")
    prompts = models.ManyToManyField(JournalPrompt, blank=True)
    
    # Default tags and mood
    default_tags = models.ManyToManyField(JournalTag, blank=True, related_name='template_defaults')
    suggest_mood = models.BooleanField(default=False)
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)
    
    # System vs custom templates
    is_system = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-usage_count', 'name']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return self.name
    
    def increment_usage(self):
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class JournalEntry(models.Model):
    """Daily journal entries with rich text support"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_entries')
    
    # Entry content
    title = models.CharField(max_length=300, blank=True)
    content = models.TextField()
    rendered_content = models.TextField(blank=True, help_text="HTML rendered from markdown")
    
    # Date and time
    entry_date = models.DateField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Organization
    tags = models.ManyToManyField(JournalTag, blank=True)
    template = models.ForeignKey(JournalTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='entries')
    prompt = models.ForeignKey(JournalPrompt, on_delete=models.SET_NULL, null=True, blank=True, related_name='entries')
    
    # Mood integration
    mood = models.ForeignKey(JournalMood, on_delete=models.SET_NULL, null=True, blank=True, related_name='entries')
    
    # Status flags
    is_favorite = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)
    
    # Word count tracking
    word_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-entry_date', '-created_at']
        unique_together = ['user', 'entry_date']
        indexes = [
            models.Index(fields=['user', '-entry_date']),
            models.Index(fields=['user', 'is_favorite']),
        ]
    
    def __str__(self):
        return self.title or f"Entry for {self.entry_date}"
    
    def save(self, *args, **kwargs):
        # Update word count
        if self.content:
            self.word_count = len(self.content.split())
        else:
            self.word_count = 0
        super().save(*args, **kwargs)
    
    def get_sentiment_score(self):
        """
        Simple sentiment analysis using keyword matching.
        Returns a score from -1 (very negative) to 1 (very positive).
        """
        if not self.content:
            return 0
        
        positive_words = ['happy', 'joy', 'grateful', 'thankful', 'excited', 'love', 'wonderful',
                          'amazing', 'great', 'fantastic', 'blessed', 'peaceful', 'calm',
                          'accomplished', 'proud', 'optimistic', 'hopeful', 'content']
        
        negative_words = ['sad', 'angry', 'frustrated', 'stressed', 'anxious', 'worried', 'tired',
                          'exhausted', 'disappointed', 'upset', 'overwhelmed', 'lonely', 'depressed',
                          'hopeless', 'fearful', 'nervous', 'irritated', 'annoyed']
        
        content_lower = self.content.lower()
        
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        total = positive_count + negative_count
        if total == 0:
            return 0
        
        return (positive_count - negative_count) / total
    
    def get_keywords(self, top_n=10):
        """Extract top keywords from entry content"""
        if not self.content:
            return []
        
        # Simple keyword extraction based on word frequency
        words = re.findall(r'\b[a-zA-Z]{4,}\b', self.content.lower())
        
        # Filter common stop words
        stop_words = {'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'them',
                      'their', 'what', 'when', 'where', 'which', 'there', 'could', 'would',
                      'should', 'about', 'after', 'before', 'being', 'because', 'through',
                      'during', 'without', 'however', 'nothing', 'something', 'anything'}
        
        words = [w for w in words if w not in stop_words and len(w) > 3]
        
        # Count frequencies
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        # Sort by frequency and return top N
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        return [word for word, count in sorted_words[:top_n]]


class JournalStreak(models.Model):
    """Track consecutive journaling days for users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='journal_streak')
    
    # Current streak
    current_streak = models.PositiveIntegerField(default=0)
    last_entry_date = models.DateField(null=True, blank=True)
    
    # Best streak
    best_streak = models.PositiveIntegerField(default=0)
    best_streak_start = models.DateField(null=True, blank=True)
    best_streak_end = models.DateField(null=True, blank=True)
    
    # Statistics
    total_entries = models.PositiveIntegerField(default=0)
    total_word_count = models.PositiveIntegerField(default=0)
    
    # Streak milestones
    longest_streak_this_month = models.PositiveIntegerField(default=0)
    longest_streak_this_year = models.PositiveIntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Journal Streak'
    
    def __str__(self):
        return f"{self.user.email} - {self.current_streak} day streak"
    
    def update_streak(self, entry_date):
        """Update streak based on new entry date"""
        self.total_entries += 1
        
        if not self.last_entry_date:
            # First entry ever
            self.current_streak = 1
            self.best_streak = 1
            self.best_streak_start = entry_date
            self.best_streak_end = entry_date
            self.last_entry_date = entry_date
        else:
            # Check if entry is consecutive
            date_diff = (entry_date - self.last_entry_date).days
            
            if date_diff == 1:
                # Consecutive day
                self.current_streak += 1
            elif date_diff == 0:
                # Same day, don't change streak
                pass
            else:
                # Streak broken
                if self.current_streak > self.best_streak:
                    self.best_streak = self.current_streak
                self.current_streak = 1
            
            # Update best streak if current is higher
            if self.current_streak > self.best_streak:
                self.best_streak = self.current_streak
                self.best_streak_end = entry_date
                self.best_streak_start = entry_date - timedelta(days=self.current_streak - 1)
            
            self.last_entry_date = entry_date
        
        self.save()


class EntryAnalytics(models.Model):
    """Analytics and statistics for journal entries"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    entry = models.OneToOneField(JournalEntry, on_delete=models.CASCADE, related_name='analytics')
    
    # Word count stats
    word_count = models.PositiveIntegerField(default=0)
    character_count = models.PositiveIntegerField(default=0)
    sentence_count = models.PositiveIntegerField(default=0)
    paragraph_count = models.PositiveIntegerField(default=0)
    
    # Sentiment analysis
    sentiment_score = models.DecimalField(max_digits=4, decimal_places=3, default=0)
    sentiment_label = models.CharField(max_length=20, blank=True)
    
    # Keywords
    keywords = models.JSONField(default=list, blank=True)
    
    # Reading time
    reading_time_minutes = models.PositiveIntegerField(default=1)
    
    # Engagement
    view_count = models.PositiveIntegerField(default=0)
    edit_count = models.PositiveIntegerField(default=0)
    
    # Dates
    first_viewed_at = models.DateTimeField(null=True, blank=True)
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Entry Analytics'
    
    def __str__(self):
        return f"Analytics for {self.entry.title or self.entry.entry_date}"
    
    def update_analytics(self):
        """Calculate and update all analytics"""
        content = self.entry.content or ''
        
        # Basic counts
        self.word_count = len(content.split())
        self.character_count = len(content)
        self.sentence_count = len([s for s in content.split('.') if s.strip()])
        self.paragraph_count = len([p for p in content.split('\n\n') if p.strip()])
        
        # Sentiment
        self.sentiment_score = self.entry.get_sentiment_score()
        if self.sentiment_score > 0.3:
            self.sentiment_label = 'positive'
        elif self.sentiment_score < -0.3:
            self.sentiment_label = 'negative'
        else:
            self.sentiment_label = 'neutral'
        
        # Keywords
        self.keywords = self.entry.get_keywords(top_n=10)
        
        # Reading time (average 200 words per minute)
        self.reading_time_minutes = max(1, self.word_count // 200)
        
        self.save()
    
    def record_view(self):
        """Record a view of the entry"""
        self.view_count += 1
        now = timezone.now()
        if not self.first_viewed_at:
            self.first_viewed_at = now
        self.last_viewed_at = now
        self.save(update_fields=['view_count', 'first_viewed_at', 'last_viewed_at'])
    
    def record_edit(self):
        """Record an edit of the entry"""
        self.edit_count += 1
        self.save(update_fields=['edit_count'])


class JournalReminder(models.Model):
    """Memory Lane: Reminders to review past journal entries"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_reminders')
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='reminders')
    
    # Reminder schedule
    reminder_type = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ])
    
    # When to remind
    next_reminder_date = models.DateField(db_index=True)
    
    # Remind about specific aspects
    highlight_excerpt = models.TextField(blank=True, help_text="Highlighted text from the entry")
    reflection_question = models.TextField(blank=True, help_text="Question to prompt reflection")
    
    # Status
    is_sent = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['next_reminder_date']
        indexes = [
            models.Index(fields=['user', 'next_reminder_date']),
            models.Index(fields=['is_sent']),
        ]
    
    def __str__(self):
        return f"Reminder for {self.entry.entry_date} - {self.next_reminder_date}"


class JournalStats(models.Model):
    """Aggregated statistics for reflection dashboard"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='journal_stats')
    
    # Entry statistics
    total_entries = models.PositiveIntegerField(default=0)
    total_word_count = models.PositiveIntegerField(default=0)
    avg_word_count = models.PositiveIntegerField(default=0)
    
    # Streak statistics
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    
    # Mood statistics
    avg_mood = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    mood_distribution = models.JSONField(default=dict, blank=True)
    
    # Tag statistics
    most_used_tags = models.JSONField(default=list, blank=True)
    
    # Consistency metrics
    entries_this_week = models.PositiveIntegerField(default=0)
    entries_this_month = models.PositiveIntegerField(default=0)
    entries_this_year = models.PositiveIntegerField(default=0)
    
    # Writing patterns
    most_productive_day = models.CharField(max_length=10, blank=True)
    avg_entries_per_week = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Journal Stats'
    
    def __str__(self):
        return f"Journal Stats for {self.user.email}"
    
    def update_stats(self):
        """Calculate and update all statistics"""
        from django.db.models import Avg, Count
        
        entries = JournalEntry.objects.filter(user=self.user)
        
        # Entry stats
        self.total_entries = entries.count()
        self.total_word_count = entries.aggregate(total=Count('word_count'))['total'] or 0
        
        if self.total_entries > 0:
            self.avg_word_count = self.total_word_count // self.total_entries
        else:
            self.avg_word_count = 0
        
        # Streak stats
        streak = JournalStreak.objects.filter(user=self.user).first()
        if streak:
            self.current_streak = streak.current_streak
            self.longest_streak = streak.best_streak
        
        # Mood stats
        moods = JournalMood.objects.filter(user=self.user)
        if moods.exists():
            avg_mood = moods.aggregate(avg=Avg('mood'))['avg']
            self.avg_mood = round(avg_mood, 2) if avg_mood else None
            
            # Mood distribution
            mood_dist = moods.values('mood').annotate(count=Count('id'))
            self.mood_distribution = {
                item['mood']: item['count'] for item in mood_dist
            }
        
        # Tag stats
        tag_counts = JournalTag.objects.filter(
            user=self.user
        ).annotate(
            count=Count('journalentry')
        ).order_by('-count')[:10]
        
        self.most_used_tags = [
            {'name': tag.name, 'count': tag.count, 'color': tag.color}
            for tag in tag_counts if tag.count > 0
        ]
        
        # Time-based stats
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        year_ago = today - timedelta(days=365)
        
        self.entries_this_week = entries.filter(entry_date__gte=week_ago).count()
        self.entries_this_month = entries.filter(entry_date__gte=month_ago).count()
        self.entries_this_year = entries.filter(entry_date__gte=year_ago).count()
        
        # Writing patterns - most productive day
        from django.db.models.functions import ExtractWeekDay
        day_counts = entries.annotate(
            day_of_week=ExtractWeekDay('entry_date')
        ).values('day_of_week').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        if day_counts:
            days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            day_index = day_counts['day_of_week'] - 1  # ExtractWeekDay returns 1-7 (Monday-Sunday)
            self.most_productive_day = days[day_index] if 0 <= day_index < 7 else ''
        
        # Average entries per week
        if self.total_entries > 0:
            first_entry = entries.order_by('entry_date').first()
            if first_entry:
                weeks_active = max(1, (today - first_entry.entry_date).days / 7)
                self.avg_entries_per_week = round(self.total_entries / weeks_active, 2)
        
        self.save()
