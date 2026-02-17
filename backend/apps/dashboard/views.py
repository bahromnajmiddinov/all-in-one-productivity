from datetime import datetime, timedelta, date
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q, F, Case, When, IntegerField, DecimalField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, ExtractWeekDay
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    Dashboard,
    DashboardWidget,
    DashboardSnapshot,
    MetricAggregation,
    MetricComparison,
    CorrelationAnalysis,
    DashboardPreference,
    DashboardInsight,
    DashboardTemplate,
)
from .serializers import (
    DashboardSerializer,
    DashboardCreateSerializer,
    DashboardWidgetSerializer,
    DashboardSnapshotSerializer,
    MetricAggregationSerializer,
    MetricComparisonSerializer,
    CorrelationAnalysisSerializer,
    DashboardPreferenceSerializer,
    DashboardInsightSerializer,
    DashboardTemplateSerializer,
)


class DashboardViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Dashboard.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DashboardCreateSerializer
        return DashboardSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def master(self, request):
        """Get or create the master overview dashboard"""
        dashboard = Dashboard.objects.filter(
            user=request.user,
            dashboard_type='master'
        ).first()
        
        if not dashboard:
            # Create default master dashboard
            dashboard = self._create_default_master_dashboard(request.user)
        
        serializer = self.get_serializer(dashboard)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        """Get real-time dashboard data with optional refresh"""
        dashboard = self.get_object()
        
        # Check for valid cached snapshot
        snapshot = DashboardSnapshot.objects.filter(
            dashboard=dashboard,
            expires_at__gt=timezone.now()
        ).first()
        
        refresh = request.query_params.get('refresh', 'false').lower() == 'true'
        
        if not snapshot or refresh:
            # Generate fresh data
            data = self._generate_dashboard_data(dashboard, request.user)
            
            # Create new snapshot
            DashboardSnapshot.objects.filter(dashboard=dashboard).delete()
            snapshot = DashboardSnapshot.objects.create(
                dashboard=dashboard,
                data=data,
                expires_at=timezone.now() + timedelta(minutes=5)
            )
        
        serializer = DashboardSnapshotSerializer(snapshot)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def widgets(self, request, pk=None):
        """Bulk update widgets for a dashboard"""
        dashboard = self.get_object()
        widgets_data = request.data.get('widgets', [])
        
        # Delete existing widgets
        DashboardWidget.objects.filter(dashboard=dashboard).delete()
        
        # Create new widgets
        widgets = []
        for widget_data in widgets_data:
            widget_data['dashboard'] = dashboard.id
            serializer = DashboardWidgetSerializer(data=widget_data)
            if serializer.is_valid():
                widgets.append(serializer.save())
        
        serializer = DashboardSerializer(dashboard)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Get available dashboard templates"""
        templates = DashboardTemplate.objects.filter(is_official=True)
        category = request.query_params.get('category')
        
        if category:
            templates = templates.filter(category=category)
        
        serializer = DashboardTemplateSerializer(templates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def from_template(self, request):
        """Create a dashboard from a template"""
        template_id = request.data.get('template_id')
        name = request.data.get('name')
        
        try:
            template = DashboardTemplate.objects.get(id=template_id)
        except DashboardTemplate.DoesNotExist:
            return Response(
                {'error': 'Template not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        dashboard = Dashboard.objects.create(
            user=request.user,
            name=name or f"{template.name} (Copy)",
            dashboard_type='custom',
            description=template.description,
            layout=template.layout,
        )
        
        # Create widgets from template
        for widget_data in template.widgets:
            DashboardWidget.objects.create(
                dashboard=dashboard,
                **widget_data
            )
        
        # Increment usage count
        template.usage_count += 1
        template.save()
        
        serializer = DashboardSerializer(dashboard)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def _create_default_master_dashboard(self, user):
        """Create default master overview dashboard"""
        dashboard = Dashboard.objects.create(
            user=user,
            name='Master Overview',
            dashboard_type='master',
            description='Unified view showing key metrics from all modules',
            is_default=True,
        )
        
        # Create default widgets
        default_widgets = [
            {
                'widget_type': 'metric_card',
                'title': 'Tasks Completed Today',
                'data_source': 'tasks',
                'config': {'metric': 'completed_today', 'time_range': 'today'},
                'x': 0, 'y': 0, 'width': 3, 'height': 2,
            },
            {
                'widget_type': 'metric_card',
                'title': 'Habits Streak',
                'data_source': 'habits',
                'config': {'metric': 'current_streak', 'time_range': 'all'},
                'x': 3, 'y': 0, 'width': 3, 'height': 2,
            },
            {
                'widget_type': 'metric_card',
                'title': 'Current Mood',
                'data_source': 'mood',
                'config': {'metric': 'latest', 'time_range': 'today'},
                'x': 6, 'y': 0, 'width': 3, 'height': 2,
            },
            {
                'widget_type': 'metric_card',
                'title': 'Sleep Last Night',
                'data_source': 'health_sleep',
                'config': {'metric': 'duration', 'time_range': 'last_night'},
                'x': 9, 'y': 0, 'width': 3, 'height': 2,
            },
            {
                'widget_type': 'chart_line',
                'title': 'Productivity Trend (7 Days)',
                'data_source': 'tasks',
                'config': {'metric': 'completed', 'time_range': '7d', 'chart_type': 'line'},
                'x': 0, 'y': 2, 'width': 6, 'height': 3,
            },
            {
                'widget_type': 'chart_bar',
                'title': 'Mood This Week',
                'data_source': 'mood',
                'config': {'metric': 'average', 'time_range': '7d', 'chart_type': 'bar'},
                'x': 6, 'y': 2, 'width': 6, 'height': 3,
            },
        ]
        
        for widget_data in default_widgets:
            DashboardWidget.objects.create(dashboard=dashboard, **widget_data)
        
        return dashboard
    
    def _generate_dashboard_data(self, dashboard, user):
        """Generate real-time data for dashboard widgets"""
        data = {}
        
        for widget in dashboard.widgets.filter(is_visible=True):
            widget_data = self._get_widget_data(widget, user)
            data[str(widget.id)] = widget_data
        
        return data
    
    def _get_widget_data(self, widget, user):
        """Get data for a single widget"""
        widget_type = widget.widget_type
        data_source = widget.data_source
        config = widget.config
        
        if data_source == 'tasks':
            return self._get_tasks_data(user, config)
        elif data_source == 'habits':
            return self._get_habits_data(user, config)
        elif data_source == 'mood':
            return self._get_mood_data(user, config)
        elif data_source == 'health_sleep':
            return self._get_sleep_data(user, config)
        elif data_source == 'health_exercise':
            return self._get_exercise_data(user, config)
        elif data_source == 'health_water':
            return self._get_water_data(user, config)
        elif data_source == 'finance':
            return self._get_finance_data(user, config)
        elif data_source == 'journal':
            return self._get_journal_data(user, config)
        
        return {}
    
    def _get_tasks_data(self, user, config):
        from apps.tasks.models import Task
        
        metric = config.get('metric', 'all')
        time_range = config.get('time_range', 'today')
        
        # Calculate date range
        today = timezone.now().date()
        if time_range == 'today':
            start_date = today
        elif time_range == '7d':
            start_date = today - timedelta(days=7)
        elif time_range == '30d':
            start_date = today - timedelta(days=30)
        else:
            start_date = today - timedelta(days=7)
        
        if metric == 'completed_today':
            completed = Task.objects.filter(
                user=user,
                status='completed',
                completed_at__date=today
            ).count()
            return {'value': completed, 'unit': 'tasks'}
        
        elif metric == 'active':
            active = Task.objects.filter(
                user=user,
                status='active'
            ).count()
            return {'value': active, 'unit': 'tasks'}
        
        elif metric == 'completed':
            tasks = Task.objects.filter(
                user=user,
                status='completed',
                completed_at__date__gte=start_date
            ).annotate(date=TruncDate('completed_at')).values('date').annotate(count=Count('id')).order_by('date')
            
            return {
                'chart_data': [{'date': str(t['date']), 'value': t['count']} for t in tasks]
            }
        
        # Priority distribution
        priority_counts = Task.objects.filter(user=user, status__in=['inbox', 'active']).values('priority').annotate(count=Count('id'))
        return {
            'priority_distribution': {str(p['priority']): p['count'] for p in priority_counts}
        }
    
    def _get_habits_data(self, user, config):
        from apps.habits.models import Habit, HabitCompletion
        
        metric = config.get('metric', 'all')
        
        if metric == 'current_streak':
            habits = Habit.objects.filter(user=user, is_archived=False)
            total_streak = sum(h.current_streak for h in habits)
            return {'value': total_streak, 'unit': 'days'}
        
        elif metric == 'completion_rate':
            today = timezone.now().date()
            week_ago = today - timedelta(days=7)
            
            total_possible = Habit.objects.filter(user=user, is_archived=False).count() * 7
            total_completed = HabitCompletion.objects.filter(
                habit__user=user,
                date__gte=week_ago
            ).count()
            
            rate = (total_completed / total_possible * 100) if total_possible > 0 else 0
            return {'value': round(rate, 1), 'unit': '%'}
        
        return {}
    
    def _get_mood_data(self, user, config):
        from apps.mood.models import MoodEntry
        
        metric = config.get('metric', 'average')
        time_range = config.get('time_range', '7d')
        
        today = timezone.now().date()
        if time_range == 'today':
            start_date = today
        elif time_range == '7d':
            start_date = today - timedelta(days=7)
        elif time_range == '30d':
            start_date = today - timedelta(days=30)
        else:
            start_date = today - timedelta(days=7)
        
        if metric == 'latest':
            latest = MoodEntry.objects.filter(user=user).order_by('-entry_date', '-entry_time').first()
            if latest:
                return {
                    'value': latest.mood_value,
                    'emoji': latest.mood_emoji,
                    'label': latest.mood_label,
                    'date': str(latest.entry_date)
                }
            return {'value': None}
        
        elif metric == 'average':
            entries = MoodEntry.objects.filter(
                user=user,
                entry_date__gte=start_date
            ).annotate(date=TruncDate('entry_date')).values('date').annotate(avg=Avg('mood_value')).order_by('date')
            
            return {
                'chart_data': [{'date': str(e['date']), 'value': float(e['avg'])} for e in entries]
            }
        
        return {}
    
    def _get_sleep_data(self, user, config):
        try:
            from apps.health.models import SleepLog
        except ImportError:
            return {'value': None}
        
        metric = config.get('metric', 'duration')
        
        if metric == 'duration':
            last_night = SleepLog.objects.filter(user=user).order_by('-date').first()
            if last_night:
                hours = last_night.total_hours or 0
                return {'value': round(hours, 1), 'unit': 'hours'}
            return {'value': None}
        
        return {}
    
    def _get_exercise_data(self, user, config):
        try:
            from apps.health.models import ExerciseLog
        except ImportError:
            return {'value': None}
        
        metric = config.get('metric', 'duration')
        
        if metric == 'duration':
            today = timezone.now().date()
            week_ago = today - timedelta(days=7)
            
            logs = ExerciseLog.objects.filter(
                user=user,
                date__gte=week_ago
            )
            
            total_minutes = sum(log.duration_minutes or 0 for log in logs)
            return {'value': total_minutes, 'unit': 'minutes'}
        
        return {}
    
    def _get_water_data(self, user, config):
        try:
            from apps.health.models import WaterLog
        except ImportError:
            return {'value': None}
        
        metric = config.get('metric', 'intake')
        
        if metric == 'intake':
            today = timezone.now().date()
            
            logs = WaterLog.objects.filter(user=user, date=today)
            total_ml = sum(log.amount_ml or 0 for log in logs)
            
            return {'value': total_ml, 'unit': 'ml'}
        
        return {}
    
    def _get_finance_data(self, user, config):
        try:
            from apps.finance.models import Transaction, Account
        except ImportError:
            return {'value': None}
        
        metric = config.get('metric', 'balance')
        
        if metric == 'balance':
            accounts = Account.objects.filter(user=user)
            total_balance = sum(acc.balance for acc in accounts)
            return {'value': float(total_balance), 'unit': 'USD'}
        
        elif metric == 'spending':
            today = timezone.now().date()
            month_start = today.replace(day=1)
            
            expenses = Transaction.objects.filter(
                user=user,
                type='expense',
                date__gte=month_start
            )
            
            total_spending = sum(exp.amount for exp in expenses)
            return {'value': float(total_spending), 'unit': 'USD'}
        
        return {}
    
    def _get_journal_data(self, user, config):
        try:
            from apps.journal.models import JournalEntry
        except ImportError:
            return {'value': None}
        
        metric = config.get('metric', 'entries')
        
        if metric == 'entries':
            today = timezone.now().date()
            week_ago = today - timedelta(days=7)
            
            entries = JournalEntry.objects.filter(
                user=user,
                created_at__date__gte=week_ago
            ).count()
            
            return {'value': entries, 'unit': 'entries'}
        
        return {}


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardWidgetSerializer
    
    def get_queryset(self):
        return DashboardWidget.objects.filter(dashboard__user=self.request.user)


class DashboardPreferenceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardPreferenceSerializer
    
    def get_queryset(self):
        return DashboardPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        # Get or create preferences for current user
        obj, created = DashboardPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj


class DashboardInsightViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardInsightSerializer
    
    def get_queryset(self):
        return DashboardInsight.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an insight"""
        insight = self.get_object()
        insight.is_dismissed = True
        insight.save()
        return Response({'status': 'dismissed'})
    
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """Mark insight as read"""
        insight = self.get_object()
        insight.is_read = True
        insight.save()
        return Response({'status': 'read'})


class MetricComparisonViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MetricComparisonSerializer
    
    def get_queryset(self):
        return MetricComparison.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def generate(self, request):
        """Generate comparison for a metric"""
        metric_name = request.query_params.get('metric')
        data_source = request.query_params.get('source')
        comparison_type = request.query_params.get('type', 'wow')
        
        if not metric_name or not data_source:
            return Response(
                {'error': 'metric and source parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comparison = self._generate_comparison(
            request.user,
            metric_name,
            data_source,
            comparison_type
        )
        
        serializer = self.get_serializer(comparison)
        return Response(serializer.data)
    
    def _generate_comparison(self, user, metric_name, data_source, comparison_type):
        """Generate comparison data for a metric"""
        today = timezone.now().date()
        
        if comparison_type == 'wow':
            # Week-over-week: this week vs last week
            period1_end = today
            period1_start = today - timedelta(days=today.weekday())
            period2_end = period1_start - timedelta(days=1)
            period2_start = period2_end - timedelta(days=6)
        
        elif comparison_type == 'mom':
            # Month-over-month: this month vs last month
            period1_end = today
            period1_start = today.replace(day=1)
            period2_end = period1_start - timedelta(days=1)
            period2_start = period2_end.replace(day=1)
        
        elif comparison_type == 'yoy':
            # Year-over-year: this year vs last year
            period1_end = today
            period1_start = today.replace(month=1, day=1)
            period2_end = period1_start - timedelta(days=1)
            period2_start = period2_end.replace(month=1, day=1)
        
        # Get values for both periods
        period1_value = self._get_metric_value(
            user, metric_name, data_source, period1_start, period1_end
        )
        period2_value = self._get_metric_value(
            user, metric_name, data_source, period2_start, period2_end
        )
        
        # Calculate changes
        if period2_value and period2_value != 0:
            absolute_change = period1_value - period2_value
            percentage_change = (absolute_change / abs(period2_value)) * 100
        else:
            absolute_change = Decimal('0')
            percentage_change = Decimal('0')
        
        # Determine if change is positive (context-dependent)
        is_positive = percentage_change >= 0
        
        # Determine if significant (change > 10%)
        is_significant = abs(percentage_change) >= 10
        
        return MetricComparison.objects.create(
            user=user,
            metric_name=metric_name,
            data_source=data_source,
            comparison_type=comparison_type,
            period1_start=timezone.make_aware(datetime.combine(period1_start, datetime.min.time())),
            period1_end=timezone.make_aware(datetime.combine(period1_end, datetime.max.time())),
            period1_value=period1_value,
            period2_start=timezone.make_aware(datetime.combine(period2_start, datetime.min.time())),
            period2_end=timezone.make_aware(datetime.combine(period2_end, datetime.max.time())),
            period2_value=period2_value,
            absolute_change=absolute_change,
            percentage_change=percentage_change,
            is_positive=is_positive,
            is_significant=is_significant,
        )
    
    def _get_metric_value(self, user, metric_name, data_source, start_date, end_date):
        """Get the value of a metric for a given time period"""
        if data_source == 'tasks':
            from apps.tasks.models import Task
            if metric_name == 'completed':
                return Task.objects.filter(
                    user=user,
                    status='completed',
                    completed_at__date__gte=start_date,
                    completed_at__date__lte=end_date
                ).count()
        
        elif data_source == 'habits':
            from apps.habits.models import HabitCompletion
            if metric_name == 'completions':
                return HabitCompletion.objects.filter(
                    habit__user=user,
                    date__gte=start_date,
                    date__lte=end_date
                ).count()
        
        elif data_source == 'mood':
            from apps.mood.models import MoodEntry
            if metric_name == 'average':
                avg = MoodEntry.objects.filter(
                    user=user,
                    entry_date__gte=start_date,
                    entry_date__lte=end_date
                ).aggregate(avg=Avg('mood_value'))['avg']
                return avg or Decimal('0')
        
        elif data_source == 'health_exercise':
            try:
                from apps.health.models import ExerciseLog
                if metric_name == 'duration':
                    total = ExerciseLog.objects.filter(
                        user=user,
                        date__gte=start_date,
                        date__lte=end_date
                    ).aggregate(total=Sum('duration_minutes'))['total']
                    return total or Decimal('0')
            except ImportError:
                pass
        
        elif data_source == 'finance':
            try:
                from apps.finance.models import Transaction
                if metric_name == 'income':
                    total = Transaction.objects.filter(
                        user=user,
                        type='income',
                        date__gte=start_date,
                        date__lte=end_date
                    ).aggregate(total=Sum('amount'))['total']
                    return total or Decimal('0')
                elif metric_name == 'expenses':
                    total = Transaction.objects.filter(
                        user=user,
                        type='expense',
                        date__gte=start_date,
                        date__lte=end_date
                    ).aggregate(total=Sum('amount'))['total']
                    return total or Decimal('0')
            except ImportError:
                pass
        
        return Decimal('0')


class CorrelationAnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CorrelationAnalysisSerializer
    
    def get_queryset(self):
        return CorrelationAnalysis.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def analyze(self, request):
        """Analyze correlation between two metrics"""
        metric1_name = request.query_params.get('metric1')
        metric1_source = request.query_params.get('source1')
        metric2_name = request.query_params.get('metric2')
        metric2_source = request.query_params.get('source2')
        days = int(request.query_params.get('days', '30'))
        
        if not all([metric1_name, metric1_source, metric2_name, metric2_source]):
            return Response(
                {'error': 'metric1, source1, metric2, and source2 parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        correlation = self._calculate_correlation(
            request.user,
            metric1_name,
            metric1_source,
            metric2_name,
            metric2_source,
            days
        )
        
        serializer = self.get_serializer(correlation)
        return Response(serializer.data)
    
    def _calculate_correlation(self, user, metric1_name, metric1_source, metric2_name, metric2_source, days):
        """Calculate correlation between two metrics"""
        import statistics
        from collections import defaultdict
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get data for metric 1
        data1 = self._get_metric_series(
            user, metric1_name, metric1_source, start_date, end_date
        )
        
        # Get data for metric 2
        data2 = self._get_metric_series(
            user, metric2_name, metric2_source, start_date, end_date
        )
        
        # Align data by date
        aligned_data = []
        for date in range(days):
            date_obj = end_date - timedelta(days=date)
            date_str = str(date_obj)
            if date_str in data1 and date_str in data2:
                aligned_data.append((float(data1[date_str]), float(data2[date_str])))
        
        aligned_data.reverse()
        
        # Calculate Pearson correlation coefficient
        if len(aligned_data) < 2:
            correlation_coefficient = 0
        else:
            try:
                x_values = [d[0] for d in aligned_data]
                y_values = [d[1] for d in aligned_data]
                
                n = len(x_values)
                sum_x = sum(x_values)
                sum_y = sum(y_values)
                sum_xy = sum(x * y for x, y in aligned_data)
                sum_x2 = sum(x ** 2 for x in x_values)
                sum_y2 = sum(y ** 2 for y in y_values)
                
                numerator = n * sum_xy - sum_x * sum_y
                denominator = ((n * sum_x2 - sum_x ** 2) * (n * sum_y2 - sum_y ** 2)) ** 0.5
                
                correlation_coefficient = numerator / denominator if denominator != 0 else 0
            except (ZeroDivisionError, ValueError):
                correlation_coefficient = 0
        
        # Determine strength
        coef = abs(correlation_coefficient)
        if coef >= 0.8:
            strength = 'very_strong_positive' if correlation_coefficient > 0 else 'very_strong_negative'
        elif coef >= 0.6:
            strength = 'strong_positive' if correlation_coefficient > 0 else 'strong_negative'
        elif coef >= 0.4:
            strength = 'moderate_positive' if correlation_coefficient > 0 else 'moderate_negative'
        elif coef >= 0.2:
            strength = 'weak_positive' if correlation_coefficient > 0 else 'weak_negative'
        else:
            strength = 'none'
        
        # Generate insights
        insights = {
            'sample_size': len(aligned_data),
            'interpretation': self._get_correlation_interpretation(correlation_coefficient),
        }
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            metric1_name, metric2_name, correlation_coefficient
        )
        
        return CorrelationAnalysis.objects.create(
            user=user,
            metric1_name=metric1_name,
            metric1_source=metric1_source,
            metric2_name=metric2_name,
            metric2_source=metric2_source,
            correlation_coefficient=Decimal(str(round(correlation_coefficient, 4))),
            correlation_strength=strength,
            sample_size=len(aligned_data),
            start_date=start_date,
            end_date=end_date,
            insights=insights,
            recommendations=recommendations,
        )
    
    def _get_metric_series(self, user, metric_name, data_source, start_date, end_date):
        """Get daily values for a metric"""
        series = {}
        
        if data_source == 'tasks' and metric_name == 'completed':
            from apps.tasks.models import Task
            tasks = Task.objects.filter(
                user=user,
                status='completed',
                completed_at__date__gte=start_date,
                completed_at__date__lte=end_date
            ).annotate(date=TruncDate('completed_at')).values('date').annotate(count=Count('id'))
            
            for task in tasks:
                series[str(task['date'])] = task['count']
        
        elif data_source == 'mood' and metric_name == 'average':
            from apps.mood.models import MoodEntry
            entries = MoodEntry.objects.filter(
                user=user,
                entry_date__gte=start_date,
                entry_date__lte=end_date
            ).annotate(date=TruncDate('entry_date')).values('date').annotate(avg=Avg('mood_value'))
            
            for entry in entries:
                series[str(entry['date'])] = float(entry['avg'])
        
        elif data_source == 'health_sleep' and metric_name == 'duration':
            try:
                from apps.health.models import SleepLog
                logs = SleepLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                ).values('date', 'total_hours')
                
                for log in logs:
                    series[str(log['date'])] = float(log['total_hours'] or 0)
            except ImportError:
                pass
        
        elif data_source == 'health_exercise' and metric_name == 'duration':
            try:
                from apps.health.models import ExerciseLog
                logs = ExerciseLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                ).annotate(date=TruncDate('date')).values('date').annotate(total=Sum('duration_minutes'))
                
                for log in logs:
                    series[str(log['date'])] = float(log['total'] or 0)
            except ImportError:
                pass
        
        return series
    
    def _get_correlation_interpretation(self, coefficient):
        """Get human-readable interpretation of correlation coefficient"""
        abs_coef = abs(coefficient)
        
        if abs_coef >= 0.8:
            return "Very strong relationship detected"
        elif abs_coef >= 0.6:
            return "Strong relationship detected"
        elif abs_coef >= 0.4:
            return "Moderate relationship detected"
        elif abs_coef >= 0.2:
            return "Weak relationship detected"
        else:
            return "No meaningful relationship detected"
    
    def _generate_recommendations(self, metric1_name, metric2_name, coefficient):
        """Generate recommendations based on correlation"""
        recommendations = []
        
        if abs(coefficient) >= 0.5:
            if coefficient > 0:
                recommendations.append(f"Improving {metric1_name} may positively impact {metric2_name}")
            else:
                recommendations.append(f"Higher {metric1_name} is associated with lower {metric2_name}")
        
        if abs(coefficient) >= 0.3:
            recommendations.append(f"Consider tracking both {metric1_name} and {metric2_name} together")
        
        return recommendations
