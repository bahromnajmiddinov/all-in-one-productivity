import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q, F
from decimal import Decimal


class Dashboard(models.Model):
    """Custom dashboard configurations"""
    DASHBOARD_TYPES = [
        ('master', 'Master Overview'),
        ('tasks', 'Tasks'),
        ('habits', 'Habits'),
        ('health', 'Health'),
        ('finance', 'Finance'),
        ('productivity', 'Productivity'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboards')
    name = models.CharField(max_length=200)
    dashboard_type = models.CharField(max_length=20, choices=DASHBOARD_TYPES, default='custom')
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    
    # Layout configuration (JSON representation of widget positions)
    layout = models.JSONField(default=dict, blank=True)
    
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one default dashboard per user
        if self.is_default:
            Dashboard.objects.filter(user=self.user, is_default=True).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)


class DashboardWidget(models.Model):
    """Individual widgets for dashboards"""
    WIDGET_TYPES = [
        ('metric_card', 'Metric Card'),
        ('chart_line', 'Line Chart'),
        ('chart_bar', 'Bar Chart'),
        ('chart_pie', 'Pie Chart'),
        ('progress_bar', 'Progress Bar'),
        ('list', 'List'),
        ('calendar_view', 'Calendar View'),
        ('correlation_chart', 'Correlation Chart'),
        ('comparison_view', 'Comparison View'),
        ('trend_indicator', 'Trend Indicator'),
        ('stat_summary', 'Statistics Summary'),
    ]

    DATA_SOURCES = [
        ('tasks', 'Tasks'),
        ('habits', 'Habits'),
        ('health_sleep', 'Sleep'),
        ('health_exercise', 'Exercise'),
        ('health_water', 'Water Intake'),
        ('health_body', 'Body Metrics'),
        ('finance', 'Finance'),
        ('journal', 'Journal'),
        ('mood', 'Mood'),
        ('pomodoro', 'Pomodoro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name='widgets')
    widget_type = models.CharField(max_length=30, choices=WIDGET_TYPES)
    title = models.CharField(max_length=200)
    data_source = models.CharField(max_length=30, choices=DATA_SOURCES)
    
    # Widget configuration (filters, time ranges, display options)
    config = models.JSONField(default=dict, blank=True)
    
    # Position and size
    x = models.PositiveIntegerField(default=0)
    y = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(default=4)  # Grid-based layout (12-column grid)
    height = models.PositiveIntegerField(default=3)
    
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.title} ({self.get_widget_type_display()})"


class DashboardSnapshot(models.Model):
    """Cached dashboard data for performance"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name='snapshots')
    data = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-generated_at']

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Snapshot for {self.dashboard.name}"


class MetricAggregation(models.Model):
    """Pre-aggregated metrics for dashboard performance"""
    TIME_PERIODS = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='metric_aggregations')
    metric_name = models.CharField(max_length=100)
    data_source = models.CharField(max_length=50)
    
    time_period = models.CharField(max_length=20, choices=TIME_PERIODS)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Aggregated values
    value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    count = models.PositiveIntegerField(default=0)
    sum_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    avg_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    min_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    max_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-period_start']
        indexes = [
            models.Index(fields=['user', 'metric_name', '-period_start']),
            models.Index(fields=['user', 'data_source', 'time_period', '-period_start']),
        ]

    def __str__(self):
        return f"{self.metric_name} - {self.period_start.date()}"


class MetricComparison(models.Model):
    """Store comparison data for different time periods"""
    COMPARISON_TYPES = [
        ('wow', 'Week-over-Week'),
        ('mom', 'Month-over-Month'),
        ('yoy', 'Year-over-Year'),
        ('custom', 'Custom Range'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='metric_comparisons')
    metric_name = models.CharField(max_length=100)
    data_source = models.CharField(max_length=50)
    comparison_type = models.CharField(max_length=20, choices=COMPARISON_TYPES)
    
    # Period 1 (current/primary)
    period1_start = models.DateTimeField()
    period1_end = models.DateTimeField()
    period1_value = models.DecimalField(max_digits=20, decimal_places=4)
    
    # Period 2 (previous/secondary)
    period2_start = models.DateTimeField()
    period2_end = models.DateTimeField()
    period2_value = models.DecimalField(max_digits=20, decimal_places=4)
    
    # Calculated change
    absolute_change = models.DecimalField(max_digits=20, decimal_places=4)
    percentage_change = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Direction and significance
    is_positive = models.BooleanField(default=True)
    is_significant = models.BooleanField(default=False)
    
    # Additional context
    context_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.metric_name} {self.comparison_type.upper()}: {self.percentage_change:+.1f}%"


class CorrelationAnalysis(models.Model):
    """Store correlation analyses between different metrics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='correlation_analyses')
    
    # The two metrics being correlated
    metric1_name = models.CharField(max_length=100)
    metric1_source = models.CharField(max_length=50)
    metric2_name = models.CharField(max_length=100)
    metric2_source = models.CharField(max_length=50)
    
    # Correlation results
    correlation_coefficient = models.DecimalField(max_digits=6, decimal_places=4)
    correlation_strength = models.CharField(max_length=30, choices=[
        ('very_strong_positive', 'Very Strong Positive (+0.8 to +1.0)'),
        ('strong_positive', 'Strong Positive (+0.6 to +0.8)'),
        ('moderate_positive', 'Moderate Positive (+0.4 to +0.6)'),
        ('weak_positive', 'Weak Positive (+0.2 to +0.4)'),
        ('none', 'No Correlation (-0.2 to +0.2)'),
        ('weak_negative', 'Weak Negative (-0.2 to -0.4)'),
        ('moderate_negative', 'Moderate Negative (-0.4 to -0.6)'),
        ('strong_negative', 'Strong Negative (-0.6 to -0.8)'),
        ('very_strong_negative', 'Very Strong Negative (-0.8 to -1.0)'),
    ])
    
    # Statistical significance
    p_value = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    sample_size = models.PositiveIntegerField(default=0)
    confidence_interval_low = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)
    confidence_interval_high = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)
    
    # Time period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Insights and interpretation
    insights = models.JSONField(default=dict, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-correlation_coefficient']),
        ]

    def __str__(self):
        return f"{self.metric1_name} ↔ {self.metric2_name}: {self.correlation_coefficient}"


class DashboardPreference(models.Model):
    """User preferences for dashboard behavior"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_preferences')
    
    # Time zone and date format
    timezone = models.CharField(max_length=50, default='UTC')
    date_format = models.CharField(max_length=20, default='YYYY-MM-DD')
    
    # Default dashboard
    default_dashboard = models.ForeignKey(Dashboard, on_delete=models.SET_NULL, null=True, blank=True, related_name='default_for')
    
    # Refresh settings
    auto_refresh_enabled = models.BooleanField(default=False)
    auto_refresh_interval = models.PositiveIntegerField(default=60, help_text='Seconds')
    
    # Visualization preferences
    default_chart_type = models.CharField(max_length=20, default='line', choices=[
        ('line', 'Line'),
        ('bar', 'Bar'),
        ('area', 'Area'),
    ])
    show_trend_lines = models.BooleanField(default=True)
    show_data_labels = models.BooleanField(default=False)
    
    # Density settings
    compact_mode = models.BooleanField(default=False)
    widgets_per_row = models.PositiveIntegerField(default=3, choices=[(2, 2), (3, 3), (4, 4)])
    
    # Data range defaults
    default_time_range = models.CharField(max_length=20, default='7d', choices=[
        ('1d', '1 Day'),
        ('7d', '7 Days'),
        ('30d', '30 Days'),
        ('90d', '90 Days'),
        ('1y', '1 Year'),
        ('all', 'All Time'),
    ])
    
    # Notification preferences
    insights_enabled = models.BooleanField(default=True)
    anomaly_alerts_enabled = models.BooleanField(default=True)
    weekly_summary_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dashboard Preferences'

    def __str__(self):
        return f"Dashboard Preferences for {self.user.email}"


class DashboardInsight(models.Model):
    """AI-generated insights for dashboard data"""
    INSIGHT_TYPES = [
        ('trend', 'Trend Analysis'),
        ('anomaly', 'Anomaly Detection'),
        ('correlation', 'Correlation Discovery'),
        ('achievement', 'Achievement Milestone'),
        ('improvement', 'Improvement Opportunity'),
        ('warning', 'Warning Alert'),
        ('comparison', 'Period Comparison'),
    ]
    
    SEVERITY_LEVELS = [
        ('info', 'Informational'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_insights')
    dashboard = models.ForeignKey(Dashboard, on_delete=models.SET_NULL, null=True, blank=True, related_name='insights')
    
    insight_type = models.CharField(max_length=30, choices=INSIGHT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='info')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Related data
    metric_name = models.CharField(max_length=100)
    data_source = models.CharField(max_length=50)
    
    # Time period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Value context
    current_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    previous_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    threshold_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    
    # Confidence and relevance
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.5)
    is_dismissed = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    
    # Related widgets or metrics
    related_widgets = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', 'severity']

    def __str__(self):
        return f"{self.get_severity_display().upper()}: {self.title}"


class DashboardTemplate(models.Model):
    """Pre-built dashboard templates for users"""
    TEMPLATE_CATEGORIES = [
        ('productivity', 'Productivity'),
        ('wellness', 'Wellness & Health'),
        ('finance', 'Financial'),
        ('habits', 'Habit Tracking'),
        ('all_in_one', 'All-in-One'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=TEMPLATE_CATEGORIES)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='dashboard_templates/', null=True, blank=True)
    
    # Template configuration
    widgets = models.JSONField(default=list, help_text='List of widget configurations')
    layout = models.JSONField(default=dict)
    
    # Usage tracking
    is_featured = models.BooleanField(default=False)
    is_official = models.BooleanField(default=False)
    usage_count = models.PositiveIntegerField(default=0)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', '-usage_count', 'name']

    def __str__(self):
        return self.name
