import uuid
from datetime import timedelta, date

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Avg, Sum, Count, StdDev, F, ExpressionWrapper, DurationField

User = get_user_model()


class WaterIntakeSettings(models.Model):
    UNIT_CHOICES = [
        ('ml', 'Milliliters'),
        ('oz', 'Ounces'),
    ]

    ACTIVITY_LEVELS = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='water_settings')
    daily_goal_ml = models.PositiveIntegerField(default=2500)
    goal_unit = models.CharField(max_length=2, choices=UNIT_CHOICES, default='ml')
    reminder_enabled = models.BooleanField(default=False)
    reminder_interval = models.PositiveIntegerField(default=60)
    smart_reminders_enabled = models.BooleanField(default=True)
    weather_adjustment_enabled = models.BooleanField(default=False)
    activity_level = models.CharField(max_length=10, choices=ACTIVITY_LEVELS, default='moderate')
    temperature_c = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} water settings"


class WaterContainer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_containers')
    name = models.CharField(max_length=100)
    volume_ml = models.PositiveIntegerField()
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_favorite', 'name']
        unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.name} ({self.volume_ml}ml)"


class WaterLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_logs')
    container = models.ForeignKey(
        WaterContainer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs',
    )
    amount_ml = models.PositiveIntegerField()
    logged_at = models.DateTimeField(auto_now_add=True)
    date = models.DateField()

    class Meta:
        ordering = ['-logged_at']


class SleepLog(models.Model):
    SLEEP_QUALITY_CHOICES = [(i, str(i)) for i in range(1, 11)]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_logs')

    bed_time = models.DateTimeField()
    wake_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()
    quality = models.IntegerField(choices=SLEEP_QUALITY_CHOICES)

    disruptions_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    # Sleep phase data (optional, from wearable or manual estimation)
    deep_sleep_minutes = models.PositiveIntegerField(null=True, blank=True)
    light_sleep_minutes = models.PositiveIntegerField(null=True, blank=True)
    rem_sleep_minutes = models.PositiveIntegerField(null=True, blank=True)
    awake_minutes = models.PositiveIntegerField(null=True, blank=True)

    # Calculated fields
    sleep_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    efficiency_percent = models.PositiveSmallIntegerField(null=True, blank=True)

    # Mood upon waking and bedtime (1-10)
    mood_before_sleep = models.PositiveSmallIntegerField(null=True, blank=True)
    mood_after_wake = models.PositiveSmallIntegerField(null=True, blank=True)

    # Environment factors
    room_temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    noise_level = models.CharField(max_length=20, blank=True, choices=[
        ('quiet', 'Quiet'),
        ('moderate', 'Moderate'),
        ('loud', 'Loud'),
    ])

    # Lifestyle factors
    caffeine_hours_before = models.PositiveSmallIntegerField(null=True, blank=True)
    alcohol_before_sleep = models.BooleanField(default=False)
    exercised_before_sleep = models.BooleanField(default=False)
    screen_time_minutes_before = models.PositiveSmallIntegerField(null=True, blank=True)

    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-wake_time']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['user', 'date']),
            models.Index(fields=['quality']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.date} ({self.duration_minutes}min)"

    def save(self, *args, **kwargs):
        # Calculate duration if not provided
        if not self.duration_minutes and self.bed_time and self.wake_time:
            self.duration_minutes = int((self.wake_time - self.bed_time).total_seconds() / 60)

        # Calculate sleep efficiency
        if self.duration_minutes and self.awake_minutes is not None:
            total_time_in_bed = self.duration_minutes + self.awake_minutes
            if total_time_in_bed > 0:
                self.efficiency_percent = int((self.duration_minutes / total_time_in_bed) * 100)

        # Calculate sleep score (0-100)
        self.calculate_sleep_score()

        # Set date from wake_time if not set
        if not self.date and self.wake_time:
            self.date = self.wake_time.date()

        super().save(*args, **kwargs)

    def calculate_sleep_score(self):
        """Calculate comprehensive sleep health score (0-100)"""
        score = 0
        max_score = 100

        # Duration scoring (30 points) - optimal 7-9 hours
        duration_hours = self.duration_minutes / 60
        if 7 <= duration_hours <= 9:
            score += 30
        elif 6 <= duration_hours < 7 or 9 < duration_hours <= 10:
            score += 20
        elif 5 <= duration_hours < 6 or 10 < duration_hours <= 11:
            score += 10

        # Quality scoring (30 points)
        score += (self.quality / 10) * 30

        # Disruptions penalty (20 points)
        if self.disruptions_count == 0:
            score += 20
        elif self.disruptions_count == 1:
            score += 15
        elif self.disruptions_count == 2:
            score += 10
        elif self.disruptions_count == 3:
            score += 5

        # Sleep phases scoring (20 points) - if available
        if self.deep_sleep_minutes and self.light_sleep_minutes and self.rem_sleep_minutes:
            total_phases = self.deep_sleep_minutes + self.light_sleep_minutes + self.rem_sleep_minutes
            if total_phases > 0:
                # Ideal: 15-20% deep, 50-60% light, 20-25% REM
                deep_percent = (self.deep_sleep_minutes / total_phases) * 100
                rem_percent = (self.rem_sleep_minutes / total_phases) * 100
                light_percent = (self.light_sleep_minutes / total_phases) * 100

                phase_score = 0
                if 15 <= deep_percent <= 20:
                    phase_score += 7
                elif 10 <= deep_percent < 15 or 20 < deep_percent <= 25:
                    phase_score += 5
                elif 5 <= deep_percent < 10 or 25 < deep_percent <= 30:
                    phase_score += 3

                if 20 <= rem_percent <= 25:
                    phase_score += 7
                elif 15 <= rem_percent < 20 or 25 < rem_percent <= 30:
                    phase_score += 5
                elif 10 <= rem_percent < 15 or 30 < rem_percent <= 35:
                    phase_score += 3

                if 50 <= light_percent <= 60:
                    phase_score += 6
                elif 45 <= light_percent < 50 or 60 < light_percent <= 65:
                    phase_score += 4

                score += phase_score

        self.sleep_score = round(min(score, max_score), 2)


class SleepDisruption(models.Model):
    """Record individual sleep disruptions and their causes"""
    DISRUPTION_TYPES = [
        ('bathroom', 'Bathroom'),
        ('noise', 'Noise'),
        ('temperature', 'Temperature'),
        ('stress', 'Stress/Anxiety'),
        ('pain', 'Pain/Discomfort'),
        ('dreams', 'Bad Dreams'),
        ('phone', 'Phone/Notifications'),
        ('partner', 'Partner Movement'),
        ('pets', 'Pets'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sleep_log = models.ForeignKey(SleepLog, on_delete=models.CASCADE, related_name='disruptions')

    disruption_type = models.CharField(max_length=20, choices=DISRUPTION_TYPES)
    other_reason = models.CharField(max_length=200, blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=0)
    time = models.TimeField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['time']

    def __str__(self):
        return f"{self.get_disruption_type_display()} at {self.time or 'unknown'}"


class SleepNap(models.Model):
    """Track daytime naps separately from main sleep"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_naps')

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField()

    quality = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10 rating")
    feeling_after = models.CharField(max_length=20, blank=True, choices=[
        ('refreshed', 'Refreshed'),
        ('groggy', 'Groggy'),
        ('same', 'No Change'),
        ('tired', 'More Tired'),
    ])

    notes = models.TextField(blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-start_time']

    def save(self, *args, **kwargs):
        if not self.duration_minutes and self.start_time and self.end_time:
            self.duration_minutes = int((self.end_time - self.start_time).total_seconds() / 60)
        if not self.date and self.start_time:
            self.date = self.start_time.date()
        super().save(*args, **kwargs)


class SleepGoal(models.Model):
    """User's sleep goals and targets"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='sleep_goals')

    # Duration goals
    target_duration_minutes = models.PositiveIntegerField(default=480)  # 8 hours
    min_duration_minutes = models.PositiveIntegerField(default=420)  # 7 hours
    max_duration_minutes = models.PositiveIntegerField(default=540)  # 9 hours

    # Quality goal
    target_quality = models.PositiveSmallIntegerField(default=8)  # 1-10

    # Schedule goals
    target_bed_time = models.TimeField(null=True, blank=True)
    target_wake_time = models.TimeField(null=True, blank=True)
    bed_time_window_minutes = models.PositiveSmallIntegerField(default=30)
    wake_time_window_minutes = models.PositiveSmallIntegerField(default=30)

    # Consistency goal
    consistency_target_days = models.PositiveSmallIntegerField(default=5)  # days per week

    # Weekly goals
    weekly_naps_max = models.PositiveSmallIntegerField(default=3)
    max_nap_duration = models.PositiveSmallIntegerField(default=30)  # minutes

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Sleep Goals'

    def __str__(self):
        return f"Sleep goals for {self.user.email}"


class SleepStats(models.Model):
    """Aggregated sleep statistics and trends"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='sleep_stats')

    # Overall stats
    total_logs = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)

    # Duration averages
    avg_duration_7d = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    avg_duration_30d = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    avg_duration_90d = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Quality averages
    avg_quality_7d = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    avg_quality_30d = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    avg_quality_90d = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    # Sleep score averages
    avg_score_7d = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    avg_score_30d = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Best and worst sleep
    best_sleep_date = models.DateField(null=True, blank=True)
    best_sleep_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    worst_sleep_date = models.DateField(null=True, blank=True)
    worst_sleep_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Schedule consistency
    avg_bed_time = models.TimeField(null=True, blank=True)
    avg_wake_time = models.TimeField(null=True, blank=True)
    bed_time_stddev = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    wake_time_stddev = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Sleep debt (cumulative deficit in minutes)
    sleep_debt_minutes = models.IntegerField(default=0)

    # Phase averages (if available)
    avg_deep_sleep_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    avg_rem_sleep_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Optimal sleep window (best performing time range)
    optimal_bed_time_start = models.TimeField(null=True, blank=True)
    optimal_bed_time_end = models.TimeField(null=True, blank=True)

    # Nap stats
    total_naps = models.PositiveIntegerField(default=0)
    avg_nap_duration = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Day of week patterns (JSON: {"Monday": {"avg_duration": 480, "avg_quality": 7.5}, ...})
    day_of_week_patterns = models.JSONField(default=dict, blank=True)

    # Sleep efficiency trends
    avg_efficiency_7d = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    avg_efficiency_30d = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Sleep Stats'

    def __str__(self):
        return f"Sleep stats for {self.user.email}"

    def update_stats(self):
        """Recalculate all statistics"""
        logs = SleepLog.objects.filter(user=self.user)
        self.total_logs = logs.count()

        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        quarter_ago = today - timedelta(days=90)

        # Calculate averages
        week_logs = logs.filter(date__gte=week_ago)
        month_logs = logs.filter(date__gte=month_ago)
        quarter_logs = logs.filter(date__gte=quarter_ago)

        if week_logs.exists():
            self.avg_duration_7d = week_logs.aggregate(avg=Avg('duration_minutes'))['avg']
            self.avg_quality_7d = week_logs.aggregate(avg=Avg('quality'))['avg']
            self.avg_score_7d = week_logs.aggregate(avg=Avg('sleep_score'))['avg']
            self.avg_efficiency_7d = week_logs.aggregate(avg=Avg('efficiency_percent'))['avg']

        if month_logs.exists():
            self.avg_duration_30d = month_logs.aggregate(avg=Avg('duration_minutes'))['avg']
            self.avg_quality_30d = month_logs.aggregate(avg=Avg('quality'))['avg']
            self.avg_score_30d = month_logs.aggregate(avg=Avg('sleep_score'))['avg']
            self.avg_efficiency_30d = month_logs.aggregate(avg=Avg('efficiency_percent'))['avg']

        if quarter_logs.exists():
            self.avg_duration_90d = quarter_logs.aggregate(avg=Avg('duration_minutes'))['avg']
            self.avg_quality_90d = quarter_logs.aggregate(avg=Avg('quality'))['avg']

        # Best and worst sleep
        best = logs.order_by('-sleep_score').first()
        worst = logs.order_by('sleep_score').first()
        if best:
            self.best_sleep_date = best.date
            self.best_sleep_score = best.sleep_score
        if worst:
            self.worst_sleep_date = worst.date
            self.worst_sleep_score = worst.sleep_score

        # Calculate sleep debt
        goals, _ = SleepGoal.objects.get_or_create(user=self.user)
        recent_logs = logs.filter(date__gte=month_ago)
        debt = 0
        for log in recent_logs:
            deficit = goals.target_duration_minutes - log.duration_minutes
            if deficit > 0:
                debt += deficit
        self.sleep_debt_minutes = debt

        # Update nap stats
        naps = SleepNap.objects.filter(user=self.user)
        self.total_naps = naps.count()
        if naps.exists():
            self.avg_nap_duration = naps.aggregate(avg=Avg('duration_minutes'))['avg']

        # Calculate streak
        streak = 0
        check_date = today
        while logs.filter(date=check_date).exists():
            streak += 1
            check_date -= timedelta(days=1)
        self.current_streak = streak
        self.best_streak = max(self.best_streak, streak)

        # Day of week patterns
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        patterns = {}
        for day_idx, day_name in enumerate(days, start=1):
            day_logs = logs.filter(date__week_day=day_idx)
            if day_logs.exists():
                patterns[day_name] = {
                    'avg_duration': float(day_logs.aggregate(avg=Avg('duration_minutes'))['avg'] or 0),
                    'avg_quality': float(day_logs.aggregate(avg=Avg('quality'))['avg'] or 0),
                    'avg_score': float(day_logs.aggregate(avg=Avg('sleep_score'))['avg'] or 0),
                }
        self.day_of_week_patterns = patterns

        self.save()


class SleepDebt(models.Model):
    """Track cumulative sleep deficit over time"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_debt_records')

    date = models.DateField()
    debt_minutes = models.IntegerField(help_text="Negative means surplus, positive means deficit")

    target_minutes = models.PositiveIntegerField()
    actual_minutes = models.PositiveIntegerField()

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        status = "deficit" if self.debt_minutes > 0 else "surplus" if self.debt_minutes < 0 else "met"
        return f"{self.date}: {abs(self.debt_minutes)}min {status}"


class SleepCorrelation(models.Model):
    """Store computed correlations between sleep and other metrics"""
    CORRELATION_TYPES = [
        ('mood', 'Mood'),
        ('productivity', 'Productivity'),
        ('exercise', 'Exercise Performance'),
        ('energy', 'Energy Level'),
        ('focus', 'Focus/Concentration'),
        ('stress', 'Stress Level'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_correlations')

    correlation_type = models.CharField(max_length=20, choices=CORRELATION_TYPES)

    # Correlation coefficient (-1 to 1)
    duration_correlation = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    quality_correlation = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    score_correlation = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)

    # Time period
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
        return f"{self.get_correlation_type_display()} correlation for {self.user.email}"


class SleepInsight(models.Model):
    """AI-generated insights and recommendations for sleep improvement"""
    INSIGHT_TYPES = [
        ('pattern', 'Pattern Detection'),
        ('recommendation', 'Improvement Recommendation'),
        ('warning', 'Sleep Warning'),
        ('achievement', 'Positive Achievement'),
        ('correlation', 'Correlation Discovery'),
        ('schedule', 'Schedule Optimization'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_insights')

    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()

    # Related data
    related_sleep_log = models.ForeignKey(SleepLog, on_delete=models.SET_NULL, null=True, blank=True)

    # Priority and confidence
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ], default='medium')
    confidence = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)

    # Action items
    action_items = models.JSONField(default=list, blank=True)

    # Status
    is_dismissed = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"


class ExerciseType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercise_types')

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, blank=True)

    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ['user', 'name']


class ExerciseLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercise_logs')
    exercise_type = models.ForeignKey(ExerciseType, on_delete=models.SET_NULL, null=True)

    date = models.DateField()
    duration_minutes = models.PositiveIntegerField()
    calories_burned = models.PositiveIntegerField(null=True, blank=True)

    sets = models.PositiveIntegerField(null=True, blank=True)
    reps = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']


class BodyMetrics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_metrics')

    date = models.DateField()
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    body_fat_percentage = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    chest_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    waist_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    hips_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
