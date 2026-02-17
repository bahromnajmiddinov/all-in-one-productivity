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


class MuscleGroup(models.Model):
    MUSCLE_GROUPS = [
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('shoulders', 'Shoulders'),
        ('biceps', 'Biceps'),
        ('triceps', 'Triceps'),
        ('forearms', 'Forearms'),
        ('abs', 'Abs/Core'),
        ('quads', 'Quadriceps'),
        ('hamstrings', 'Hamstrings'),
        ('calves', 'Calves'),
        ('glutes', 'Glutes'),
        ('traps', 'Trapezius'),
        ('lats', 'Lats'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, choices=MUSCLE_GROUPS)
    display_name = models.CharField(max_length=50)

    def __str__(self):
        return self.display_name


class Equipment(models.Model):
    EQUIPMENT_TYPES = [
        ('none', 'None (Bodyweight)'),
        ('dumbbells', 'Dumbbells'),
        ('barbell', 'Barbell'),
        ('kettlebell', 'Kettlebell'),
        ('cables', 'Cables/Machines'),
        ('resistance_bands', 'Resistance Bands'),
        ('pull_up_bar', 'Pull-up Bar'),
        ('bench', 'Bench'),
        ('medicine_ball', 'Medicine Ball'),
        ('stability_ball', 'Stability Ball'),
        ('foam_roller', 'Foam Roller'),
        ('treadmill', 'Treadmill'),
        ('bike', 'Exercise Bike'),
        ('rowing_machine', 'Rowing Machine'),
        ('elliptical', 'Elliptical'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, choices=EQUIPMENT_TYPES)
    display_name = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.display_name


class Exercise(models.Model):
    EXERCISE_CATEGORIES = [
        ('strength', 'Strength Training'),
        ('cardio', 'Cardio'),
        ('flexibility', 'Flexibility/Mobility'),
        ('hiit', 'HIIT'),
        ('plyometric', 'Plyometric'),
        ('balance', 'Balance/Stability'),
        ('functional', 'Functional Training'),
        ('rehabilitation', 'Rehabilitation'),
    ]

    DIFFICULTY_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True, help_text="Step-by-step instructions")

    category = models.CharField(max_length=50, choices=EXERCISE_CATEGORIES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS, default='intermediate')

    muscle_groups = models.ManyToManyField(MuscleGroup, related_name='exercises')
    equipment = models.ManyToManyField(Equipment, related_name='exercises', blank=True)

    is_compound = models.BooleanField(default=False, help_text="Multi-joint exercise")
    is_isolation = models.BooleanField(default=False, help_text="Single-joint exercise")

    # Optional fields for tracking
    default_sets = models.PositiveSmallIntegerField(null=True, blank=True)
    default_reps = models.PositiveSmallIntegerField(null=True, blank=True)
    default_duration_seconds = models.PositiveSmallIntegerField(null=True, blank=True)
    default_rest_seconds = models.PositiveSmallIntegerField(null=True, blank=True)

    # Media
    image_url = models.URLField(blank=True)
    video_url = models.URLField(blank=True)

    # System vs Custom
    is_system = models.BooleanField(default=False, help_text="Pre-built system exercise")
    is_favorite = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']
        unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class Workout(models.Model):
    WORKOUT_TYPES = [
        ('strength', 'Strength Training'),
        ('cardio', 'Cardio'),
        ('hiit', 'HIIT'),
        ('flexibility', 'Flexibility'),
        ('mixed', 'Mixed'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    workout_type = models.CharField(max_length=50, choices=WORKOUT_TYPES, default='custom')

    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    difficulty_level = models.CharField(max_length=20, choices=Exercise.DIFFICULTY_LEVELS, default='intermediate')

    is_template = models.BooleanField(default=False, help_text="If True, this is a reusable template")
    is_favorite = models.BooleanField(default=False)

    # Tags
    tags = models.JSONField(default=list, blank=True, help_text="List of tags for filtering")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Workout'

    def __str__(self):
        return self.name


class WorkoutExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='workout_exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='workout_exercises')

    order = models.PositiveSmallIntegerField(default=0, help_text="Order within the workout")

    # Exercise parameters
    sets = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Number of sets")
    reps = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Reps per set")
    rep_range = models.CharField(max_length=20, blank=True, help_text="e.g., '8-12'")
    duration_seconds = models.PositiveIntegerField(null=True, blank=True, help_text="For cardio/timed exercises")
    distance_m = models.PositiveIntegerField(null=True, blank=True, help_text="For cardio exercises")
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    rest_seconds = models.PositiveSmallIntegerField(default=60, help_text="Rest time after this exercise")

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ['workout', 'exercise']

    def __str__(self):
        return f"{self.workout.name} - {self.exercise.name}"


class ExerciseSet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercise_sets')

    # Link to completed workout session
    workout_log = models.ForeignKey('WorkoutLog', on_delete=models.CASCADE, related_name='exercise_sets', null=True, blank=True)

    # Reference to exercise
    exercise = models.ForeignKey(Exercise, on_delete=models.SET_NULL, null=True, blank=True)
    exercise_type = models.ForeignKey(ExerciseType, on_delete=models.SET_NULL, null=True, blank=True)

    set_number = models.PositiveSmallIntegerField()

    # Performance data
    reps = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    distance_m = models.PositiveIntegerField(null=True, blank=True)

    # Additional metrics
    rpe = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Rate of Perceived Exertion (1-10)")
    heart_rate_bpm = models.PositiveSmallIntegerField(null=True, blank=True)
    calories_burned = models.PositiveIntegerField(null=True, blank=True)

    is_warmup = models.BooleanField(default=False)
    is_dropset = models.BooleanField(default=False)
    is_failure_set = models.BooleanField(default=False)

    notes = models.TextField(blank=True)

    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def calculate_volume(self):
        """Calculate volume for strength training (sets × reps × weight)"""
        if self.reps and self.weight_kg:
            return float(self.reps * self.weight_kg)
        return 0


class WorkoutLog(models.Model):
    INTENSITY_RATINGS = [(i, str(i)) for i in range(1, 11)]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_logs')

    # Link to workout template if used
    workout = models.ForeignKey(Workout, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')

    name = models.CharField(max_length=200)
    workout_type = models.CharField(max_length=50, choices=Workout.WORKOUT_TYPES)

    date = models.DateField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    # Metrics
    intensity = models.PositiveSmallIntegerField(choices=INTENSITY_RATINGS, null=True, blank=True)
    calories_burned = models.PositiveIntegerField(null=True, blank=True)
    heart_rate_avg_bpm = models.PositiveSmallIntegerField(null=True, blank=True)
    heart_rate_max_bpm = models.PositiveSmallIntegerField(null=True, blank=True)

    # Totals
    total_sets = models.PositiveIntegerField(default=0)
    total_volume_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total weight lifted")
    total_exercises = models.PositiveSmallIntegerField(default=0)

    notes = models.TextField(blank=True)
    mood_before = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10 before workout")
    mood_after = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10 after workout")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-start_time']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['date']),
        ]

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time and not self.duration_minutes:
            self.duration_minutes = int((self.end_time - self.start_time).total_seconds() / 60)
        super().save(*args, **kwargs)


class WorkoutPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_plans')

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Duration
    weeks = models.PositiveSmallIntegerField(help_text="Number of weeks in the plan")
    workouts_per_week = models.PositiveSmallIntegerField(default=3)

    # Schedule
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Workout Plan'

    def __str__(self):
        return f"{self.name} ({self.weeks} weeks)"


class WorkoutPlanWeek(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name='weeks')
    week_number = models.PositiveSmallIntegerField()

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['week_number']
        unique_together = ['plan', 'week_number']

    def __str__(self):
        return f"{self.plan.name} - Week {self.week_number}"


class WorkoutPlanDay(models.Model):
    DAY_NAMES = [
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
        (7, 'Sunday'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.ForeignKey(WorkoutPlanWeek, on_delete=models.CASCADE, related_name='days')
    day_of_week = models.PositiveSmallIntegerField(choices=DAY_NAMES)

    # Link to workout template for this day
    workout = models.ForeignKey(Workout, on_delete=models.SET_NULL, null=True, blank=True, related_name='plan_days')

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['day_of_week']
        unique_together = ['week', 'day_of_week']

    def __str__(self):
        return f"Week {self.week.week_number} - {self.get_day_of_week_display()}"


class PersonalRecord(models.Model):
    RECORD_TYPES = [
        ('weight', 'Heaviest Weight'),
        ('reps', 'Most Reps'),
        ('time', 'Fastest Time'),
        ('distance', 'Longest Distance'),
        ('volume', 'Highest Volume'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_records')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='personal_records')

    record_type = models.CharField(max_length=20, choices=RECORD_TYPES)

    # Record value
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    reps = models.PositiveIntegerField(null=True, blank=True)
    time_seconds = models.PositiveIntegerField(null=True, blank=True)
    distance_m = models.PositiveIntegerField(null=True, blank=True)
    volume_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # When achieved
    date = models.DateField()
    exercise_set = models.ForeignKey(ExerciseSet, on_delete=models.SET_NULL, null=True, blank=True)

    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, help_text="False if beaten by a newer record")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'exercise', 'record_type']

    def __str__(self):
        return f"{self.exercise.name} - {self.get_record_type_display()} - {self.date}"


class FitnessGoal(models.Model):
    GOAL_TYPES = [
        ('weight_loss', 'Weight Loss'),
        ('weight_gain', 'Weight Gain'),
        ('strength', 'Strength'),
        ('endurance', 'Endurance'),
        ('muscle_mass', 'Muscle Mass'),
        ('body_fat', 'Body Fat Percentage'),
        ('distance', 'Running/Cycling Distance'),
        ('frequency', 'Workout Frequency'),
        ('custom', 'Custom Goal'),
    ]

    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fitness_goals')

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    goal_type = models.CharField(max_length=50, choices=GOAL_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')

    # Target values
    target_weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    target_body_fat_percentage = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    target_distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    target_strength_value = models.CharField(max_length=100, blank=True, help_text="e.g., 'Bench Press 100kg'")

    # Progress tracking
    start_date = models.DateField()
    target_date = models.DateField()
    current_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=20, blank=True, help_text="Unit of measurement")

    # Milestones
    milestones = models.JSONField(default=list, blank=True, help_text="List of milestone values")

    is_active = models.BooleanField(default=True)
    is_achieved = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Fitness Goal'

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


class RestDay(models.Model):
    REASONS = [
        ('scheduled', 'Scheduled Rest'),
        ('recovery', 'Recovery Needed'),
        ('injury', 'Injury'),
        ('illness', 'Illness'),
        ('busy', 'Too Busy'),
        ('travel', 'Traveling'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rest_days')

    date = models.DateField()
    reason = models.CharField(max_length=20, choices=REASONS)
    other_reason = models.CharField(max_length=200, blank=True)

    # How are you feeling?
    energy_level = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10 energy level")
    muscle_soreness = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-10 soreness level")
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.date} - {self.get_reason_display()}"


class ExerciseStats(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='exercise_stats')

    # Workout counts
    total_workouts = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)

    # Duration stats
    total_duration_minutes = models.PositiveIntegerField(default=0)
    avg_duration_30d = models.PositiveIntegerField(null=True, blank=True)
    avg_duration_90d = models.PositiveIntegerField(null=True, blank=True)

    # Volume stats
    total_volume_kg = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_volume_30d = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Calories
    total_calories_burned = models.PositiveIntegerField(default=0)

    # Last workout
    last_workout_date = models.DateField(null=True, blank=True)

    # Exercise breakdown
    exercise_counts = models.JSONField(default=dict, blank=True)
    muscle_group_balance = models.JSONField(default=dict, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Exercise Stats'

    def __str__(self):
        return f"Exercise stats for {self.user.email}"

    def update_stats(self):
        from django.db.models import Sum, Count, Avg

        logs = WorkoutLog.objects.filter(user=self.user)
        self.total_workouts = logs.count()

        last_30_days = timezone.now().date() - timedelta(days=30)
        recent_logs = logs.filter(date__gte=last_30_days)

        if recent_logs.exists():
            self.avg_duration_30d = recent_logs.aggregate(avg=Avg('duration_minutes'))['avg']

        self.total_calories_burned = logs.aggregate(total=Sum('calories_burned'))['total'] or 0

        last_log = logs.order_by('-date').first()
        if last_log:
            self.last_workout_date = last_log.date

        # Calculate streak
        streak = 0
        check_date = timezone.now().date()
        while logs.filter(date=check_date).exists():
            streak += 1
            check_date -= timedelta(days=1)
        self.current_streak = streak
        self.best_streak = max(self.best_streak, streak)

        self.save()


class ProgressiveOverload(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progressive_overloads')

    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='progressive_overloads')

    # Baseline
    baseline_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    baseline_reps = models.PositiveIntegerField(null=True, blank=True)
    baseline_date = models.DateField()

    # Current
    current_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    current_reps = models.PositiveIntegerField(null=True, blank=True)

    # Progress
    weight_increase_kg = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    rep_increase = models.PositiveIntegerField(default=0)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    is_on_track = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user', 'exercise']

    def __str__(self):
        return f"{self.exercise.name} - {self.progress_percentage}%"
