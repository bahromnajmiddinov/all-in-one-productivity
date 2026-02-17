from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, F, ExpressionWrapper, FloatField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta, datetime
import random
import calendar

from .models import (
    JournalTag, JournalMood, JournalPrompt, JournalTemplate,
    JournalEntry, JournalStreak, EntryAnalytics, JournalReminder, JournalStats
)
from .serializers import (
    JournalTagSerializer, JournalMoodSerializer, JournalPromptSerializer,
    JournalTemplateSerializer, JournalEntrySerializer, JournalEntryListSerializer,
    EntryAnalyticsSerializer, JournalStreakSerializer, JournalReminderSerializer,
    JournalStatsSerializer
)


class JournalTagViewSet(viewsets.ModelViewSet):
    serializer_class = JournalTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_queryset(self):
        return JournalTag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most frequently used tags"""
        tags = self.get_queryset().annotate(
            entry_count=Count('journalentry')
        ).order_by('-entry_count')[:20]
        serializer = self.get_serializer(tags, many=True)
        return Response(serializer.data)


class JournalMoodViewSet(viewsets.ModelViewSet):
    serializer_class = JournalMoodSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JournalMood.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent mood entries"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        moods = self.get_queryset().filter(date__gte=since_date)
        serializer = self.get_serializer(moods, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get mood trends over time"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        moods = self.get_queryset().filter(date__gte=since_date).order_by('date')
        
        # Calculate moving average
        data = []
        for i, mood in enumerate(moods):
            data.append({
                'date': mood.date,
                'mood': mood.mood,
                'energy_level': mood.energy_level,
                'stress_level': mood.stress_level,
                'sleep_quality': mood.sleep_quality
            })
        
        return Response({
            'data': data,
            'average': moods.aggregate(avg=Avg('mood'))['avg'] or 0
        })
    
    @action(detail=False, methods=['get'])
    def distribution(self, request):
        """Get mood distribution"""
        from django.db.models import Count
        
        distribution = self.get_queryset().values('mood').annotate(
            count=Count('id')
        ).order_by('mood')
        
        return Response(list(distribution))


class JournalPromptViewSet(viewsets.ModelViewSet):
    serializer_class = JournalPromptSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['prompt_type', 'difficulty', 'usage_count']
    ordering = ['prompt_type', 'difficulty']
    
    def get_queryset(self):
        # Users can see system prompts and their own custom prompts
        return JournalPrompt.objects.filter(
            Q(is_system=True) | Q(created_by=self.request.user)
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def random(self, request):
        """Get a random prompt, optionally filtered by type"""
        prompt_type = request.query_params.get('type')
        
        queryset = self.get_queryset()
        if prompt_type:
            queryset = queryset.filter(prompt_type=prompt_type)
        
        # Increment usage for the returned prompt
        prompt = random.choice(list(queryset)) if queryset.exists() else None
        if prompt:
            prompt.increment_usage()
            serializer = self.get_serializer(prompt)
            return Response(serializer.data)
        
        return Response({'detail': 'No prompts available'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def daily(self, request):
        """Get a daily prompt based on date"""
        today = timezone.now().date()
        
        # Use date to get consistent daily prompt
        queryset = self.get_queryset()
        total_count = queryset.count()
        
        if total_count > 0:
            index = int(today.strftime('%j')) % total_count
            prompt = list(queryset)[index]
            prompt.increment_usage()
            serializer = self.get_serializer(prompt)
            return Response(serializer.data)
        
        return Response({'detail': 'No prompts available'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get prompts grouped by type"""
        queryset = self.get_queryset()
        
        result = {}
        for prompt_type, _ in JournalPrompt.PROMPT_TYPES:
            prompts = queryset.filter(prompt_type=prompt_type)
            result[prompt_type] = self.get_serializer(prompts, many=True).data
        
        return Response(result)


class JournalTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = JournalTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JournalTemplate.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def system(self, request):
        """Get system templates available to all users"""
        system_templates = JournalTemplate.objects.filter(is_system=True)
        
        # Create personal copies of system templates for this user
        user_templates = []
        for template in system_templates:
            user_template, created = JournalTemplate.objects.get_or_create(
                user=request.user,
                name=template.name,
                defaults={
                    'template_type': template.template_type,
                    'description': template.description,
                    'icon': template.icon,
                    'color': template.color,
                    'content': template.content,
                    'suggest_mood': template.suggest_mood,
                    'is_system': False,
                    'is_default': template.is_default
                }
            )
            user_templates.append(user_template)
        
        serializer = self.get_serializer(user_templates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def use(self, request, pk=None):
        """Record that a template was used"""
        template = self.get_object()
        template.increment_usage()
        return Response({'usage_count': template.usage_count})


class JournalEntryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['entry_date', 'created_at', 'updated_at', 'word_count']
    ordering = ['-entry_date', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JournalEntryListSerializer
        return JournalEntrySerializer
    
    def get_queryset(self):
        queryset = JournalEntry.objects.filter(user=self.request.user).select_related(
            'mood', 'template', 'prompt'
        ).prefetch_related('tags')
        
        # Filter by favorites
        favorites = self.request.query_params.get('favorites')
        if favorites:
            queryset = queryset.filter(is_favorite=True)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(entry_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(entry_date__lte=end_date)
        
        # Filter by tag
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__id=tag)
        
        # Filter by template
        template = self.request.query_params.get('template')
        if template:
            queryset = queryset.filter(template_id=template)
        
        # Filter by mood rating
        min_mood = self.request.query_params.get('min_mood')
        max_mood = self.request.query_params.get('max_mood')
        if min_mood:
            queryset = queryset.filter(mood__mood__gte=min_mood)
        if max_mood:
            queryset = queryset.filter(mood__mood__lte=max_mood)
        
        # Filter by sentiment
        sentiment = self.request.query_params.get('sentiment')
        if sentiment:
            # This will be filtered after queryset
            pass
        
        return queryset
    
    def perform_create(self, serializer):
        entry = serializer.save(user=self.request.user)
        
        # Create or update analytics
        analytics, created = EntryAnalytics.objects.get_or_create(entry=entry)
        analytics.update_analytics()
        
        # Update streak
        streak, created = JournalStreak.objects.get_or_create(
            user=self.request.user,
            defaults={
                'current_streak': 1,
                'last_entry_date': entry.entry_date,
                'best_streak': 1,
                'best_streak_start': entry.entry_date,
                'best_streak_end': entry.entry_date,
                'total_entries': 1,
                'total_word_count': entry.word_count
            }
        )
        if not created:
            streak.update_streak(entry.entry_date)
        
        # Update stats
        stats, _ = JournalStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()
        
        # Create reminder for memory lane (1 month from now)
        JournalReminder.objects.create(
            user=self.request.user,
            entry=entry,
            reminder_type='monthly',
            next_reminder_date=entry.entry_date + timedelta(days=30)
        )
        
        return entry
    
    def perform_update(self, serializer):
        entry = serializer.save()
        
        # Update analytics
        analytics, _ = EntryAnalytics.objects.get_or_create(entry=entry)
        analytics.update_analytics()
        
        # Update stats
        stats, _ = JournalStats.objects.get_or_create(user=self.request.user)
        stats.update_stats()
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve entry and record view"""
        instance = self.get_object()
        
        # Record view
        analytics, _ = EntryAnalytics.objects.get_or_create(entry=instance)
        analytics.record_view()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """Get entries in timeline format grouped by date"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Group by date
        timeline = {}
        for entry in queryset:
            date_str = entry.entry_date.strftime('%Y-%m-%d')
            if date_str not in timeline:
                timeline[date_str] = []
            timeline[date_str].append(JournalEntryListSerializer(entry).data)
        
        return Response(timeline)
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Get entries grouped by month for calendar view"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Group by month
        calendar_data = {}
        for entry in queryset:
            month_key = entry.entry_date.strftime('%Y-%m')
            if month_key not in calendar_data:
                calendar_data[month_key] = []
            calendar_data[month_key].append({
                'date': entry.entry_date.day,
                'id': str(entry.id),
                'title': entry.title or 'Untitled',
                'is_favorite': entry.is_favorite,
                'mood': entry.mood.mood if entry.mood else None
            })
        
        return Response(calendar_data)
    
    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """Get entry for a specific date"""
        date_str = request.query_params.get('date')
        if not date_str:
            return Response(
                {'detail': 'Date parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            entry_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'detail': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        entry = self.get_queryset().filter(entry_date=entry_date).first()
        if entry:
            serializer = self.get_serializer(entry)
            return Response(serializer.data)
        
        return Response({'detail': 'No entry found for this date'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        """Toggle favorite status"""
        entry = self.get_object()
        entry.is_favorite = not entry.is_favorite
        entry.save()
        return Response({'is_favorite': entry.is_favorite})
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search with multiple filters"""
        queryset = self.get_queryset()
        
        # Search query
        query = request.query_params.get('q')
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) | Q(content__icontains=query)
            )
        
        # Tags
        tags = request.query_params.getlist('tags')
        if tags:
            queryset = queryset.filter(tags__id__in=tags).distinct()
        
        # Date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(entry_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(entry_date__lte=end_date)
        
        # Sentiment filtering
        min_sentiment = request.query_params.get('min_sentiment')
        max_sentiment = request.query_params.get('max_sentiment')
        
        # Apply sentiment filter in Python
        if min_sentiment or max_sentiment:
            filtered_ids = []
            for entry in queryset:
                sentiment = entry.get_sentiment_score()
                if min_sentiment and sentiment < float(min_sentiment):
                    continue
                if max_sentiment and sentiment > float(max_sentiment):
                    continue
                filtered_ids.append(entry.id)
            queryset = queryset.filter(id__in=filtered_ids)
        
        # Word count range
        min_words = request.query_params.get('min_words')
        max_words = request.query_params.get('max_words')
        if min_words:
            queryset = queryset.filter(word_count__gte=min_words)
        if max_words:
            queryset = queryset.filter(word_count__lte=max_words)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """Get all favorite entries"""
        queryset = self.get_queryset().filter(is_favorite=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def memory_lane(self, request):
        """Get random past entries for reflection"""
        days_ago = int(request.query_params.get('days_ago', 365))
        count = int(request.query_params.get('count', 5))
        
        since_date = timezone.now().date() - timedelta(days=days_ago)
        queryset = self.get_queryset().filter(entry_date__gte=since_date)
        
        # Get random entries
        total_count = queryset.count()
        if total_count == 0:
            return Response([])
        
        random_entries = random.sample(list(queryset), min(count, total_count))
        serializer = self.get_serializer(random_entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def word_count_trends(self, request):
        """Get word count trends over time"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        entries = self.get_queryset().filter(entry_date__gte=since_date).order_by('entry_date')
        
        data = []
        for entry in entries:
            data.append({
                'date': entry.entry_date.strftime('%Y-%m-%d'),
                'word_count': entry.word_count
            })
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def sentiment_overview(self, request):
        """Get sentiment overview of all entries"""
        entries = self.get_queryset()
        
        positive = 0
        negative = 0
        neutral = 0
        
        for entry in entries:
            sentiment = entry.get_sentiment_score()
            if sentiment > 0.3:
                positive += 1
            elif sentiment < -0.3:
                negative += 1
            else:
                neutral += 1
        
        total = entries.count()
        if total == 0:
            return Response({
                'total': 0,
                'positive': 0,
                'negative': 0,
                'neutral': 0,
                'percentages': {'positive': 0, 'negative': 0, 'neutral': 0}
            })
        
        return Response({
            'total': total,
            'positive': positive,
            'negative': negative,
            'neutral': neutral,
            'percentages': {
                'positive': round(positive / total * 100, 1),
                'negative': round(negative / total * 100, 1),
                'neutral': round(neutral / total * 100, 1)
            }
        })


class EntryAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EntryAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EntryAnalytics.objects.filter(
            entry__user=self.request.user
        ).select_related('entry')


class JournalStreakViewSet(viewsets.ModelViewSet):
    serializer_class = JournalStreakSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JournalStreak.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Get current user's streak"""
        streak, created = JournalStreak.objects.get_or_create(
            user=request.user,
            defaults={
                'current_streak': 0,
                'best_streak': 0,
                'total_entries': 0,
                'total_word_count': 0
            }
        )
        serializer = self.get_serializer(streak)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def calendar_heatmap(self, request):
        """Get calendar heatmap data for visualization"""
        streak = self.get_queryset().first()
        if not streak:
            return Response([])
        
        entries = JournalEntry.objects.filter(
            user=request.user
        ).values('entry_date').annotate(
            word_count=Count('word_count')
        ).order_by('entry_date')
        
        heatmap_data = []
        for entry in entries:
            heatmap_data.append({
                'date': entry['entry_date'],
                'count': 1,
                'word_count': entry.get('word_count', 0)
            })
        
        return Response(heatmap_data)


class JournalReminderViewSet(viewsets.ModelViewSet):
    serializer_class = JournalReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JournalReminder.objects.filter(
            user=self.request.user
        ).select_related('entry')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming reminders"""
        today = timezone.now().date()
        reminders = self.get_queryset().filter(
            next_reminder_date__gte=today,
            is_sent=False,
            is_dismissed=False
        ).order_by('next_reminder_date')[:10]
        
        serializer = self.get_serializer(reminders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def due(self, request):
        """Get reminders that are due"""
        today = timezone.now().date()
        reminders = self.get_queryset().filter(
            next_reminder_date__lte=today,
            is_sent=False,
            is_dismissed=False
        ).order_by('next_reminder_date')
        
        serializer = self.get_serializer(reminders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a reminder"""
        reminder = self.get_object()
        reminder.is_dismissed = True
        reminder.save()
        
        # Schedule next reminder based on type
        if reminder.reminder_type == 'monthly':
            reminder.next_reminder_date = timezone.now().date() + timedelta(days=30)
            reminder.is_sent = False
            reminder.is_dismissed = False
            reminder.save()
        
        return Response({'status': 'dismissed'})
    
    @action(detail=False, methods=['post'])
    def process_due(self, request):
        """Process all due reminders"""
        today = timezone.now().date()
        due_reminders = self.get_queryset().filter(
            next_reminder_date__lte=today,
            is_sent=False,
            is_dismissed=False
        )
        
        for reminder in due_reminders:
            reminder.is_sent = True
            reminder.sent_at = timezone.now()
            reminder.save()
        
        return Response({'processed': due_reminders.count()})


class JournalStatsViewSet(viewsets.ModelViewSet):
    serializer_class = JournalStatsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JournalStats.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get comprehensive dashboard statistics"""
        stats, created = JournalStats.objects.get_or_create(
            user=request.user
        )
        stats.update_stats()
        
        serializer = self.get_serializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def consistency(self, request):
        """Get consistency metrics over time"""
        days = int(request.query_params.get('days', 90))
        since_date = timezone.now().date() - timedelta(days=days)
        
        entries = JournalEntry.objects.filter(
            user=request.user,
            entry_date__gte=since_date
        ).order_by('entry_date')
        
        # Calculate daily streaks
        consistency_data = []
        current_date = since_date
        while current_date <= timezone.now().date():
            has_entry = entries.filter(entry_date=current_date).exists()
            consistency_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'has_entry': has_entry
            })
            current_date += timedelta(days=1)
        
        # Calculate consistency percentage
        days_with_entries = sum(1 for d in consistency_data if d['has_entry'])
        consistency_percent = round(days_with_entries / len(consistency_data) * 100, 1) if consistency_data else 0
        
        return Response({
            'data': consistency_data,
            'consistency_percent': consistency_percent,
            'days_with_entries': days_with_entries,
            'total_days': len(consistency_data)
        })
    
    @action(detail=False, methods=['get'])
    def mood_over_time(self, request):
        """Get mood trends over time with journal context"""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now().date() - timedelta(days=days)
        
        moods = JournalMood.objects.filter(
            user=request.user,
            date__gte=since_date
        ).order_by('date')
        
        data = []
        for mood in moods:
            entry = JournalEntry.objects.filter(
                user=request.user,
                entry_date=mood.date
            ).first()
            
            data.append({
                'date': mood.date.strftime('%Y-%m-%d'),
                'mood': mood.mood,
                'energy_level': mood.energy_level,
                'stress_level': mood.stress_level,
                'sleep_quality': mood.sleep_quality,
                'has_entry': entry is not None,
                'entry_id': str(entry.id) if entry else None,
                'word_count': entry.word_count if entry else 0
            })
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def writing_patterns(self, request):
        """Analyze writing patterns"""
        from django.db.models.functions import ExtractWeekDay, ExtractHour
        
        entries = JournalEntry.objects.filter(user=request.user)
        
        # Day of week distribution
        day_distribution = list(
            entries.annotate(
                day_of_week=ExtractWeekDay('entry_date')
            ).values('day_of_week').annotate(
                count=Count('id')
            ).order_by('day_of_week')
        )
        
        # Convert to proper format
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_data = []
        for item in day_distribution:
            day_index = item['day_of_week'] - 1  # 1-7 to 0-6
            if 0 <= day_index < 7:
                day_data.append({
                    'day': days[day_index],
                    'count': item['count']
                })
        
        # Word count distribution
        word_ranges = [
            ('0-100', 0, 100),
            ('100-500', 100, 500),
            ('500-1000', 500, 1000),
            ('1000+', 1000, float('inf'))
        ]
        
        word_distribution = []
        for label, min_words, max_words in word_ranges:
            if max_words == float('inf'):
                count = entries.filter(word_count__gte=min_words).count()
            else:
                count = entries.filter(word_count__gte=min_words, word_count__lt=max_words).count()
            
            word_distribution.append({
                'range': label,
                'count': count
            })
        
        return Response({
            'day_distribution': day_data,
            'word_distribution': word_distribution
        })
