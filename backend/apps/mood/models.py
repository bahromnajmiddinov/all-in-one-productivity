import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Avg, Count, StdDev, Q
from datetime import timedelta, date
import json


class MoodScale(models.Model):
    """Custom mood scales - numerical (1-10) or emoji-based"""
    SCALE_TYPES = [
        ('numeric', 'Numeric (1-10)'),
        ('emoji', 'Emoji-based'),
        ('descriptive', 'Descriptive Words'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_scales')
    
    name = models.CharField(max_length=100)
    scale_type = models.CharField(max_length=20, choices=SCALE_TYPES, default='numeric')
    description = models.TextField(blank=True)
    
    # For numeric scales: min and max values
    min_value = models.IntegerField(default=1)
    max_value = models.IntegerField(default=10)
    
    # For emoji/descriptive scales: JSON mapping of values to labels/emojis
    # Format: {"1": {"label": "Terrible", "emoji": "😢"}, "2": {...}}
    scale_labels = models.JSONField(default=dict, blank=True)
    
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', 'name']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_scale_type_display()})"
    
    def save(self, *args, **kwargs):
        # Ensure only one default scale per user
        if self.is_default:
            MoodScale.objects.filter(user=self.user, is_default=True).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)


class MoodEntry(models.Model):
    """Multiple daily check-ins: morning, afternoon, evening mood logging"""
    TIME_OF_DAY = [
        ('morning', 'Morning'),
        ('afternoon', 'Afternoon'),
        ('evening', 'Evening'),
        ('night', 'Night'),
        ('anytime', 'Anytime'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_entries')
    
    # Mood rating using the selected scale
    scale = models.ForeignKey(MoodScale, on_delete=models.SET_NULL, null=True, blank=True, related_name='entries')
    mood_value = models.IntegerField(help_text="The numeric mood rating")
    
    # Time of day for this check-in
    time_of_day = models.CharField(max_length=20, choices=TIME_OF_DAY, default='anytime')
    entry_date = models.DateField(default=timezone.now)
    entry_time = models.TimeField(default=timezone.now)
    
    # Optional notes
    notes = models.TextField(blank=True)
    
    # Weather and location context (optional)
    weather = models.CharField(max_length=50, blank=True, help_text="e.g., 'Sunny', 'Rainy'")
    location = models.CharField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-entry_date', '-entry_time']
        indexes = [
            models.Index(fields=['user', '-entry_date', '-entry_time']),
            models.Index(fields=['user', 'time_of_day']),
            models.Index(fields=['mood_value']),
        ]
    
    def __str__(self):
        return f"Mood {self.mood_value} on {self.entry_date} ({self.get_time_of_day_display()})"
    
    @property
    def mood_label(self):
        """Get the label for this mood value from the scale"""
        if self.scale and self.scale.scale_labels:
            value_str = str(self.mood_value)
            if value_str in self.scale.scale_labels:
                return self.scale.scale_labels[value_str].get('label', '')
        return ''
    
    @property
    def mood_emoji(self):
        """Get the emoji for this mood value from the scale"""
        if self.scale and self.scale.scale_labels:
            value_str = str(self.mood_value)
            if value_str in self.scale.scale_labels:
                return self.scale.scale_labels[value_str].get('emoji', '')
        return ''


class MoodFactor(models.Model):
    """Track contributing factors (sleep, exercise, social interaction, work stress)"""
    FACTOR_CATEGORIES = [
        ('sleep', 'Sleep'),
        ('exercise', 'Exercise'),
        ('social', 'Social Interaction'),
        ('work', 'Work Stress'),
        ('diet', 'Diet/Nutrition'),
        ('weather', 'Weather'),
        ('health', 'Physical Health'),
        ('productivity', 'Productivity'),
        ('relationships', 'Relationships'),
        ('finances', 'Finances'),
        ('hobbies', 'Hobbies/Leisure'),
        ('environment', 'Environment'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mood_entry = models.ForeignKey(MoodEntry, on_delete=models.CASCADE, related_name='factors')
    
    category = models.CharField(max_length=20, choices=FACTOR_CATEGORIES)
    name = models.CharField(max_length=100, blank=True, help_text="Specific factor name (e.g., 'Morning Run')")
    
    # Impact on mood: -5 to +5
    impact = models.SmallIntegerField(help_text="Impact on mood: -5 (very negative) to +5 (very positive)")
    
    # Optional rating for this factor (e.g., sleep quality 1-10)
    rating = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Quality rating 1-10")
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', '-impact']
    
    def __str__(self):
        return f"{self.get_category_display()}: {self.impact:+d}"


class Emotion(models.Model):
    """Detailed emotion selection beyond simple mood ratings - Emotion Wheel"""
    EMOTION_CATEGORIES = [
        ('joy', 'Joy'),
        ('sadness', 'Sadness'),
        ('anger', 'Anger'),
        ('fear', 'Fear'),
        ('disgust', 'Disgust'),
        ('surprise', 'Surprise'),
        ('trust', 'Trust'),
        ('anticipation', 'Anticipation'),
        ('love', 'Love'),
        ('optimism', 'Optimism'),
        ('submission', 'Submission'),
        ('awe', 'Awe'),
        ('disapproval', 'Disapproval'),
        ('remorse', 'Remorse'),
        ('contempt', 'Contempt'),
        ('aggressiveness', 'Aggressiveness'),
    ]
    
    INTENSITY_CHOICES = [
        (1, 'Mild'),
        (2, 'Moderate'),
        (3, 'Strong'),
        (4, 'Intense'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mood_entry = models.ForeignKey(MoodEntry, on_delete=models.CASCADE, related_name='emotions')
    
    # Primary emotion from the wheel
    primary_emotion = models.CharField(max_length=20, choices=EMOTION_CATEGORIES)
    
    # Secondary/Specific emotion (e.g., "Ecstatic" under Joy)
    specific_emotion = models.CharField(max_length=50, blank=True)
    
    # Intensity of this emotion
    intensity = models.PositiveSmallIntegerField(choices=INTENSITY_CHOICES, default=2)
    
    # Is this the dominant emotion for this entry?
    is_dominant = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_dominant', '-intensity']
    
    def __str__(self):
        return f"{self.get_primary_emotion_display()} ({self.get_intensity_display()})"


class MoodTrigger(models.Model):
    """Track specific triggers that caused mood changes"""
    TRIGGER_TYPES = [
        ('event', 'Specific Event'),
        ('person', 'Interaction with Person'),
        ('thought', 'Thought/Memory'),
        ('physical', 'Physical Sensation'),
        ('external', 'External Circumstance'),
        ('internal', 'Internal State'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mood_entry = models.ForeignKey(MoodEntry, on_delete=models.CASCADE, related_name='triggers')
    
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPES)
    description = models.TextField(help_text="Description of what triggered this mood")
    
    # Impact direction
    is_positive = models.BooleanField(default=True, help_text="True if positive trigger, False if negative")
    
    # Related habit, task, or calendar event (optional)
    related_habit = models.ForeignKey('habits.Habit', on_delete=models.SET_NULL, null=True, blank=True)
    related_task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_trigger_type_display()}: {self.description[:50]}..."


class MoodCorrelation(models.Model):
    """Store computed correlations between mood and other activities"""
    CORRELATION_TYPES = [
        ('sleep', 'Sleep Quality'),
        ('exercise', 'Exercise'),
        ('habits', 'Habit Completion'),
        ('productivity', 'Productivity'),
        ('social', 'Social Activity'),
        ('work', 'Work Activity'),
        ('weather', 'Weather'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_correlations')
    
    correlation_type = models.CharField(max_length=20, choices=CORRELATION_TYPES)
    
    # Correlation coefficient (-1 to 1)
    coefficient = models.DecimalField(max_digits=4, decimal_places=3)
    
    # Strength interpretation
    strength = models.CharField(max_length=20, choices=[
        ('very_strong_positive', 'Very Strong Positive'),
        ('strong_positive', 'Strong Positive'),
        ('moderate_positive', 'Moderate Positive'),
        ('weak_positive', 'Weak Positive'),
        ('none', 'No Correlation'),
        ('weak_negative', 'Weak Negative'),
        ('moderate_negative', 'Moderate Negative'),
        ('strong_negative', 'Strong Negative'),
        ('very_strong_negative', 'Very Strong Negative'),
    ], default='none')
    
    # Time period for this correlation
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Sample size
    data_points = models.PositiveIntegerField(default=0)
    
    # Additional insights
    insights = models.JSONField(default=dict, blank=True)
    
    computed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-computed_at']
        unique_together = ['user', 'correlation_type', 'start_date', 'end_date']
    
    def __str__(self):
        return f"{self.get_correlation_type_display()}: {self.coefficient} ({self.strength})"
    
    def calculate_strength(self):
        """Calculate strength from coefficient"""
        coef = float(self.coefficient)
        if coef >= 0.8:
            return 'very_strong_positive'
        elif coef >= 0.6:
            return 'strong_positive'
        elif coef >= 0.4:
            return 'moderate_positive'
        elif coef >= 0.2:
            return 'weak_positive'
        elif coef > -0.2:
            return 'none'
        elif coef > -0.4:
            return 'weak_negative'
        elif coef > -0.6:
            return 'moderate_negative'
        elif coef > -0.8:
            return 'strong_negative'
        else:
            return 'very_strong_negative'


class MoodInsight(models.Model):
    """AI-generated insights and suggestions for mood improvement"""
    INSIGHT_TYPES = [
        ('pattern', 'Pattern Detection'),
        ('suggestion', 'Improvement Suggestion'),
        ('warning', 'Mood Warning'),
        ('achievement', 'Positive Achievement'),
        ('correlation', 'Correlation Discovery'),
        ('prediction', 'Mood Prediction'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_insights')
    
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Related data
    related_entry = models.ForeignKey(MoodEntry, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Confidence score (0-1)
    confidence = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)
    
    # Action items based on this insight
    action_items = models.JSONField(default=list, blank=True)
    
    # Whether user has dismissed this insight
    is_dismissed = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"


class MoodStats(models.Model):
    """Aggregated statistics for mood tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mood_stats')
    
    # Overall statistics
    total_entries = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    
    # Average mood (rolling)
    avg_mood_7d = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    avg_mood_30d = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    avg_mood_90d = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    
    # Mood distribution
    mood_distribution = models.JSONField(default=dict, blank=True)
    
    # Time-of-day patterns
    time_of_day_averages = models.JSONField(default=dict, blank=True)
    
    # Day of week patterns
    day_of_week_averages = models.JSONField(default=dict, blank=True)
    
    # Best and worst days
    best_mood_date = models.DateField(null=True, blank=True)
    worst_mood_date = models.DateField(null=True, blank=True)
    
    # Most common emotions
    top_emotions = models.JSONField(default=list, blank=True)
    
    # Most impactful factors (positive and negative)
    top_positive_factors = models.JSONField(default=list, blank=True)
    top_negative_factors = models.JSONField(default=list, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Mood Stats'
    
    def __str__(self):
        return f"Mood Stats for {self.user.email}"
    
    def update_stats(self):
        """Calculate and update all statistics"""
        from django.db.models import Avg, Count
        
        entries = MoodEntry.objects.filter(user=self.user)
        self.total_entries = entries.count()
        
        today = timezone.now().date()
        
        # Calculate averages for different periods
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        quarter_ago = today - timedelta(days=90)
        
        week_entries = entries.filter(entry_date__gte=week_ago)
        month_entries = entries.filter(entry_date__gte=month_ago)
        quarter_entries = entries.filter(entry_date__gte=quarter_ago)
        
        if week_entries.exists():
            self.avg_mood_7d = week_entries.aggregate(avg=Avg('mood_value'))['avg']
        if month_entries.exists():
            self.avg_mood_30d = month_entries.aggregate(avg=Avg('mood_value'))['avg']
        if quarter_entries.exists():
            self.avg_mood_90d = quarter_entries.aggregate(avg=Avg('mood_value'))['avg']
        
        # Mood distribution
        distribution = entries.values('mood_value').annotate(count=Count('id'))
        self.mood_distribution = {str(item['mood_value']): item['count'] for item in distribution}
        
        # Time of day averages
        tod_avg = entries.values('time_of_day').annotate(avg=Avg('mood_value'))
        self.time_of_day_averages = {item['time_of_day']: float(item['avg']) for item in tod_avg}
        
        # Day of week averages
        from django.db.models.functions import ExtractWeekDay
        dow_avg = entries.annotate(
            dow=ExtractWeekDay('entry_date')
        ).values('dow').annotate(avg=Avg('mood_value'))
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        self.day_of_week_averages = {
            days[item['dow'] - 1]: float(item['avg']) for item in dow_avg if 1 <= item['dow'] <= 7
        }
        
        # Best and worst days
        best_entry = entries.order_by('-mood_value', 'entry_date').first()
        worst_entry = entries.order_by('mood_value', 'entry_date').first()
        if best_entry:
            self.best_mood_date = best_entry.entry_date
        if worst_entry:
            self.worst_mood_date = worst_entry.entry_date
        
        # Top emotions
        top_emos = Emotion.objects.filter(
            mood_entry__user=self.user
        ).values('primary_emotion').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        self.top_emotions = [
            {'emotion': item['primary_emotion'], 'count': item['count']}
            for item in top_emos
        ]
        
        # Top factors
        positive_factors = MoodFactor.objects.filter(
            mood_entry__user=self.user,
            impact__gt=0
        ).values('category').annotate(
            total_impact=models.Sum('impact')
        ).order_by('-total_impact')[:5]
        self.top_positive_factors = [
            {'category': item['category'], 'impact': item['total_impact']}
            for item in positive_factors
        ]
        
        negative_factors = MoodFactor.objects.filter(
            mood_entry__user=self.user,
            impact__lt=0
        ).values('category').annotate(
            total_impact=models.Sum('impact')
        ).order_by('total_impact')[:5]
        self.top_negative_factors = [
            {'category': item['category'], 'impact': item['total_impact']}
            for item in negative_factors
        ]
        
        self.save()


class MoodJournalLink(models.Model):
    """Link detailed journal entries to mood data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mood_entry = models.OneToOneField(MoodEntry, on_delete=models.CASCADE, related_name='journal_link')
    journal_entry = models.ForeignKey('journal.JournalEntry', on_delete=models.CASCADE, related_name='mood_link')
    
    # Auto-populated from journal or manually set
    key_themes = models.JSONField(default=list, blank=True)
    sentiment_score = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['mood_entry', 'journal_entry']
    
    def __str__(self):
        return f"Link: Mood {self.mood_entry.id} <-> Journal {self.journal_entry.id}"
