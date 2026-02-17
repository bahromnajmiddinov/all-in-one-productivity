import csv
import json
import io
from datetime import datetime, timedelta, date
from decimal import Decimal
from statistics import mean, stdev
from collections import defaultdict

from django.http import HttpResponse, JsonResponse
from django.db.models import Avg, Sum, Count, StdDev, Min, Max, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser

from .models import (
    CrossModuleCorrelation,
    AutomatedReport,
    TrendDetection,
    AnomalyDetection,
    GoalProgress,
    PredictiveForecast,
    PeriodComparison,
    CustomReport,
    AchievementBadge,
    UserAchievement,
    AnalyticsExport,
    AnalyticsInsight,
    UserAnalyticsProfile,
)
from .serializers import (
    CrossModuleCorrelationSerializer,
    AutomatedReportListSerializer,
    AutomatedReportDetailSerializer,
    TrendDetectionSerializer,
    AnomalyDetectionSerializer,
    GoalProgressSerializer,
    PredictiveForecastSerializer,
    PeriodComparisonSerializer,
    CustomReportSerializer,
    AchievementBadgeSerializer,
    UserAchievementSerializer,
    UserAchievementProgressSerializer,
    AnalyticsExportSerializer,
    AnalyticsExportCreateSerializer,
    AnalyticsInsightSerializer,
    UserAnalyticsProfileSerializer,
    DashboardSummarySerializer,
    CrossModuleAnalysisRequestSerializer,
    GenerateReportRequestSerializer,
    PeriodComparisonRequestSerializer,
    ForecastRequestSerializer,
)


class CrossModuleCorrelationViewSet(viewsets.ReadOnlyModelViewSet):
    """AI-powered cross-module correlation analysis"""
    permission_classes = [IsAuthenticated]
    serializer_class = CrossModuleCorrelationSerializer
    
    def get_queryset(self):
        return CrossModuleCorrelation.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """Run cross-module correlation analysis"""
        serializer = CrossModuleAnalysisRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        modules = serializer.validated_data.get('modules', [])
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        min_correlation = serializer.validated_data.get('min_correlation', 0.3)
        
        if not start_date:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=30)
        
        # Get all available metrics
        metrics_data = self._collect_metrics(request.user, modules, start_date, end_date)
        
        # Calculate correlations
        correlations = []
        sources = list(metrics_data.keys())
        
        for i, source in enumerate(sources):
            for target in sources[i+1:]:
                correlation = self._calculate_correlation(
                    metrics_data[source],
                    metrics_data[target],
                    start_date,
                    end_date
                )
                
                if abs(correlation['coefficient']) >= min_correlation:
                    corr_obj, created = CrossModuleCorrelation.objects.update_or_create(
                        user=request.user,
                        source_module=source['module'],
                        source_metric=source['metric'],
                        target_module=target['module'],
                        target_metric=target['metric'],
                        start_date=start_date,
                        end_date=end_date,
                        defaults={
                            'correlation_coefficient': correlation['coefficient'],
                            'correlation_strength': correlation['strength'],
                            'confidence_score': correlation['confidence'],
                            'sample_size': correlation['sample_size'],
                            'status': 'completed',
                            'insight_title': correlation['insight_title'],
                            'insight_description': correlation['insight_description'],
                            'action_recommendations': correlation['recommendations'],
                        }
                    )
                    correlations.append(corr_obj)
        
        return Response({
            'correlations_found': len(correlations),
            'correlations': CrossModuleCorrelationSerializer(correlations, many=True).data
        })
    
    def _collect_metrics(self, user, modules, start_date, end_date):
        """Collect metrics data from all modules"""
        metrics = {}
        
        # Mood metrics
        if not modules or 'mood' in modules:
            try:
                from apps.mood.models import MoodEntry
                mood_data = defaultdict(list)
                entries = MoodEntry.objects.filter(
                    user=user,
                    entry_date__gte=start_date,
                    entry_date__lte=end_date
                )
                for entry in entries:
                    mood_data[str(entry.entry_date)].append(entry.mood_value)
                
                metrics[('mood', 'average')] = {
                    date: mean(values) for date, values in mood_data.items()
                }
            except ImportError:
                pass
        
        # Sleep metrics
        if not modules or 'sleep' in modules:
            try:
                from apps.health.models import SleepLog
                sleep_data = {}
                logs = SleepLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                )
                for log in logs:
                    sleep_data[str(log.date)] = log.duration_minutes / 60  # hours
                
                metrics[('sleep', 'duration')] = sleep_data
                
                # Sleep quality
                quality_data = {}
                for log in logs:
                    quality_data[str(log.date)] = log.quality
                metrics[('sleep', 'quality')] = quality_data
            except ImportError:
                pass
        
        # Exercise metrics
        if not modules or 'exercise' in modules:
            try:
                from apps.health.models import WorkoutLog
                exercise_data = defaultdict(int)
                logs = WorkoutLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                )
                for log in logs:
                    exercise_data[str(log.date)] += log.duration_minutes or 0
                
                metrics[('exercise', 'duration')] = dict(exercise_data)
            except ImportError:
                pass
        
        # Task metrics
        if not modules or 'tasks' in modules:
            try:
                from apps.tasks.models import Task
                completed_data = defaultdict(int)
                tasks = Task.objects.filter(
                    user=user,
                    status='completed',
                    completed_at__date__gte=start_date,
                    completed_at__date__lte=end_date
                )
                for task in tasks:
                    date_str = str(task.completed_at.date())
                    completed_data[date_str] += 1
                
                metrics[('tasks', 'completed')] = dict(completed_data)
            except ImportError:
                pass
        
        # Habit metrics
        if not modules or 'habits' in modules:
            try:
                from apps.habits.models import HabitCompletion
                habit_data = defaultdict(int)
                completions = HabitCompletion.objects.filter(
                    habit__user=user,
                    date__gte=start_date,
                    date__lte=end_date,
                    completed=True
                )
                for completion in completions:
                    habit_data[str(completion.date)] += 1
                
                metrics[('habits', 'completions')] = dict(habit_data)
            except ImportError:
                pass
        
        # Pomodoro metrics
        if not modules or 'pomodoro' in modules:
            try:
                from apps.pomodoro.models import PomodoroSession
                pomodoro_data = defaultdict(int)
                sessions = PomodoroSession.objects.filter(
                    user=user,
                    started_at__date__gte=start_date,
                    started_at__date__lte=end_date,
                    completed=True
                )
                for session in sessions:
                    date_str = str(session.started_at.date())
                    pomodoro_data[date_str] += session.duration
                
                metrics[('pomodoro', 'focus_minutes')] = dict(pomodoro_data)
            except ImportError:
                pass
        
        # Journal metrics
        if not modules or 'journal' in modules:
            try:
                from apps.journal.models import JournalEntry
                journal_data = defaultdict(int)
                entries = JournalEntry.objects.filter(
                    user=user,
                    entry_date__gte=start_date,
                    entry_date__lte=end_date
                )
                for entry in entries:
                    journal_data[str(entry.entry_date)] = entry.word_count
                
                metrics[('journal', 'word_count')] = dict(journal_data)
            except ImportError:
                pass
        
        return metrics
    
    def _calculate_correlation(self, data1, data2, start_date, end_date):
        """Calculate Pearson correlation between two datasets"""
        # Align data by date
        aligned = []
        current = start_date
        while current <= end_date:
            date_str = str(current)
            if date_str in data1 and date_str in data2:
                aligned.append((float(data1[date_str]), float(data2[date_str])))
            current += timedelta(days=1)
        
        n = len(aligned)
        if n < 3:
            return {
                'coefficient': 0,
                'strength': 'none',
                'confidence': 0,
                'sample_size': n,
                'insight_title': 'Insufficient Data',
                'insight_description': 'Not enough overlapping data points to calculate correlation.',
                'recommendations': ['Continue tracking both metrics daily.']
            }
        
        # Calculate Pearson correlation
        x_vals = [p[0] for p in aligned]
        y_vals = [p[1] for p in aligned]
        
        mean_x = sum(x_vals) / n
        mean_y = sum(y_vals) / n
        
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in aligned)
        denom_x = sum((x - mean_x) ** 2 for x in x_vals) ** 0.5
        denom_y = sum((y - mean_y) ** 2 for y in y_vals) ** 0.5
        
        if denom_x == 0 or denom_y == 0:
            coefficient = 0
        else:
            coefficient = numerator / (denom_x * denom_y)
        
        # Determine strength
        abs_coef = abs(coefficient)
        if abs_coef >= 0.8:
            strength = 'very_strong_positive' if coefficient > 0 else 'very_strong_negative'
        elif abs_coef >= 0.6:
            strength = 'strong_positive' if coefficient > 0 else 'strong_negative'
        elif abs_coef >= 0.4:
            strength = 'moderate_positive' if coefficient > 0 else 'moderate_negative'
        elif abs_coef >= 0.2:
            strength = 'weak_positive' if coefficient > 0 else 'weak_negative'
        else:
            strength = 'none'
        
        # Generate insights
        if abs_coef >= 0.5:
            insight_title = f"{'Positive' if coefficient > 0 else 'Negative'} Correlation Detected"
            insight_description = f"A {'strong' if abs_coef >= 0.7 else 'moderate'} relationship was found between these metrics."
            recommendations = [
                f"Consider how changes in one metric affect the other.",
                f"Track both metrics together for better insights."
            ]
        else:
            insight_title = "Weak or No Correlation"
            insight_description = "These metrics don't show a strong relationship in the analyzed period."
            recommendations = ["Continue tracking to see if patterns emerge over time."]
        
        return {
            'coefficient': Decimal(str(round(coefficient, 4))),
            'strength': strength,
            'confidence': Decimal(str(min(1.0, n / 30))),  # Higher confidence with more data
            'sample_size': n,
            'insight_title': insight_title,
            'insight_description': insight_description,
            'recommendations': recommendations,
        }
    
    @action(detail=False, methods=['get'])
    def top_correlations(self, request):
        """Get top correlations by strength"""
        min_strength = request.query_params.get('min_strength', 'moderate')
        
        strength_order = {
            'very_strong_positive': 8,
            'strong_positive': 7,
            'moderate_positive': 6,
            'weak_positive': 5,
            'none': 4,
            'weak_negative': 3,
            'moderate_negative': 2,
            'strong_negative': 1,
            'very_strong_negative': 0,
        }
        
        min_value = strength_order.get(min_strength, 6)
        
        correlations = CrossModuleCorrelation.objects.filter(
            user=request.user,
            status='completed'
        ).exclude(
            correlation_strength='none'
        )
        
        # Filter by strength
        filtered = [c for c in correlations if strength_order.get(c.correlation_strength, 4) >= min_value]
        filtered.sort(key=lambda x: abs(float(x.correlation_coefficient)), reverse=True)
        
        return Response({
            'count': len(filtered),
            'correlations': CrossModuleCorrelationSerializer(filtered[:20], many=True).data
        })


class AutomatedReportViewSet(viewsets.ReadOnlyModelViewSet):
    """Weekly/Monthly automated reports"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AutomatedReport.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AutomatedReportListSerializer
        return AutomatedReportDetailSerializer
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new automated report"""
        serializer = GenerateReportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        report_type = serializer.validated_data['report_type']
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        modules = serializer.validated_data.get('modules', [])
        
        # Calculate date range
        today = timezone.now().date()
        if not end_date:
            end_date = today
        
        if not start_date:
            if report_type == 'weekly':
                start_date = end_date - timedelta(days=7)
            elif report_type == 'monthly':
                start_date = end_date - timedelta(days=30)
            elif report_type == 'quarterly':
                start_date = end_date - timedelta(days=90)
            else:
                start_date = end_date - timedelta(days=30)
        
        report = self._generate_report(request.user, report_type, start_date, end_date, modules)
        
        return Response(
            AutomatedReportDetailSerializer(report).data,
            status=status.HTTP_201_CREATED
        )
    
    def _generate_report(self, user, report_type, start_date, end_date, modules):
        """Generate comprehensive report"""
        report = AutomatedReport.objects.create(
            user=user,
            report_type=report_type,
            title=f"{report_type.title()} Report: {start_date} to {end_date}",
            start_date=start_date,
            end_date=end_date,
            status='generating'
        )
        
        module_summaries = {}
        improving = []
        declining = []
        stable = []
        
        # Collect data from each module
        all_modules = modules or ['tasks', 'habits', 'mood', 'sleep', 'exercise', 'journal', 'finance']
        
        for module in all_modules:
            summary = self._get_module_summary(user, module, start_date, end_date)
            if summary:
                module_summaries[module] = summary
                
                # Categorize trends
                for metric in summary.get('metrics', []):
                    trend = metric.get('trend')
                    if trend == 'improving':
                        improving.append({
                            'module': module,
                            'metric': metric['name'],
                            'change': metric['change_percentage']
                        })
                    elif trend == 'declining':
                        declining.append({
                            'module': module,
                            'metric': metric['name'],
                            'change': metric['change_percentage']
                        })
                    else:
                        stable.append({
                            'module': module,
                            'metric': metric['name']
                        })
        
        # Generate highlights and lowlights
        highlights = sorted(improving, key=lambda x: x['change'], reverse=True)[:5]
        lowlights = sorted(declining, key=lambda x: x['change'])[:5]
        
        # Generate summary text
        summary_text = self._generate_summary_text(report_type, highlights, lowlights, module_summaries)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(improving, declining, module_summaries)
        
        # Update report
        report.module_summaries = module_summaries
        report.improving_metrics = improving
        report.declining_metrics = declining
        report.stable_metrics = stable
        report.key_highlights = highlights
        report.key_lowlights = lowlights
        report.summary_text = summary_text
        report.recommendations = recommendations
        report.status = 'ready'
        report.generated_at = timezone.now()
        report.save()
        
        return report
    
    def _get_module_summary(self, user, module, start_date, end_date):
        """Get summary for a specific module"""
        summary = {'module': module, 'metrics': []}
        
        if module == 'tasks':
            try:
                from apps.tasks.models import Task
                created = Task.objects.filter(
                    user=user,
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                ).count()
                completed = Task.objects.filter(
                    user=user,
                    status='completed',
                    completed_at__date__gte=start_date,
                    completed_at__date__lte=end_date
                ).count()
                summary['metrics'] = [
                    {'name': 'tasks_created', 'value': created},
                    {'name': 'tasks_completed', 'value': completed},
                ]
            except ImportError:
                pass
        
        elif module == 'habits':
            try:
                from apps.habits.models import HabitCompletion
                completions = HabitCompletion.objects.filter(
                    habit__user=user,
                    date__gte=start_date,
                    date__lte=end_date,
                    completed=True
                ).count()
                summary['metrics'] = [
                    {'name': 'habit_completions', 'value': completions},
                ]
            except ImportError:
                pass
        
        elif module == 'mood':
            try:
                from apps.mood.models import MoodEntry
                avg_mood = MoodEntry.objects.filter(
                    user=user,
                    entry_date__gte=start_date,
                    entry_date__lte=end_date
                ).aggregate(avg=Avg('mood_value'))['avg']
                summary['metrics'] = [
                    {'name': 'average_mood', 'value': round(avg_mood, 2) if avg_mood else None},
                ]
            except ImportError:
                pass
        
        elif module == 'sleep':
            try:
                from apps.health.models import SleepLog
                avg_duration = SleepLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                ).aggregate(avg=Avg('duration_minutes'))['avg']
                summary['metrics'] = [
                    {'name': 'average_sleep_hours', 'value': round(avg_duration / 60, 1) if avg_duration else None},
                ]
            except ImportError:
                pass
        
        elif module == 'exercise':
            try:
                from apps.health.models import WorkoutLog
                total_minutes = WorkoutLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                ).aggregate(total=Sum('duration_minutes'))['total']
                summary['metrics'] = [
                    {'name': 'total_exercise_minutes', 'value': total_minutes or 0},
                ]
            except ImportError:
                pass
        
        return summary if summary['metrics'] else None
    
    def _generate_summary_text(self, report_type, highlights, lowlights, module_summaries):
        """Generate human-readable summary"""
        parts = []
        
        if highlights:
            parts.append(f"Great progress! Your {highlights[0]['metric']} improved by {highlights[0]['change']:.1f}%.")
        
        if lowlights:
            parts.append(f"Watch out: {lowlights[0]['metric']} declined by {abs(lowlights[0]['change']):.1f}%.")
        
        active_modules = len(module_summaries)
        parts.append(f"You were active in {active_modules} different areas this period.")
        
        return " ".join(parts)
    
    def _generate_recommendations(self, improving, declining, module_summaries):
        """Generate personalized recommendations"""
        recommendations = []
        
        if declining:
            for item in declining[:3]:
                recommendations.append(f"Focus on improving your {item['metric']} in {item['module']}.")
        
        if not any(m['module'] == 'sleep' for m in improving + declining):
            recommendations.append("Consider tracking your sleep more consistently for better insights.")
        
        if len(module_summaries) < 3:
            recommendations.append("Try exploring more modules to get a fuller picture of your wellbeing.")
        
        return recommendations
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark report as read"""
        report = self.get_object()
        report.is_read = True
        report.save()
        return Response({'status': 'marked as read'})


class TrendDetectionViewSet(viewsets.ReadOnlyModelViewSet):
    """Trend detection across metrics"""
    permission_classes = [IsAuthenticated]
    serializer_class = TrendDetectionSerializer
    
    def get_queryset(self):
        return TrendDetection.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def detect(self, request):
        """Detect trends for specified metrics"""
        module = request.query_params.get('module')
        period = request.query_params.get('period', '30d')
        
        # Calculate date range
        end_date = timezone.now().date()
        days = int(period.replace('d', '').replace('m', '0'))
        if 'm' in period:
            days = days * 30
        start_date = end_date - timedelta(days=days)
        
        trends = []
        
        # Detect trends for each metric
        modules_to_check = [module] if module else ['tasks', 'habits', 'mood', 'sleep', 'exercise']
        
        for mod in modules_to_check:
            module_trends = self._detect_module_trends(request.user, mod, start_date, end_date, period)
            trends.extend(module_trends)
        
        # Sort by significance
        trends.sort(key=lambda x: (x.is_significant, abs(float(x.change_percentage or 0))), reverse=True)
        
        return Response({
            'trends_found': len(trends),
            'trends': TrendDetectionSerializer(trends, many=True).data
        })
    
    def _detect_module_trends(self, user, module, start_date, end_date, period):
        """Detect trends for a specific module"""
        trends = []
        
        if module == 'mood':
            try:
                from apps.mood.models import MoodEntry
                entries = MoodEntry.objects.filter(
                    user=user,
                    entry_date__gte=start_date,
                    entry_date__lte=end_date
                ).order_by('entry_date')
                
                if entries.count() >= 5:
                    # Split into first and second half
                    mid_point = entries.count() // 2
                    first_half = entries[:mid_point]
                    second_half = entries[mid_point:]
                    
                    first_avg = sum(e.mood_value for e in first_half) / len(first_half)
                    second_avg = sum(e.mood_value for e in second_half) / len(second_half)
                    
                    change_pct = ((second_avg - first_avg) / first_avg * 100) if first_avg else 0
                    
                    direction = 'stable'
                    if change_pct > 5:
                        direction = 'improving'
                    elif change_pct < -5:
                        direction = 'declining'
                    
                    trend = TrendDetection.objects.create(
                        user=user,
                        module='mood',
                        metric_name='average_mood',
                        metric_display_name='Average Mood',
                        trend_direction=direction,
                        trend_period=period,
                        start_value=Decimal(str(first_avg)),
                        end_value=Decimal(str(second_avg)),
                        change_absolute=Decimal(str(second_avg - first_avg)),
                        change_percentage=Decimal(str(change_pct)),
                        confidence_score=Decimal('0.7'),
                        start_date=start_date,
                        end_date=end_date,
                        is_significant=abs(change_pct) > 10,
                    )
                    trends.append(trend)
            except ImportError:
                pass
        
        elif module == 'sleep':
            try:
                from apps.health.models import SleepLog
                logs = SleepLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                ).order_by('date')
                
                if logs.count() >= 5:
                    mid_point = logs.count() // 2
                    first_half = logs[:mid_point]
                    second_half = logs[mid_point:]
                    
                    first_avg = sum(l.duration_minutes for l in first_half) / len(first_half)
                    second_avg = sum(l.duration_minutes for l in second_half) / len(second_half)
                    
                    change_pct = ((second_avg - first_avg) / first_avg * 100) if first_avg else 0
                    
                    direction = 'stable'
                    if change_pct > 5:
                        direction = 'improving'
                    elif change_pct < -5:
                        direction = 'declining'
                    
                    trend = TrendDetection.objects.create(
                        user=user,
                        module='sleep',
                        metric_name='sleep_duration',
                        metric_display_name='Sleep Duration',
                        trend_direction=direction,
                        trend_period=period,
                        start_value=Decimal(str(first_avg / 60)),
                        end_value=Decimal(str(second_avg / 60)),
                        change_absolute=Decimal(str((second_avg - first_avg) / 60)),
                        change_percentage=Decimal(str(change_pct)),
                        confidence_score=Decimal('0.7'),
                        start_date=start_date,
                        end_date=end_date,
                        is_significant=abs(change_pct) > 10,
                    )
                    trends.append(trend)
            except ImportError:
                pass
        
        return trends
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge a trend"""
        trend = self.get_object()
        trend.is_acknowledged = True
        trend.save()
        return Response({'status': 'acknowledged'})


class AnomalyDetectionViewSet(viewsets.ReadOnlyModelViewSet):
    """Anomaly detection alerts"""
    permission_classes = [IsAuthenticated]
    serializer_class = AnomalyDetectionSerializer
    
    def get_queryset(self):
        return AnomalyDetection.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def scan(self, request):
        """Run anomaly detection scan"""
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        anomalies = []
        
        # Scan each module
        anomalies.extend(self._scan_mood_anomalies(request.user, start_date, end_date))
        anomalies.extend(self._scan_sleep_anomalies(request.user, start_date, end_date))
        anomalies.extend(self._scan_task_anomalies(request.user, start_date, end_date))
        
        return Response({
            'anomalies_found': len(anomalies),
            'anomalies': AnomalyDetectionSerializer(anomalies, many=True).data
        })
    
    def _scan_mood_anomalies(self, user, start_date, end_date):
        """Scan for mood anomalies"""
        anomalies = []
        try:
            from apps.mood.models import MoodEntry
            entries = MoodEntry.objects.filter(
                user=user,
                entry_date__gte=start_date,
                entry_date__lte=end_date
            ).order_by('entry_date')
            
            if entries.count() >= 7:
                values = [e.mood_value for e in entries]
                avg = mean(values)
                std = stdev(values) if len(values) > 1 else 1
                
                for entry in entries:
                    z_score = (entry.mood_value - avg) / std if std > 0 else 0
                    
                    if abs(z_score) > 2:  # More than 2 standard deviations
                        anomaly_type = 'spike' if z_score > 0 else 'drop'
                        severity = 'high' if abs(z_score) > 3 else 'medium'
                        
                        anomaly, created = AnomalyDetection.objects.get_or_create(
                            user=user,
                            module='mood',
                            metric_name='mood_rating',
                            detected_date=entry.entry_date,
                            defaults={
                                'anomaly_type': anomaly_type,
                                'severity': severity,
                                'expected_value': Decimal(str(avg)),
                                'actual_value': Decimal(str(entry.mood_value)),
                                'deviation_percentage': Decimal(str(z_score * 10)),
                                'baseline_average': Decimal(str(avg)),
                                'baseline_std_dev': Decimal(str(std)),
                                'title': f"Unusual {'High' if z_score > 0 else 'Low'} Mood",
                                'description': f"Your mood rating was {entry.mood_value}, which is unusual compared to your average of {avg:.1f}.",
                            }
                        )
                        if created:
                            anomalies.append(anomaly)
        except ImportError:
            pass
        
        return anomalies
    
    def _scan_sleep_anomalies(self, user, start_date, end_date):
        """Scan for sleep anomalies"""
        anomalies = []
        try:
            from apps.health.models import SleepLog
            logs = SleepLog.objects.filter(
                user=user,
                date__gte=start_date,
                date__lte=end_date
            ).order_by('date')
            
            if logs.count() >= 7:
                durations = [l.duration_minutes for l in logs]
                avg = mean(durations)
                std = stdev(durations) if len(durations) > 1 else 1
                
                for log in logs:
                    z_score = (log.duration_minutes - avg) / std if std > 0 else 0
                    
                    if abs(z_score) > 2:
                        anomaly_type = 'outlier'
                        severity = 'medium'
                        
                        anomaly, created = AnomalyDetection.objects.get_or_create(
                            user=user,
                            module='sleep',
                            metric_name='sleep_duration',
                            detected_date=log.date,
                            defaults={
                                'anomaly_type': anomaly_type,
                                'severity': severity,
                                'expected_value': Decimal(str(avg)),
                                'actual_value': Decimal(str(log.duration_minutes)),
                                'deviation_percentage': Decimal(str(z_score * 10)),
                                'baseline_average': Decimal(str(avg)),
                                'baseline_std_dev': Decimal(str(std)),
                                'title': f"Unusual Sleep Duration",
                                'description': f"You slept {log.duration_minutes / 60:.1f} hours, which differs from your average of {avg / 60:.1f} hours.",
                            }
                        )
                        if created:
                            anomalies.append(anomaly)
        except ImportError:
            pass
        
        return anomalies
    
    def _scan_task_anomalies(self, user, start_date, end_date):
        """Scan for task completion anomalies"""
        anomalies = []
        try:
            from apps.tasks.models import Task
            
            # Check for unusually low completion days
            daily_completions = defaultdict(int)
            tasks = Task.objects.filter(
                user=user,
                status='completed',
                completed_at__date__gte=start_date,
                completed_at__date__lte=end_date
            )
            
            for task in tasks:
                daily_completions[task.completed_at.date()] += 1
            
            if len(daily_completions) >= 7:
                values = list(daily_completions.values())
                avg = mean(values)
                std = stdev(values) if len(values) > 1 else 1
                
                for date_val, count in daily_completions.items():
                    z_score = (count - avg) / std if std > 0 else 0
                    
                    if z_score > 2:
                        anomaly, created = AnomalyDetection.objects.get_or_create(
                            user=user,
                            module='tasks',
                            metric_name='tasks_completed',
                            detected_date=date_val,
                            defaults={
                                'anomaly_type': 'spike',
                                'severity': 'low',
                                'expected_value': Decimal(str(avg)),
                                'actual_value': Decimal(str(count)),
                                'deviation_percentage': Decimal(str(z_score * 10)),
                                'baseline_average': Decimal(str(avg)),
                                'baseline_std_dev': Decimal(str(std)),
                                'title': 'High Productivity Day',
                                'description': f"You completed {count} tasks, which is above your average of {avg:.1f}.",
                            }
                        )
                        if created:
                            anomalies.append(anomaly)
        except ImportError:
            pass
        
        return anomalies
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an anomaly"""
        anomaly = self.get_object()
        anomaly.is_dismissed = True
        anomaly.dismissed_at = timezone.now()
        anomaly.save()
        return Response({'status': 'dismissed'})
    
    @action(detail=True, methods=['post'])
    def investigate(self, request, pk=None):
        """Mark anomaly as investigated"""
        anomaly = self.get_object()
        anomaly.is_investigated = True
        anomaly.save()
        return Response({'status': 'marked as investigated'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get anomaly statistics"""
        total = AnomalyDetection.objects.filter(user=request.user).count()
        unread = AnomalyDetection.objects.filter(user=request.user, is_read=False).count()
        by_severity = AnomalyDetection.objects.filter(user=request.user).values('severity').annotate(count=Count('id'))
        
        return Response({
            'total_anomalies': total,
            'unread_count': unread,
            'by_severity': {item['severity']: item['count'] for item in by_severity}
        })


class GoalProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """Unified goal progress dashboard"""
    permission_classes = [IsAuthenticated]
    serializer_class = GoalProgressSerializer
    
    def get_queryset(self):
        return GoalProgress.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def sync(self, request):
        """Sync goals from all modules"""
        self._sync_sleep_goals(request.user)
        self._sync_fitness_goals(request.user)
        self._sync_finance_goals(request.user)
        
        goals = GoalProgress.objects.filter(user=request.user)
        return Response({
            'synced_goals': goals.count(),
            'goals': GoalProgressSerializer(goals, many=True).data
        })
    
    def _sync_sleep_goals(self, user):
        """Sync sleep goals from health module"""
        try:
            from apps.health.models import SleepGoal, SleepLog
            sleep_goal = SleepGoal.objects.filter(user=user).first()
            
            if sleep_goal:
                recent_logs = SleepLog.objects.filter(
                    user=user,
                    date__gte=timezone.now().date() - timedelta(days=7)
                )
                avg_duration = recent_logs.aggregate(avg=Avg('duration_minutes'))['avg'] or 0
                
                GoalProgress.objects.update_or_create(
                    user=user,
                    source_module='sleep',
                    source_goal_id=str(sleep_goal.id),
                    defaults={
                        'goal_name': 'Sleep Duration Goal',
                        'goal_description': f'Maintain {sleep_goal.target_duration_minutes / 60:.1f} hours of sleep',
                        'target_value': Decimal(str(sleep_goal.target_duration_minutes)),
                        'current_value': Decimal(str(avg_duration)),
                        'progress_percentage': min(Decimal('100'), Decimal(avg_duration) / Decimal(sleep_goal.target_duration_minutes) * 100),
                        'unit': 'minutes',
                        'start_date': timezone.now().date() - timedelta(days=30),
                        'status': 'in_progress',
                    }
                )
        except ImportError:
            pass
    
    def _sync_fitness_goals(self, user):
        """Sync fitness goals from health module"""
        try:
            from apps.health.models import FitnessGoal
            goals = FitnessGoal.objects.filter(user=user, is_active=True)
            
            for goal in goals:
                progress = (goal.current_value or 0) / goal.target_amount * 100 if goal.target_amount else 0
                
                GoalProgress.objects.update_or_create(
                    user=user,
                    source_module='fitness',
                    source_goal_id=str(goal.id),
                    defaults={
                        'goal_name': goal.title,
                        'goal_description': goal.description,
                        'target_value': goal.target_amount,
                        'current_value': goal.current_value,
                        'progress_percentage': min(Decimal('100'), Decimal(str(progress))),
                        'unit': goal.unit or '',
                        'start_date': goal.start_date,
                        'target_date': goal.target_date,
                        'status': goal.status,
                    }
                )
        except ImportError:
            pass
    
    def _sync_finance_goals(self, user):
        """Sync finance goals"""
        try:
            from apps.finance.models import Goal
            goals = Goal.objects.filter(user=user)
            
            for goal in goals:
                progress = goal.current_amount / goal.target_amount * 100 if goal.target_amount else 0
                
                GoalProgress.objects.update_or_create(
                    user=user,
                    source_module='finance',
                    source_goal_id=str(goal.id),
                    defaults={
                        'goal_name': goal.name,
                        'target_value': goal.target_amount,
                        'current_value': goal.current_amount,
                        'progress_percentage': min(Decimal('100'), Decimal(str(progress))),
                        'unit': 'USD',
                        'status': 'completed' if progress >= 100 else 'in_progress',
                    }
                )
        except ImportError:
            pass
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get goal progress summary"""
        goals = GoalProgress.objects.filter(user=request.user)
        
        total = goals.count()
        completed = goals.filter(status='completed').count()
        at_risk = goals.filter(status='at_risk').count()
        
        avg_progress = goals.aggregate(avg=Avg('progress_percentage'))['avg'] or 0
        
        by_module = goals.values('source_module').annotate(
            count=Count('id'),
            avg_progress=Avg('progress_percentage')
        )
        
        return Response({
            'total_goals': total,
            'completed_goals': completed,
            'at_risk_goals': at_risk,
            'average_progress': round(float(avg_progress), 2),
            'by_module': list(by_module)
        })


class PredictiveForecastViewSet(viewsets.ReadOnlyModelViewSet):
    """Predictive analytics forecasts"""
    permission_classes = [IsAuthenticated]
    serializer_class = PredictiveForecastSerializer
    
    def get_queryset(self):
        return PredictiveForecast.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a predictive forecast"""
        serializer = ForecastRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        module = serializer.validated_data['module']
        metric = serializer.validated_data['metric']
        period = serializer.validated_data['period']
        
        # Calculate forecast dates
        today = timezone.now().date()
        days_map = {'7d': 7, '30d': 30, '90d': 90, '6m': 180}
        forecast_days = days_map.get(period, 30)
        
        # Get historical data
        historical = self._get_historical_data(request.user, module, metric, 60)
        
        if len(historical) < 7:
            return Response(
                {'error': 'Insufficient historical data for forecasting'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simple linear trend forecast
        forecast_values = self._generate_forecast(historical, forecast_days)
        
        # Calculate trend direction
        first_val = historical[0]['value'] if historical else 0
        last_val = historical[-1]['value'] if historical else 0
        forecast_last = forecast_values[-1]['predicted_value'] if forecast_values else 0
        
        if forecast_last > last_val * 1.05:
            trend_direction = 'increasing'
        elif forecast_last < last_val * 0.95:
            trend_direction = 'decreasing'
        else:
            trend_direction = 'stable'
        
        # Calculate historical stats
        values = [h['value'] for h in historical]
        historical_avg = mean(values)
        historical_trend = (last_val - first_val) / len(historical) if len(historical) > 1 else 0
        
        forecast = PredictiveForecast.objects.create(
            user=request.user,
            module=module,
            metric_name=metric,
            forecast_period=period,
            forecast_values=forecast_values,
            trend_direction=trend_direction,
            model_accuracy=Decimal('0.75'),  # Placeholder
            confidence_score=Decimal('0.7'),
            historical_average=Decimal(str(historical_avg)),
            historical_trend=Decimal(str(historical_trend)),
            forecast_start_date=today,
            forecast_end_date=today + timedelta(days=forecast_days),
            expires_at=timezone.now() + timedelta(days=7),
            status='ready',
            insight_summary=f"Based on your historical data, your {metric} shows a {trend_direction} trend.",
        )
        
        return Response(PredictiveForecastSerializer(forecast).data)
    
    def _get_historical_data(self, user, module, metric, days):
        """Get historical data for forecasting"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        data = []
        
        if module == 'mood' and metric == 'average':
            try:
                from apps.mood.models import MoodEntry
                entries = MoodEntry.objects.filter(
                    user=user,
                    entry_date__gte=start_date,
                    entry_date__lte=end_date
                ).order_by('entry_date')
                
                for entry in entries:
                    data.append({
                        'date': str(entry.entry_date),
                        'value': entry.mood_value
                    })
            except ImportError:
                pass
        
        elif module == 'sleep' and metric == 'duration':
            try:
                from apps.health.models import SleepLog
                logs = SleepLog.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                ).order_by('date')
                
                for log in logs:
                    data.append({
                        'date': str(log.date),
                        'value': log.duration_minutes / 60
                    })
            except ImportError:
                pass
        
        return data
    
    def _generate_forecast(self, historical, forecast_days):
        """Generate forecast values using simple linear regression"""
        if not historical:
            return []
        
        n = len(historical)
        x_vals = list(range(n))
        y_vals = [h['value'] for h in historical]
        
        # Calculate slope and intercept
        mean_x = sum(x_vals) / n
        mean_y = sum(y_vals) / n
        
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_vals, y_vals))
        denominator = sum((x - mean_x) ** 2 for x in x_vals)
        
        slope = numerator / denominator if denominator != 0 else 0
        intercept = mean_y - slope * mean_x
        
        # Generate forecasts
        forecasts = []
        today = timezone.now().date()
        
        for i in range(forecast_days):
            x = n + i
            predicted = slope * x + intercept
            
            # Calculate confidence interval (simple approach)
            std_error = 0.1 * predicted  # 10% margin
            
            forecasts.append({
                'date': str(today + timedelta(days=i + 1)),
                'predicted_value': round(predicted, 2),
                'confidence_low': round(predicted - std_error, 2),
                'confidence_high': round(predicted + std_error, 2),
            })
        
        return forecasts


class PeriodComparisonViewSet(viewsets.ModelViewSet):
    """Compare any two time periods"""
    permission_classes = [IsAuthenticated]
    serializer_class = PeriodComparisonSerializer
    
    def get_queryset(self):
        return PeriodComparison.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def compare(self, request):
        """Create a new period comparison"""
        serializer = PeriodComparisonRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        p1_start = serializer.validated_data['period1_start']
        p1_end = serializer.validated_data['period1_end']
        p1_label = serializer.validated_data.get('period1_label', 'Period 1')
        p2_start = serializer.validated_data['period2_start']
        p2_end = serializer.validated_data['period2_end']
        p2_label = serializer.validated_data.get('period2_label', 'Period 2')
        metrics = serializer.validated_data.get('metrics', [])
        
        # Calculate comparison data
        comparison_data = self._calculate_comparison(
            request.user,
            (p1_start, p1_end),
            (p2_start, p2_end),
            metrics
        )
        
        comparison = PeriodComparison.objects.create(
            user=request.user,
            name=f"{p1_label} vs {p2_label}",
            period1_start=p1_start,
            period1_end=p1_end,
            period1_label=p1_label,
            period2_start=p2_start,
            period2_end=p2_end,
            period2_label=p2_label,
            comparison_data=comparison_data['data'],
            overall_winner=comparison_data['winner'],
            key_differences=comparison_data['key_differences'],
        )
        
        return Response(PeriodComparisonSerializer(comparison).data, status=status.HTTP_201_CREATED)
    
    def _calculate_comparison(self, user, period1, period2, metrics):
        """Calculate comparison between two periods"""
        data = {}
        p1_start, p1_end = period1
        p2_start, p2_end = period2
        
        # Compare tasks
        try:
            from apps.tasks.models import Task
            p1_completed = Task.objects.filter(
                user=user,
                status='completed',
                completed_at__date__gte=p1_start,
                completed_at__date__lte=p1_end
            ).count()
            p2_completed = Task.objects.filter(
                user=user,
                status='completed',
                completed_at__date__gte=p2_start,
                completed_at__date__lte=p2_end
            ).count()
            
            data['tasks'] = {
                'completed': {
                    'period1': p1_completed,
                    'period2': p2_completed,
                    'difference': p1_completed - p2_completed,
                    'change_percentage': round((p1_completed - p2_completed) / p2_completed * 100, 1) if p2_completed else 0
                }
            }
        except ImportError:
            pass
        
        # Compare mood
        try:
            from apps.mood.models import MoodEntry
            p1_avg = MoodEntry.objects.filter(
                user=user,
                entry_date__gte=p1_start,
                entry_date__lte=p1_end
            ).aggregate(avg=Avg('mood_value'))['avg']
            p2_avg = MoodEntry.objects.filter(
                user=user,
                entry_date__gte=p2_start,
                entry_date__lte=p2_end
            ).aggregate(avg=Avg('mood_value'))['avg']
            
            data['mood'] = {
                'average': {
                    'period1': round(p1_avg, 2) if p1_avg else None,
                    'period2': round(p2_avg, 2) if p2_avg else None,
                    'difference': round(p1_avg - p2_avg, 2) if p1_avg and p2_avg else None,
                }
            }
        except ImportError:
            pass
        
        # Determine winner
        scores = {'period1': 0, 'period2': 0}
        key_differences = []
        
        if 'tasks' in data:
            task_diff = data['tasks']['completed']['difference']
            if task_diff > 0:
                scores['period1'] += 1
                key_differences.append(f"Completed {task_diff} more tasks")
            elif task_diff < 0:
                scores['period2'] += 1
                key_differences.append(f"Completed {abs(task_diff)} fewer tasks")
        
        if scores['period1'] > scores['period2']:
            winner = 'period1'
        elif scores['period2'] > scores['period1']:
            winner = 'period2'
        else:
            winner = 'tie'
        
        return {
            'data': data,
            'winner': winner,
            'key_differences': key_differences
        }


class CustomReportViewSet(viewsets.ModelViewSet):
    """Custom report generation"""
    permission_classes = [IsAuthenticated]
    serializer_class = CustomReportSerializer
    
    def get_queryset(self):
        return CustomReport.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate the report file"""
        report = self.get_object()
        
        # Collect data
        data = self._collect_report_data(report)
        
        # Generate file based on format
        if report.format == 'json':
            file_content = json.dumps(data, indent=2, default=str)
            content_type = 'application/json'
            filename = f"{report.name}.json"
        elif report.format == 'csv':
            file_content = self._generate_csv(data)
            content_type = 'text/csv'
            filename = f"{report.name}.csv"
        else:
            file_content = json.dumps(data, indent=2, default=str)
            content_type = 'application/json'
            filename = f"{report.name}.json"
        
        # Save file
        from django.core.files.base import ContentFile
        report.generated_file.save(filename, ContentFile(file_content))
        report.generated_at = timezone.now()
        report.file_size = len(file_content)
        report.save()
        
        return Response({
            'status': 'generated',
            'file_url': report.generated_file.url if report.generated_file else None,
            'file_size': report.file_size
        })
    
    def _collect_report_data(self, report):
        """Collect data for the report"""
        data = {
            'report_name': report.name,
            'generated_at': timezone.now().isoformat(),
            'date_range': {
                'start': str(report.start_date),
                'end': str(report.end_date)
            },
            'modules': {}
        }
        
        for module in report.selected_modules:
            module_data = self._get_module_report_data(
                report.user,
                module,
                report.selected_metrics.get(module, []),
                report.start_date,
                report.end_date
            )
            if module_data:
                data['modules'][module] = module_data
        
        return data
    
    def _get_module_report_data(self, user, module, metrics, start_date, end_date):
        """Get report data for a specific module"""
        data = {}
        
        if module == 'tasks':
            try:
                from apps.tasks.models import Task
                data['tasks_created'] = Task.objects.filter(
                    user=user,
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                ).count()
                data['tasks_completed'] = Task.objects.filter(
                    user=user,
                    status='completed',
                    completed_at__date__gte=start_date,
                    completed_at__date__lte=end_date
                ).count()
            except ImportError:
                pass
        
        elif module == 'mood':
            try:
                from apps.mood.models import MoodEntry
                entries = MoodEntry.objects.filter(
                    user=user,
                    entry_date__gte=start_date,
                    entry_date__lte=end_date
                )
                data['total_entries'] = entries.count()
                data['average_mood'] = entries.aggregate(avg=Avg('mood_value'))['avg']
            except ImportError:
                pass
        
        return data
    
    def _generate_csv(self, data):
        """Generate CSV from report data"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Module', 'Metric', 'Value'])
        
        # Write data
        for module, metrics in data.get('modules', {}).items():
            for metric, value in metrics.items():
                writer.writerow([module, metric, value])
        
        return output.getvalue()
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the generated report"""
        report = self.get_object()
        
        if not report.generated_file:
            return Response(
                {'error': 'Report has not been generated yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content_type_map = {
            'json': 'application/json',
            'csv': 'text/csv',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'pdf': 'application/pdf',
        }
        
        response = HttpResponse(
            report.generated_file.read(),
            content_type=content_type_map.get(report.format, 'application/octet-stream')
        )
        response['Content-Disposition'] = f'attachment; filename="{report.name}.{report.format}"'
        return response


class AchievementBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    """Achievement badges definitions"""
    permission_classes = [IsAuthenticated]
    serializer_class = AchievementBadgeSerializer
    queryset = AchievementBadge.objects.all()
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get badge categories"""
        categories = AchievementBadge.objects.values('category').distinct()
        return Response([c['category'] for c in categories])


class UserAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """User achievements and progress"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserAchievementProgressSerializer
        return UserAchievementSerializer
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get achievement summary"""
        achievements = UserAchievement.objects.filter(user=request.user)
        
        total_badges = AchievementBadge.objects.count()
        earned = achievements.filter(is_earned=True).count()
        in_progress = achievements.filter(is_earned=False).count()
        
        by_category = {}
        for achievement in achievements.filter(is_earned=True):
            cat = achievement.badge.category
            by_category[cat] = by_category.get(cat, 0) + 1
        
        return Response({
            'total_badges': total_badges,
            'earned': earned,
            'in_progress': in_progress,
            'completion_percentage': round(earned / total_badges * 100, 1) if total_badges else 0,
            'by_category': by_category,
        })
    
    @action(detail=False, methods=['post'])
    def check_progress(self, request):
        """Check and update achievement progress"""
        # This would be called periodically to update progress
        # For now, just return current status
        achievements = UserAchievement.objects.filter(user=request.user)
        return Response({
            'checked': achievements.count(),
            'achievements': UserAchievementProgressSerializer(achievements, many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share an achievement"""
        achievement = self.get_object()
        achievement.is_shared = True
        achievement.shared_at = timezone.now()
        achievement.save()
        return Response({'status': 'shared'})


class AnalyticsExportViewSet(viewsets.ModelViewSet):
    """Data export functionality"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AnalyticsExport.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return AnalyticsExportCreateSerializer
        return AnalyticsExportSerializer
    
    def perform_create(self, serializer):
        export = serializer.save(user=self.request.user, status='pending')
        # Trigger async export task (placeholder)
        self._process_export(export)
        return export
    
    def _process_export(self, export):
        """Process the data export"""
        export.status = 'processing'
        export.started_at = timezone.now()
        export.save()
        
        try:
            # Collect data based on scope
            if export.export_scope == 'all':
                data = self._export_all_data(export.user)
            elif export.export_scope == 'module':
                data = self._export_module_data(export.user, export.selected_modules)
            else:
                data = self._export_date_range_data(
                    export.user,
                    export.start_date,
                    export.end_date,
                    export.selected_modules
                )
            
            # Generate file
            if export.export_format == 'json':
                content = json.dumps(data, indent=2, default=str)
                filename = f"export_{export.id}.json"
            elif export.export_format == 'csv':
                content = self._convert_to_csv(data)
                filename = f"export_{export.id}.csv"
            else:
                content = json.dumps(data, indent=2, default=str)
                filename = f"export_{export.id}.json"
            
            from django.core.files.base import ContentFile
            export.file.save(filename, ContentFile(content))
            export.record_count = self._count_records(data)
            export.status = 'completed'
            export.completed_at = timezone.now()
            export.expires_at = timezone.now() + timedelta(days=7)
            
        except Exception as e:
            export.status = 'failed'
            export.error_message = str(e)
        
        export.save()
    
    def _export_all_data(self, user):
        """Export all user data"""
        data = {'user_id': str(user.id), 'export_date': timezone.now().isoformat()}
        
        # Tasks
        try:
            from apps.tasks.models import Task
            tasks = Task.objects.filter(user=user)
            data['tasks'] = list(tasks.values())
        except ImportError:
            pass
        
        # Mood entries
        try:
            from apps.mood.models import MoodEntry
            entries = MoodEntry.objects.filter(user=user)
            data['mood_entries'] = list(entries.values())
        except ImportError:
            pass
        
        return data
    
    def _export_module_data(self, user, modules):
        """Export data for specific modules"""
        return self._export_all_data(user)  # Simplified
    
    def _export_date_range_data(self, user, start_date, end_date, modules):
        """Export data for date range"""
        return self._export_all_data(user)  # Simplified
    
    def _convert_to_csv(self, data):
        """Convert data to CSV format"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        for module, records in data.items():
            if isinstance(records, list) and records:
                writer.writerow([f'=== {module} ==='])
                headers = list(records[0].keys())
                writer.writerow(headers)
                for record in records:
                    writer.writerow([record.get(h) for h in headers])
                writer.writerow([])
        
        return output.getvalue()
    
    def _count_records(self, data):
        """Count total records in export"""
        count = 0
        for value in data.values():
            if isinstance(value, list):
                count += len(value)
        return count
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the export file"""
        export = self.get_object()
        
        if export.status != 'completed':
            return Response(
                {'error': f'Export is {export.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if export.is_expired():
            return Response(
                {'error': 'Export has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        content_type_map = {
            'json': 'application/json',
            'csv': 'text/csv',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
        
        response = HttpResponse(
            export.file.read(),
            content_type=content_type_map.get(export.export_format, 'application/octet-stream')
        )
        response['Content-Disposition'] = f'attachment; filename="{export.name}.{export.export_format}"'
        return response


class AnalyticsInsightViewSet(viewsets.ReadOnlyModelViewSet):
    """Cross-module analytics insights"""
    permission_classes = [IsAuthenticated]
    serializer_class = AnalyticsInsightSerializer
    
    def get_queryset(self):
        return AnalyticsInsight.objects.filter(user=self.request.user, is_dismissed=False)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an insight"""
        insight = self.get_object()
        insight.is_dismissed = True
        insight.dismissed_at = timezone.now()
        insight.save()
        return Response({'status': 'dismissed'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark insight as read"""
        insight = self.get_object()
        insight.is_read = True
        insight.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_actioned(self, request, pk=None):
        """Mark insight as actioned"""
        insight = self.get_object()
        insight.is_actioned = True
        insight.save()
        return Response({'status': 'marked as actioned'})


class AnalyticsDashboardViewSet(viewsets.ViewSet):
    """Main analytics dashboard"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get analytics dashboard summary"""
        user = request.user
        
        # Get or create profile
        profile, _ = UserAnalyticsProfile.objects.get_or_create(user=user)
        
        # Count achievements
        total_achievements = UserAchievement.objects.filter(user=user, is_earned=True).count()
        
        # Count new insights (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        new_insights = AnalyticsInsight.objects.filter(
            user=user,
            created_at__gte=week_ago,
            is_dismissed=False
        ).count()
        
        # Count unread anomalies
        unread_anomalies = AnomalyDetection.objects.filter(
            user=user,
            is_read=False,
            is_dismissed=False
        ).count()
        
        # Count active goals
        active_goals = GoalProgress.objects.filter(
            user=user,
            status__in=['in_progress', 'on_track', 'at_risk']
        ).count()
        
        # Get recent trends
        recent_trends = TrendDetection.objects.filter(
            user=user,
            is_significant=True
        ).order_by('-created_at')[:5]
        
        # Get recent insights
        recent_insights = AnalyticsInsight.objects.filter(
            user=user,
            is_dismissed=False
        ).order_by('-created_at')[:5]
        
        # Goal progress summary
        goal_summary = GoalProgress.objects.filter(user=user).aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            avg_progress=Avg('progress_percentage')
        )
        
        data = {
            'total_achievements': total_achievements,
            'new_insights_count': new_insights,
            'unread_anomalies_count': unread_anomalies,
            'active_goals_count': active_goals,
            'current_streak_days': profile.current_streak_days,
            'overall_consistency_score': profile.overall_consistency_score,
            'recent_trends': recent_trends,
            'recent_insights': recent_insights,
            'goal_progress_summary': goal_summary,
        }
        
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def modules(self, request):
        """Get available analytics modules"""
        modules = [
            {'id': 'tasks', 'name': 'Tasks', 'icon': 'check-square', 'color': '#3B82F6'},
            {'id': 'habits', 'name': 'Habits', 'icon': 'repeat', 'color': '#10B981'},
            {'id': 'mood', 'name': 'Mood', 'icon': 'smile', 'color': '#F59E0B'},
            {'id': 'sleep', 'name': 'Sleep', 'icon': 'moon', 'color': '#6366F1'},
            {'id': 'exercise', 'name': 'Exercise', 'icon': 'activity', 'color': '#EF4444'},
            {'id': 'journal', 'name': 'Journal', 'icon': 'book', 'color': '#8B5CF6'},
            {'id': 'pomodoro', 'name': 'Focus', 'icon': 'clock', 'color': '#EC4899'},
            {'id': 'finance', 'name': 'Finance', 'icon': 'dollar-sign', 'color': '#14B8A6'},
        ]
        return Response(modules)
    
    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Refresh all analytics data"""
        user = request.user
        
        # Trigger various refresh operations
        # This would typically call async tasks
        
        return Response({
            'status': 'refresh initiated',
            'operations': [
                'trend_detection',
                'anomaly_scan',
                'correlation_analysis',
                'goal_sync'
            ]
        })
