from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, StdDev, Q, F, FloatField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, ExtractWeekDay, ExtractHour
from django.utils import timezone
from datetime import timedelta, datetime
from collections import defaultdict
import statistics

from .models import (
    MoodScale, MoodEntry, MoodFactor, Emotion, MoodTrigger,
    MoodCorrelation, MoodInsight, MoodStats, MoodJournalLink
)
from .serializers import (
    MoodScaleSerializer, MoodEntryListSerializer, MoodEntryDetailSerializer,
    MoodEntryCreateSerializer, MoodFactorSerializer, EmotionSerializer,
    MoodTriggerSerializer, MoodCorrelationSerializer, MoodInsightSerializer,
    MoodStatsSerializer, MoodJournalLinkSerializer, QuickMoodSerializer,
    EmotionWheelSerializer
)


class MoodScaleViewSet(viewsets.ModelViewSet):
    """Manage custom mood scales (numeric or emoji-based)"""
    serializer_class = MoodScaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        return MoodScale.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this scale as the default for the user"""
        scale = self.get_object()
        scale.is_default = True
        scale.save()
        return Response({'status': 'default set'})


class MoodEntryViewSet(viewsets.ModelViewSet):
    """Main mood entry CRUD with analytics"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['entry_date', 'entry_time', 'mood_value', 'created_at']
    ordering = ['-entry_date', '-entry_time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MoodEntryListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MoodEntryCreateSerializer
        return MoodEntryDetailSerializer
    
    def get_queryset(self):
        queryset = MoodEntry.objects.filter(user=self.request.user)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(entry_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(entry_date__lte=end_date)
        
        # Filter by time of day
        time_of_day = self.request.query_params.get('time_of_day')
        if time_of_day:
            queryset = queryset.filter(time_of_day=time_of_day)
        
        # Filter by mood range
        min_mood = self.request.query_params.get('min_mood')
        max_mood = self.request.query_params.get('max_mood')
        if min_mood:
            queryset = queryset.filter(mood_value__gte=min_mood)
        if max_mood:
            queryset = queryset.filter(mood_value__lte=max_mood)
        
        return queryset.select_related('scale').prefetch_related('factors', 'emotions', 'triggers')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def quick_log(self, request):
        """Quick mood logging with minimal fields"""
        serializer = QuickMoodSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set default scale
        default_scale = request.user.mood_scales.filter(is_default=True, is_active=True).first()
        if not default_scale:
            default_scale = request.user.mood_scales.filter(is_active=True).first()
        
        entry = MoodEntry.objects.create(
            user=request.user,
            scale=default_scale,
            **serializer.validated_data
        )
        
        return Response(MoodEntryDetailSerializer(entry).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's mood entries"""
        today = timezone.now().date()
        entries = self.get_queryset().filter(entry_date=today)
        serializer = MoodEntryListSerializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """Get mood timeline with rolling averages"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        entries = self.get_queryset().filter(entry_date__gte=since_date).order_by('entry_date')
        
        # Group by date and calculate averages
        daily_data = {}
        for entry in entries:
            date_str = entry.entry_date.isoformat()
            if date_str not in daily_data:
                daily_data[date_str] = []
            daily_data[date_str].append(entry.mood_value)
        
        # Calculate timeline with rolling averages
        timeline = []
        sorted_dates = sorted(daily_data.keys())
        
        for i, date_str in enumerate(sorted_dates):
            values = daily_data[date_str]
            avg_mood = sum(values) / len(values)
            
            data_point = {
                'date': date_str,
                'mood_value': round(avg_mood, 2),
                'entry_count': len(values)
            }
            
            # Calculate 7-day rolling average
            if i >= 6:
                last_7 = [sum(daily_data[sorted_dates[j]]) / len(daily_data[sorted_dates[j]]) 
                         for j in range(i-6, i+1)]
                data_point['rolling_avg_7d'] = round(sum(last_7) / 7, 2)
            
            # Calculate 30-day rolling average
            if i >= 29:
                last_30 = [sum(daily_data[sorted_dates[j]]) / len(daily_data[sorted_dates[j]]) 
                          for j in range(i-29, i+1)]
                data_point['rolling_avg_30d'] = round(sum(last_30) / 30, 2)
            
            timeline.append(data_point)
        
        return Response({
            'timeline': timeline,
            'overall_average': round(sum(daily_data[d]) / len(daily_data[d]) for d in daily_data) / len(daily_data) if daily_data else 0,
            'highest': max(max(v) for v in daily_data.values()) if daily_data else 0,
            'lowest': min(min(v) for v in daily_data.values()) if daily_data else 0,
        })
    
    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        """Get mood heatmap data for calendar visualization"""
        year = int(request.query_params.get('year', timezone.now().year))
        
        entries = self.get_queryset().filter(entry_date__year=year)
        
        # Group by date and calculate average mood
        heatmap_data = {}
        for entry in entries:
            date_str = entry.entry_date.isoformat()
            if date_str not in heatmap_data:
                heatmap_data[date_str] = []
            heatmap_data[date_str].append(entry.mood_value)
        
        # Format for heatmap with colors
        result = []
        for date_str, values in heatmap_data.items():
            avg_mood = sum(values) / len(values)
            # Determine color based on average mood (assuming 1-10 scale)
            if avg_mood >= 8:
                color = '#10B981'  # Green
            elif avg_mood >= 6:
                color = '#34D399'  # Light green
            elif avg_mood >= 5:
                color = '#FBBF24'  # Yellow
            elif avg_mood >= 3:
                color = '#F97316'  # Orange
            else:
                color = '#EF4444'  # Red
            
            result.append({
                'date': date_str,
                'mood_value': round(avg_mood, 2),
                'color': color,
                'entry_count': len(values)
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def patterns(self, request):
        """Identify mood patterns (weekly, monthly, seasonal)"""
        days = int(request.query_params.get('days', 90))
        since_date = timezone.now().date() - timedelta(days=days)
        
        entries = self.get_queryset().filter(entry_date__gte=since_date)
        
        if not entries.exists():
            return Response({'patterns': []})
        
        patterns = []
        
        # Weekly pattern - day of week analysis
        dow_data = entries.annotate(
            dow=ExtractWeekDay('entry_date')
        ).values('dow').annotate(
            avg_mood=Avg('mood_value'),
            count=Count('id')
        ).order_by('dow')
        
        days_map = {1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 
                   5: 'Friday', 6: 'Saturday', 7: 'Sunday'}
        
        if dow_data:
            best_day = max(dow_data, key=lambda x: x['avg_mood'])
            worst_day = min(dow_data, key=lambda x: x['avg_mood'])
            
            patterns.append({
                'pattern_type': 'weekly',
                'pattern_data': {
                    'by_day': {days_map.get(d['dow'], d['dow']): round(float(d['avg_mood']), 2) 
                              for d in dow_data},
                    'best_day': days_map.get(best_day['dow'], best_day['dow']),
                    'worst_day': days_map.get(worst_day['dow'], worst_day['dow']),
                },
                'insight': f"Your mood tends to be highest on {days_map.get(best_day['dow'])} "
                          f"and lowest on {days_map.get(worst_day['dow'])}."
            })
        
        # Time of day pattern
        tod_data = entries.values('time_of_day').annotate(
            avg_mood=Avg('mood_value'),
            count=Count('id')
        ).order_by('time_of_day')
        
        if tod_data:
            best_time = max(tod_data, key=lambda x: x['avg_mood'])
            patterns.append({
                'pattern_type': 'time_of_day',
                'pattern_data': {
                    'by_time': {d['time_of_day']: round(float(d['avg_mood']), 2) for d in tod_data}
                },
                'insight': f"You tend to feel best during the {best_time['time_of_day']}."
            })
        
        # Monthly trend
        monthly_data = entries.annotate(
            month=TruncMonth('entry_date')
        ).values('month').annotate(
            avg_mood=Avg('mood_value'),
            count=Count('id')
        ).order_by('month')
        
        if len(monthly_data) > 1:
            trend = 'improving' if monthly_data[-1]['avg_mood'] > monthly_data[0]['avg_mood'] else 'declining'
            patterns.append({
                'pattern_type': 'monthly_trend',
                'pattern_data': {
                    'monthly_averages': [
                        {'month': d['month'].strftime('%Y-%m'), 'avg_mood': round(float(d['avg_mood']), 2)}
                        for d in monthly_data
                    ]
                },
                'insight': f"Your mood has been generally {trend} over the past {days} days."
            })
        
        return Response({'patterns': patterns})
    
    @action(detail=False, methods=['get'])
    def compare(self, request):
        """Compare mood against other metrics (sleep, exercise, habits, productivity)"""
        metric = request.query_params.get('metric', 'sleep')
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        entries = self.get_queryset().filter(entry_date__gte=since_date)
        
        comparison_data = {
            'metric_name': metric,
            'mood_data': [],
            'metric_data': [],
            'correlation': None
        }
        
        if metric == 'sleep':
            # Get sleep data from health app
            from apps.health.models import SleepLog
            sleep_logs = SleepLog.objects.filter(
                user=request.user,
                date__gte=since_date
            )
            
            for entry in entries:
                sleep = sleep_logs.filter(date=entry.entry_date).first()
                if sleep:
                    comparison_data['mood_data'].append({
                        'date': entry.entry_date.isoformat(),
                        'value': entry.mood_value
                    })
                    comparison_data['metric_data'].append({
                        'date': entry.entry_date.isoformat(),
                        'value': getattr(sleep, 'duration_hours', 0) or 0,
                        'quality': getattr(sleep, 'quality', None)
                    })
        
        elif metric == 'exercise':
            # Get exercise data from health app
            from apps.health.models import ExerciseLog
            exercise_logs = ExerciseLog.objects.filter(
                user=request.user,
                date__gte=since_date
            )
            
            # Group by date
            exercise_by_date = {}
            for log in exercise_logs:
                date_str = log.date.isoformat()
                if date_str not in exercise_by_date:
                    exercise_by_date[date_str] = 0
                exercise_by_date[date_str] += getattr(log, 'duration_minutes', 0) or 0
            
            for entry in entries:
                date_str = entry.entry_date.isoformat()
                if date_str in exercise_by_date:
                    comparison_data['mood_data'].append({
                        'date': date_str,
                        'value': entry.mood_value
                    })
                    comparison_data['metric_data'].append({
                        'date': date_str,
                        'value': exercise_by_date[date_str]
                    })
        
        elif metric == 'habits':
            # Get habit completion data
            from apps.habits.models import HabitCompletion
            completions = HabitCompletion.objects.filter(
                habit__user=request.user,
                date__gte=since_date,
                completed=True
            )
            
            # Count completions per day
            habit_by_date = {}
            for comp in completions:
                date_str = comp.date.isoformat()
                habit_by_date[date_str] = habit_by_date.get(date_str, 0) + 1
            
            for entry in entries:
                date_str = entry.entry_date.isoformat()
                comparison_data['mood_data'].append({
                    'date': date_str,
                    'value': entry.mood_value
                })
                comparison_data['metric_data'].append({
                    'date': date_str,
                    'value': habit_by_date.get(date_str, 0)
                })
        
        # Calculate correlation
        if len(comparison_data['mood_data']) > 2:
            mood_values = [d['value'] for d in comparison_data['mood_data']]
            metric_values = [d['value'] for d in comparison_data['metric_data']]
            
            if len(mood_values) == len(metric_values) and len(mood_values) > 2:
                try:
                    correlation = statistics.correlation(mood_values, metric_values)
                    comparison_data['correlation'] = round(correlation, 3)
                except:
                    pass
        
        return Response(comparison_data)
    
    @action(detail=False, methods=['get'])
    def emotion_distribution(self, request):
        """Get emotion wheel distribution"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        emotions = Emotion.objects.filter(
            mood_entry__user=request.user,
            mood_entry__entry_date__gte=since_date
        )
        
        distribution = emotions.values('primary_emotion').annotate(
            count=Count('id'),
            avg_intensity=Avg('intensity')
        ).order_by('-count')
        
        return Response({
            'distribution': list(distribution),
            'total_emotions': emotions.count(),
            'dominant_emotions': list(emotions.filter(is_dominant=True).values(
                'primary_emotion'
            ).annotate(count=Count('id')).order_by('-count')[:5])
        })


class MoodFactorViewSet(viewsets.ModelViewSet):
    """Manage mood factors"""
    serializer_class = MoodFactorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MoodFactor.objects.filter(mood_entry__user=self.request.user)
    
    def perform_create(self, serializer):
        entry_id = self.request.data.get('mood_entry')
        entry = MoodEntry.objects.get(id=entry_id, user=self.request.user)
        serializer.save(mood_entry=entry)


class EmotionViewSet(viewsets.ModelViewSet):
    """Manage emotions"""
    serializer_class = EmotionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Emotion.objects.filter(mood_entry__user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def wheel(self, request):
        """Get emotion wheel structure"""
        wheel_data = [
            {
                'primary_emotion': 'joy',
                'label': 'Joy',
                'color': '#FBBF24',
                'related_emotions': ['Happy', 'Content', 'Pleased', 'Cheerful', 'Delighted']
            },
            {
                'primary_emotion': 'trust',
                'label': 'Trust',
                'color': '#34D399',
                'related_emotions': ['Accepting', 'Secure', 'Supported', 'Respected', 'Appreciated']
            },
            {
                'primary_emotion': 'fear',
                'label': 'Fear',
                'color': '#9CA3AF',
                'related_emotions': ['Scared', 'Anxious', 'Insecure', 'Nervous', 'Worried']
            },
            {
                'primary_emotion': 'surprise',
                'label': 'Surprise',
                'color': '#A78BFA',
                'related_emotions': ['Amazed', 'Astonished', 'Startled', 'Shocked', 'Confused']
            },
            {
                'primary_emotion': 'sadness',
                'label': 'Sadness',
                'color': '#60A5FA',
                'related_emotions': ['Down', 'Lonely', 'Disappointed', 'Hopeless', 'Hurt']
            },
            {
                'primary_emotion': 'disgust',
                'label': 'Disgust',
                'color': '#A3E635',
                'related_emotions': ['Disapproving', 'Disappointed', 'Awful', 'Repugnant', 'Revolted']
            },
            {
                'primary_emotion': 'anger',
                'label': 'Anger',
                'color': '#F87171',
                'related_emotions': ['Annoyed', 'Frustrated', 'Hostile', 'Bitter', 'Irritated']
            },
            {
                'primary_emotion': 'anticipation',
                'label': 'Anticipation',
                'color': '#FB923C',
                'related_emotions': ['Interested', 'Curious', 'Expectant', 'Hopeful', 'Enthusiastic']
            },
        ]
        return Response(wheel_data)


class MoodTriggerViewSet(viewsets.ModelViewSet):
    """Manage mood triggers"""
    serializer_class = MoodTriggerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MoodTrigger.objects.filter(mood_entry__user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def analysis(self, request):
        """Analyze common triggers"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        triggers = self.get_queryset().filter(
            mood_entry__entry_date__gte=since_date
        )
        
        # Group by trigger type
        by_type = triggers.values('trigger_type', 'is_positive').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Most common specific triggers
        common_triggers = triggers.values('description').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'by_type': list(by_type),
            'common_triggers': list(common_triggers),
            'total_triggers': triggers.count()
        })


class MoodCorrelationViewSet(viewsets.ReadOnlyModelViewSet):
    """View computed mood correlations"""
    serializer_class = MoodCorrelationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MoodCorrelation.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def compute(self, request):
        """Compute correlations for the user"""
        days = int(request.data.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        # This would trigger correlation calculations
        # For now, return a placeholder response
        return Response({
            'message': 'Correlation computation initiated',
            'days': days,
            'start_date': since_date.isoformat()
        })


class MoodInsightViewSet(viewsets.ModelViewSet):
    """Manage mood insights"""
    serializer_class = MoodInsightSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']
    
    def get_queryset(self):
        return MoodInsight.objects.filter(user=self.request.user, is_dismissed=False)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an insight"""
        insight = self.get_object()
        insight.is_dismissed = True
        insight.save()
        return Response({'status': 'insight dismissed'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark insight as read"""
        insight = self.get_object()
        insight.is_read = True
        insight.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['get'])
    def generate(self, request):
        """Generate new insights based on user's mood data"""
        days = int(request.query_params.get('days', 30))
        
        # Simple insight generation logic
        insights = []
        
        # Check for declining mood trend
        entries = MoodEntry.objects.filter(
            user=request.user,
            entry_date__gte=timezone.now().date() - timedelta(days=days)
        ).order_by('entry_date')
        
        if entries.count() >= 7:
            recent_avg = entries.filter(
                entry_date__gte=timezone.now().date() - timedelta(days=7)
            ).aggregate(avg=Avg('mood_value'))['avg']
            
            previous_avg = entries.filter(
                entry_date__lt=timezone.now().date() - timedelta(days=7),
                entry_date__gte=timezone.now().date() - timedelta(days=14)
            ).aggregate(avg=Avg('mood_value'))['avg']
            
            if recent_avg and previous_avg and recent_avg < previous_avg - 1:
                insights.append({
                    'type': 'warning',
                    'title': 'Mood Decline Detected',
                    'description': f'Your average mood has dropped from {previous_avg:.1f} to {recent_avg:.1f} in the past week.',
                    'action_items': ['Consider journaling about what might be affecting your mood',
                                   'Review your recent triggers and factors',
                                   'Practice self-care activities']
                })
        
        return Response({'insights': insights})


class MoodStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """View mood statistics"""
    serializer_class = MoodStatsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MoodStats.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        # Return the user's stats, create if not exists
        stats, created = MoodStats.objects.get_or_create(user=request.user)
        if created or request.query_params.get('refresh'):
            stats.update_stats()
        serializer = self.get_serializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Force refresh of statistics"""
        stats, _ = MoodStats.objects.get_or_create(user=request.user)
        stats.update_stats()
        return Response(MoodStatsSerializer(stats).data)


class MoodJournalLinkViewSet(viewsets.ModelViewSet):
    """Manage links between mood entries and journal entries"""
    serializer_class = MoodJournalLinkSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MoodJournalLink.objects.filter(mood_entry__user=self.request.user)
    
    def perform_create(self, serializer):
        # Verify mood entry belongs to user
        mood_entry_id = self.request.data.get('mood_entry')
        mood_entry = MoodEntry.objects.get(id=mood_entry_id, user=self.request.user)
        serializer.save()
