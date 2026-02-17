import uuid
from decimal import Decimal
from datetime import timedelta, date
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Avg, Sum, Count, StdDev, Min, Max


class CrossModuleCorrelation(models.Model):
    """AI-powered correlations between metrics from different modules"""
    CORRELATION_STATUS = [
        ('pending', 'Pending Analysis'),
        ('analyzing', 'Analyzing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cross_module_correlations')
    
    # Source metric
    source_module = models.CharField(max_length=50, help_text="e.g., 'sleep', 'mood', 'exercise'")
    source_metric = models.CharField(max_length=100, help_text="e.g., 'duration', 'quality', 'average_rating'")
    
    # Target metric
    target_module = models.CharField(max_length=50)
    target_metric = models.CharField(max_length=100)
    
    # Correlation results
    correlation_coefficient = models.DecimalField(max_digits=6, decimal_places=4)
    correlation_strength = models.CharField(max_length=30, choices=[
        ('very_strong_positive', 'Very Strong Positive'),
        ('strong_positive', 'Strong Positive'),
        ('moderate_positive', 'Moderate Positive'),
        ('weak_positive', 'Weak Positive'),
        ('none', 'No Correlation'),
        ('weak_negative', 'Weak Negative'),
        ('moderate_negative', 'Moderate Negative'),
        ('strong_negative', 'Strong Negative'),
        ('very_strong_negative', 'Very Strong Negative'),
    ])
    
    # Analysis metadata
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)
    sample_size = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=CORRELATION_STATUS, default='pending')
    
    # Time period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # AI-generated insights
    insight_title = models.CharField(max_length=200, blank=True)
    insight_description = models.TextField(blank=True)
    action_recommendations = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-correlation_coefficient']
        indexes = [
            models.Index(fields=['user', 'source_module', 'target_module']),
            models.Index(fields=['user', '-correlation_coefficient']),
        ]
    
    def __str__(self):
        return f"{self.source_module}.{self.source_metric} ↔ {self.target_module}.{self.target_metric}"
    
    def calculate_strength(self):
        """Calculate strength from coefficient"""
        coef = float(self.correlation_coefficient)
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


class AutomatedReport(models.Model):
    """Weekly/Monthly automated reports"""
    REPORT_TYPES = [
        ('weekly', 'Weekly Summary'),
        ('monthly', 'Monthly Summary'),
        ('quarterly', 'Quarterly Review'),
        ('custom', 'Custom Report'),
    ]
    
    REPORT_STATUS = [
        ('draft', 'Draft'),
        ('generating', 'Generating'),
        ('ready', 'Ready'),
        ('sent', 'Sent'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='automated_reports')
    
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=REPORT_STATUS, default='draft')
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Report content
    summary_text = models.TextField(blank=True, help_text="AI-generated summary")
    key_highlights = models.JSONField(default=list, blank=True)
    key_lowlights = models.JSONField(default=list, blank=True)
    
    # Metrics summary by module
    module_summaries = models.JSONField(default=dict, blank=True, help_text="Module summaries as JSON: {tasks: {...}, habits: {...}}")
    
    # Trends detected
    improving_metrics = models.JSONField(default=list, blank=True)
    declining_metrics = models.JSONField(default=list, blank=True)
    stable_metrics = models.JSONField(default=list, blank=True)
    
    # Insights and recommendations
    insights = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    # Comparison with previous period
    comparison_data = models.JSONField(default=dict, blank=True)
    
    # Generation metadata
    generated_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'report_type', '-created_at']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.get_report_type_display()}: {self.title}"


class TrendDetection(models.Model):
    """Detected trends in user metrics"""
    TREND_DIRECTIONS = [
        ('improving', 'Improving'),
        ('declining', 'Declining'),
        ('stable', 'Stable'),
        ('volatile', 'Volatile'),
    ]
    
    TREND_PERIODS = [
        ('7d', '7 Days'),
        ('30d', '30 Days'),
        ('90d', '90 Days'),
        ('6m', '6 Months'),
        ('1y', '1 Year'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='detected_trends')
    
    module = models.CharField(max_length=50)
    metric_name = models.CharField(max_length=100)
    metric_display_name = models.CharField(max_length=200, blank=True)
    
    trend_direction = models.CharField(max_length=20, choices=TREND_DIRECTIONS)
    trend_period = models.CharField(max_length=10, choices=TREND_PERIODS)
    
    # Statistical data
    start_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    end_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    change_absolute = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    change_percentage = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Trend quality
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)
    volatility_index = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Time period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Visualization data
    trend_data = models.JSONField(default=list, blank=True, help_text="Daily values for charting")
    
    # Status
    is_significant = models.BooleanField(default=False)
    is_acknowledged = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'module', '-created_at']),
            models.Index(fields=['user', 'trend_direction', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.module}.{self.metric_name}: {self.get_trend_direction_display()}"


class AnomalyDetection(models.Model):
    """Detected anomalies in user data"""
    ANOMALY_TYPES = [
        ('spike', 'Sudden Spike'),
        ('drop', 'Sudden Drop'),
        ('outlier', 'Statistical Outlier'),
        ('pattern_break', 'Pattern Break'),
        ('missing_data', 'Unusual Missing Data'),
    ]
    
    SEVERITY_LEVELS = [
        ('info', 'Informational'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='detected_anomalies')
    
    module = models.CharField(max_length=50)
    metric_name = models.CharField(max_length=100)
    anomaly_type = models.CharField(max_length=20, choices=ANOMALY_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    
    # Anomaly details
    detected_date = models.DateField()
    expected_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    actual_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    deviation_percentage = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Context
    baseline_average = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    baseline_std_dev = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    
    # Description and explanation
    title = models.CharField(max_length=200)
    description = models.TextField()
    possible_causes = models.JSONField(default=list, blank=True)
    
    # Related data
    related_entries = models.JSONField(default=list, blank=True, help_text="IDs of related entries")
    
    # Status
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    is_investigated = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'module', '-created_at']),
            models.Index(fields=['user', 'severity', '-created_at']),
            models.Index(fields=['user', 'is_dismissed', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_anomaly_type_display()}: {self.title}"


class GoalProgress(models.Model):
    """Unified goal progress across all modules"""
    GOAL_SOURCES = [
        ('sleep', 'Sleep Goals'),
        ('fitness', 'Fitness Goals'),
        ('finance', 'Financial Goals'),
        ('habits', 'Habit Goals'),
        ('productivity', 'Productivity Goals'),
        ('custom', 'Custom Goals'),
    ]
    
    GOAL_STATUS = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('on_track', 'On Track'),
        ('at_risk', 'At Risk'),
        ('off_track', 'Off Track'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='unified_goal_progress')
    
    # Goal identification
    source_module = models.CharField(max_length=20, choices=GOAL_SOURCES)
    source_goal_id = models.CharField(max_length=100, help_text="ID of the original goal")
    goal_name = models.CharField(max_length=200)
    goal_description = models.TextField(blank=True)
    
    # Progress tracking
    target_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    current_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Goal parameters
    start_date = models.DateField()
    target_date = models.DateField(null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=GOAL_STATUS, default='not_started')
    
    # Visual data
    progress_history = models.JSONField(default=list, blank=True)
    projected_completion = models.DateField(null=True, blank=True)
    days_remaining = models.IntegerField(null=True, blank=True)
    
    # Aggregation
    is_aggregate = models.BooleanField(default=False, help_text="True if this combines multiple sub-goals")
    sub_goals = models.JSONField(default=list, blank=True)
    
    # Sync timestamp
    last_synced = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-progress_percentage']
        indexes = [
            models.Index(fields=['user', 'source_module']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.goal_name} ({self.progress_percentage}%)"
    
    def calculate_progress(self):
        """Calculate progress percentage"""
        if self.target_value and self.target_value != 0:
            progress = (self.current_value or 0) / self.target_value * 100
            self.progress_percentage = min(Decimal('100'), max(Decimal('0'), progress))
        return self.progress_percentage


class PredictiveForecast(models.Model):
    """Forecast future trends based on historical data"""
    FORECAST_PERIODS = [
        ('7d', 'Next 7 Days'),
        ('30d', 'Next 30 Days'),
        ('90d', 'Next 90 Days'),
        ('6m', 'Next 6 Months'),
    ]
    
    FORECAST_STATUS = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('ready', 'Ready'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='predictive_forecasts')
    
    module = models.CharField(max_length=50)
    metric_name = models.CharField(max_length=100)
    forecast_period = models.CharField(max_length=10, choices=FORECAST_PERIODS)
    
    # Forecast data
    forecast_values = models.JSONField(default=list, help_text="[{date, predicted_value, confidence_low, confidence_high}, ...]")
    trend_direction = models.CharField(max_length=20, choices=[
        ('increasing', 'Increasing'),
        ('decreasing', 'Decreasing'),
        ('stable', 'Stable'),
        ('fluctuating', 'Fluctuating'),
    ])
    
    # Model metadata
    model_accuracy = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="R² score or similar")
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)
    
    # Historical context
    historical_average = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    historical_trend = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    # Time bounds
    forecast_start_date = models.DateField()
    forecast_end_date = models.DateField()
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=FORECAST_STATUS, default='pending')
    
    # Insights
    insight_summary = models.TextField(blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['user', 'module', '-generated_at']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.module}.{self.metric_name} Forecast ({self.forecast_period})"
    
    def is_expired(self):
        return timezone.now() > self.expires_at


class PeriodComparison(models.Model):
    """Compare any two time periods across metrics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='period_comparisons')
    
    name = models.CharField(max_length=200, blank=True)
    
    # Period 1
    period1_start = models.DateField()
    period1_end = models.DateField()
    period1_label = models.CharField(max_length=100, blank=True)
    
    # Period 2
    period2_start = models.DateField()
    period2_end = models.DateField()
    period2_label = models.CharField(max_length=100, blank=True)
    
    # Comparison results by module
    comparison_data = models.JSONField(default=dict, help_text="Comparison results by module as JSON")
    
    # Overall summary
    overall_winner = models.CharField(max_length=10, choices=[
        ('period1', 'Period 1'),
        ('period2', 'Period 2'),
        ('tie', 'Tie'),
    ], blank=True)
    
    key_differences = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comparison: {self.period1_label} vs {self.period2_label}"


class CustomReport(models.Model):
    """User-generated custom reports"""
    REPORT_FORMATS = [
        ('json', 'JSON'),
        ('csv', 'CSV'),
        ('pdf', 'PDF'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='custom_reports')
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Report configuration
    selected_modules = models.JSONField(default=list, help_text="['tasks', 'mood', 'sleep', ...]")
    selected_metrics = models.JSONField(default=dict, help_text="{'tasks': ['completed', 'created'], ...}")
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Format and options
    format = models.CharField(max_length=10, choices=REPORT_FORMATS, default='json')
    include_charts = models.BooleanField(default=True)
    include_insights = models.BooleanField(default=True)
    include_comparisons = models.BooleanField(default=False)
    
    # Generation
    generated_file = models.FileField(upload_to='custom_reports/%Y/%m/', null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_favorite = models.BooleanField(default=False)
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(max_length=20, blank=True, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class AchievementBadge(models.Model):
    """Achievement badges and milestones"""
    BADGE_CATEGORIES = [
        ('consistency', 'Consistency'),
        ('milestone', 'Milestone'),
        ('streak', 'Streak'),
        ('improvement', 'Improvement'),
        ('exploration', 'Exploration'),
        ('social', 'Social'),
        ('special', 'Special'),
    ]
    
    BADGE_LEVELS = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
        ('legendary', 'Legendary'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Badge definition
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=BADGE_CATEGORIES)
    level = models.CharField(max_length=20, choices=BADGE_LEVELS)
    
    # Visual
    icon = models.CharField(max_length=100, default='award')
    color = models.CharField(max_length=7, default='#FFD700')
    image = models.ImageField(upload_to='badges/', null=True, blank=True)
    
    # Criteria
    criteria_type = models.CharField(max_length=50, help_text="e.g., 'streak_days', 'total_count', 'milestone'")
    criteria_value = models.PositiveIntegerField(help_text="Threshold value to earn badge")
    criteria_module = models.CharField(max_length=50, blank=True, help_text="Module this badge relates to")
    
    # Metadata
    is_hidden = models.BooleanField(default=False, help_text="Secret badges")
    is_limited = models.BooleanField(default=False, help_text="Limited time/event badges")
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'level', 'order']
    
    def __str__(self):
        return f"{self.display_name} ({self.get_level_display()})"


class UserAchievement(models.Model):
    """User's earned achievements"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    badge = models.ForeignKey(AchievementBadge, on_delete=models.CASCADE, related_name='user_achievements')
    
    # Progress tracking
    progress_current = models.PositiveIntegerField(default=0)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Status
    is_earned = models.BooleanField(default=False)
    earned_at = models.DateTimeField(null=True, blank=True)
    
    # Context
    earned_context = models.JSONField(default=dict, blank=True, help_text="Context when earned")
    
    # Sharing
    is_shared = models.BooleanField(default=False)
    shared_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'badge']
        ordering = ['-earned_at', '-progress_percentage']
    
    def __str__(self):
        status = "Earned" if self.is_earned else f"{self.progress_percentage}%"
        return f"{self.user.email} - {self.badge.display_name}: {status}"
    
    def update_progress(self, current_value):
        """Update progress toward earning the badge"""
        self.progress_current = current_value
        if self.badge.criteria_value > 0:
            self.progress_percentage = min(
                Decimal('100'),
                Decimal(current_value) / Decimal(self.badge.criteria_value) * 100
            )
        
        if self.progress_percentage >= 100 and not self.is_earned:
            self.is_earned = True
            self.earned_at = timezone.now()
        
        self.save()


class AnalyticsExport(models.Model):
    """Data exports in various formats"""
    EXPORT_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]
    
    EXPORT_FORMATS = [
        ('json', 'JSON'),
        ('csv', 'CSV'),
        ('xlsx', 'Excel'),
        ('pdf', 'PDF'),
    ]
    
    EXPORT_SCOPES = [
        ('all', 'All Data'),
        ('module', 'Specific Module'),
        ('date_range', 'Date Range'),
        ('custom', 'Custom Selection'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='analytics_exports')
    
    # Export configuration
    name = models.CharField(max_length=200)
    export_format = models.CharField(max_length=10, choices=EXPORT_FORMATS)
    export_scope = models.CharField(max_length=20, choices=EXPORT_SCOPES)
    
    # Filters
    selected_modules = models.JSONField(default=list, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # File
    file = models.FileField(upload_to='exports/%Y/%m/', null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    download_url = models.URLField(blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=EXPORT_STATUS, default='pending')
    error_message = models.TextField(blank=True)
    
    # Processing
    requested_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    record_count = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"{self.name} ({self.export_format})"
    
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


class AnalyticsInsight(models.Model):
    """Cross-module AI-generated insights"""
    INSIGHT_TYPES = [
        ('pattern', 'Pattern Recognition'),
        ('correlation', 'Correlation Discovery'),
        ('anomaly', 'Anomaly Alert'),
        ('prediction', 'Prediction'),
        ('recommendation', 'Recommendation'),
        ('achievement', 'Achievement Unlocked'),
        ('milestone', 'Milestone Reached'),
        ('comparison', 'Comparison Insight'),
    ]
    
    SEVERITY_LEVELS = [
        ('info', 'Informational'),
        ('positive', 'Positive'),
        ('warning', 'Warning'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='analytics_insights')
    
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='info')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Related modules and metrics
    related_modules = models.JSONField(default=list, blank=True)
    related_metrics = models.JSONField(default=list, blank=True)
    
    # Supporting data
    supporting_data = models.JSONField(default=dict, blank=True)
    chart_data = models.JSONField(default=dict, blank=True)
    
    # Action items
    action_items = models.JSONField(default=list, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    is_actioned = models.BooleanField(default=False)
    
    # Timing
    relevant_date = models.DateField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'insight_type', '-created_at']),
            models.Index(fields=['user', 'is_dismissed', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"


class UserAnalyticsProfile(models.Model):
    """User's overall analytics profile and aggregated stats"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='analytics_profile')
    
    # Overall engagement
    total_data_points = models.PositiveIntegerField(default=0)
    active_modules = models.JSONField(default=list, blank=True)
    
    # Consistency scores (0-100)
    overall_consistency_score = models.PositiveIntegerField(default=0)
    module_consistency_scores = models.JSONField(default=dict, blank=True)
    
    # Trends
    current_streak_days = models.PositiveIntegerField(default=0)
    longest_streak_days = models.PositiveIntegerField(default=0)
    
    # Achievements
    total_badges_earned = models.PositiveIntegerField(default=0)
    badges_by_category = models.JSONField(default=dict, blank=True)
    
    # Last activity
    last_entry_date = models.DateField(null=True, blank=True)
    last_entry_module = models.CharField(max_length=50, blank=True)
    
    # Insights preferences
    insights_enabled = models.BooleanField(default=True)
    anomaly_alerts_enabled = models.BooleanField(default=True)
    weekly_reports_enabled = models.BooleanField(default=True)
    predictive_insights_enabled = models.BooleanField(default=True)
    
    # Calculated at
    calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Analytics Profile'
        verbose_name_plural = 'User Analytics Profiles'
    
    def __str__(self):
        return f"Analytics Profile for {self.user.email}"
