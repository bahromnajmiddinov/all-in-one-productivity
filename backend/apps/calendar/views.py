from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta, datetime, time
from django.utils import timezone
from django.db import models
from django.db.models import Q, Count, Sum, Avg, F, Case, When
from django.db.models.functions import TruncDate, TruncDay, TruncWeek, TruncMonth
from collections import defaultdict, Counter
from .models import CalendarEvent, CalendarViewPreference, Calendar
from .serializers import (
    CalendarEventSerializer, 
    CalendarPreferenceSerializer,
    CalendarSerializer,
    EventConflictSerializer,
    ScheduleAnalyticsSerializer,
    HeatmapDataSerializer,
    FreeTimeBlockSerializer,
    MeetingLoadSerializer
)

class CalendarViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Calendar.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Check if setting as default, remove default from others
        if serializer.validated_data.get('is_default'):
            Calendar.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        # Check if setting as default, remove default from others
        if serializer.validated_data.get('is_default'):
            Calendar.objects.filter(user=self.request.user, is_default=True).exclude(id=serializer.instance.id).update(is_default=False)
        serializer.save()

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = CalendarEvent.objects.filter(user=self.request.user)
        
        # Filter by calendar
        calendar_id = self.request.query_params.get('calendar')
        if calendar_id:
            queryset = queryset.filter(calendar_id=calendar_id)
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by status
        event_status = self.request.query_params.get('status')
        if event_status:
            queryset = queryset.filter(status=event_status)
        
        # Filter by date range
        start_date = self.request.query_params.get('start')
        end_date = self.request.query_params.get('end')
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        # If no calendar specified, use the default calendar
        calendar = serializer.validated_data.get('calendar')
        if not calendar:
            default_calendar = Calendar.objects.filter(user=self.request.user, is_default=True).first()
            if default_calendar:
                serializer.validated_data['calendar'] = default_calendar
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def range(self, request):
        """Get events for a date range"""
        start_date_str = request.query_params.get('start', date.today())
        end_date_str = request.query_params.get('end', date.today() + timedelta(days=7))
        
        if isinstance(start_date_str, str):
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = start_date_str
        
        if isinstance(end_date_str, str):
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = end_date_str
        
        events = self.get_queryset().filter(
            Q(start_date__lte=end_date) & (Q(end_date__gte=start_date) | Q(end_date__isnull=True))
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def day(self, request):
        """Get events for a specific day"""
        day_str = request.query_params.get('date', date.today())
        
        if isinstance(day_str, str):
            day = datetime.strptime(day_str, '%Y-%m-%d').date()
        else:
            day = day_str
        
        events = self.get_queryset().filter(
            Q(start_date__lte=day) & (Q(end_date__gte=day) | Q(end_date__isnull=True))
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's events"""
        today = date.today()
        
        events = self.get_queryset().filter(
            Q(start_date__lte=today) & (Q(end_date__gte=today) | Q(end_date__isnull=True))
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events starting from today"""
        today = date.today()
        limit = int(request.query_params.get('limit', 10))
        
        events = self.get_queryset().filter(
            Q(start_date__gte=today) | (Q(start_date__lte=today) & (Q(end_date__gte=today) | Q(end_date__isnull=True)))
        ).filter(status='confirmed').order_by('start_date', 'start_time')[:limit]
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def check_conflicts(self, request):
        """Check for scheduling conflicts for a proposed event"""
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        start_time_str = request.query_params.get('start_time')
        end_time_str = request.query_params.get('end_time')
        exclude_id = request.query_params.get('exclude_id')
        
        if not all([start_date_str, start_time_str, end_time_str]):
            return Response({'error': 'Missing required parameters'}, status=status.HTTP_400_BAD_REQUEST)
        
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        start_time = datetime.strptime(start_time_str, '%H:%M').time()
        end_time = datetime.strptime(end_time_str, '%H:%M').time()
        
        end_date = start_date
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        # Query for overlapping events
        queryset = self.get_queryset().filter(status='confirmed')
        
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        
        # Find overlapping events
        conflicts = []
        for event in queryset:
            # Check if dates overlap
            date_overlap = not (
                (event.end_date and event.end_date < start_date) or
                (event.start_date > end_date)
            )
            
            if date_overlap and event.start_time and event.end_time:
                # Check if times overlap on overlapping dates
                time_overlap = not (
                    (event.end_time < start_time) or
                    (event.start_time > end_time)
                )
                
                if time_overlap:
                    conflicts.append(event)
        
        serializer = CalendarEventSerializer(conflicts, many=True)
        return Response({'conflicts': serializer.data, 'has_conflict': len(conflicts) > 0})
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get schedule analytics for a date range"""
        start_date_str = request.query_params.get('start', date.today() - timedelta(days=30))
        end_date_str = request.query_params.get('end', date.today())
        
        if isinstance(start_date_str, str):
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = start_date_str
        
        if isinstance(end_date_str, str):
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = end_date_str
        
        events = self.get_queryset().filter(
            Q(start_date__gte=start_date) & Q(end_date__lte=end_date),
            status='confirmed'
        )
        
        # Calculate total hours
        total_hours = 0
        meeting_count = 0
        meeting_hours = 0
        
        for event in events:
            duration = 0
            if event.start_time and event.end_time and event.start_date == event.end_date:
                start = datetime.combine(event.start_date, event.start_time)
                end = datetime.combine(event.end_date or event.start_date, event.end_time)
                duration = (end - start).total_seconds() / 3600
            elif event.start_date and event.end_date and not event.start_time and not event.end_time:
                # All-day event
                days = (event.end_date - event.start_date).days + 1
                duration = days * 24
            
            total_hours += duration
            if event.event_type == 'meeting':
                meeting_count += 1
                meeting_hours += duration
        
        # Hours by event type
        hours_by_type = defaultdict(float)
        for event in events:
            duration = 0
            if event.start_time and event.end_time and event.start_date == event.end_date:
                start = datetime.combine(event.start_date, event.start_time)
                end = datetime.combine(event.end_date or event.start_date, event.end_time)
                duration = (end - start).total_seconds() / 3600
            hours_by_type[event.event_type] += duration
        
        # Hours by calendar
        hours_by_calendar = defaultdict(float)
        for event in events:
            duration = 0
            if event.start_time and event.end_time and event.start_date == event.end_date:
                start = datetime.combine(event.start_date, event.start_time)
                end = datetime.combine(event.end_date or event.start_date, event.end_time)
                duration = (end - start).total_seconds() / 3600
            if event.calendar:
                hours_by_calendar[event.calendar.name] += duration
        
        # Find busiest day
        daily_hours = defaultdict(float)
        for event in events:
            duration = 0
            if event.start_time and event.end_time and event.start_date == event.end_date:
                start = datetime.combine(event.start_date, event.start_time)
                end = datetime.combine(event.end_date or event.start_date, event.end_time)
                duration = (end - start).total_seconds() / 3600
            elif event.start_date and event.end_date:
                duration = (event.end_date - event.start_date).days + 1
            daily_hours[event.start_date] += duration
        
        busiest_day = max(daily_hours.items(), key=lambda x: x[1]) if daily_hours else (None, 0)
        
        # Calculate free time (assuming 24 hours minus scheduled time)
        total_period_hours = (end_date - start_date).days + 1
        free_time_hours = max(0, total_period_hours * 24 - total_hours)
        
        # Time blocks
        time_block_hours = sum(1 for event in events if event.event_type == 'time_block')
        
        average_meeting_duration = meeting_hours / meeting_count if meeting_count > 0 else 0
        
        data = {
            'period_start': start_date,
            'period_end': end_date,
            'total_events': events.count(),
            'total_hours': round(total_hours, 2),
            'hours_by_event_type': dict(hours_by_type),
            'hours_by_calendar': dict(hours_by_calendar),
            'average_meeting_duration': round(average_meeting_duration, 2),
            'meeting_count': meeting_count,
            'time_block_hours': round(time_block_hours, 2),
            'free_time_hours': round(free_time_hours, 2),
            'busiest_day': busiest_day[0],
            'busiest_day_hours': round(busiest_day[1], 2),
        }
        
        serializer = ScheduleAnalyticsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        """Get calendar heatmap data"""
        start_date_str = request.query_params.get('start', date.today() - timedelta(days=30))
        end_date_str = request.query_params.get('end', date.today())
        
        if isinstance(start_date_str, str):
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = start_date_str
        
        if isinstance(end_date_str, str):
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = end_date_str
        
        events = self.get_queryset().filter(
            Q(start_date__gte=start_date) & Q(end_date__lte=end_date),
            status='confirmed'
        )
        
        # Aggregate by date
        date_data = defaultdict(lambda: {'hours': 0, 'count': 0, 'types': defaultdict(int)})
        max_hours = 0
        
        for event in events:
            duration = 0
            if event.start_time and event.end_time and event.start_date == event.end_date:
                start = datetime.combine(event.start_date, event.start_time)
                end = datetime.combine(event.end_date or event.start_date, event.end_time)
                duration = (end - start).total_seconds() / 3600
            elif event.start_date and event.end_date:
                duration = (event.end_date - event.start_date).days + 1
            
            date_data[event.start_date]['hours'] += duration
            date_data[event.start_date]['count'] += 1
            date_data[event.start_date]['types'][event.event_type] += 1
            max_hours = max(max_hours, date_data[event.start_date]['hours'])
        
        # Build heatmap data
        heatmap = []
        current_date = start_date
        while current_date <= end_date:
            data = date_data[current_date]
            intensity = min(1, data['hours'] / max_hours) if max_hours > 0 else 0
            
            heatmap.append({
                'date': current_date,
                'total_hours': round(data['hours'], 2),
                'event_count': data['count'],
                'event_types': dict(data['types']),
                'intensity': round(intensity, 2),
            })
            current_date += timedelta(days=1)
        
        serializer = HeatmapDataSerializer(heatmap, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def free_time(self, request):
        """Analyze free time blocks"""
        start_date_str = request.query_params.get('start', date.today())
        end_date_str = request.query_params.get('end', date.today() + timedelta(days=7))
        work_start_hour = int(request.query_params.get('work_start', 9))
        work_end_hour = int(request.query_params.get('work_end', 17))
        
        if isinstance(start_date_str, str):
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = start_date_str
        
        if isinstance(end_date_str, str):
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = end_date_str
        
        events = self.get_queryset().filter(
            Q(start_date__gte=start_date) & Q(end_date__lte=end_date),
            status='confirmed',
            start_time__isnull=False,
            end_time__isnull=False
        ).order_by('start_date', 'start_time')
        
        free_blocks = []
        
        current_date = start_date
        while current_date <= end_date:
            # Get events for this day
            day_events = [e for e in events if e.start_date == current_date or 
                         (e.end_date and e.start_date <= current_date <= e.end_date)]
            
            # Build occupied time intervals
            occupied = []
            for event in day_events:
                start_dt = datetime.combine(current_date, event.start_time)
                end_dt = datetime.combine(current_date if event.start_date == current_date else event.end_date or current_date, 
                                        event.end_time)
                occupied.append((start_dt, end_dt))
            
            # Merge overlapping intervals
            if occupied:
                occupied.sort()
                merged = [occupied[0]]
                for current_start, current_end in occupied[1:]:
                    last_start, last_end = merged[-1]
                    if current_start <= last_end:
                        merged[-1] = (last_start, max(last_end, current_end))
                    else:
                        merged.append((current_start, current_end))
            else:
                merged = []
            
            # Find free blocks
            day_start = datetime.combine(current_date, time(work_start_hour))
            day_end = datetime.combine(current_date, time(work_end_hour))
            
            current_time = day_start
            for block_start, block_end in merged:
                if block_start > current_time:
                    duration_minutes = int((block_start - current_time).total_seconds() / 60)
                    if duration_minutes >= 15:  # Minimum 15 minutes
                        free_blocks.append({
                            'start': current_time,
                            'end': block_start,
                            'duration_minutes': duration_minutes,
                            'is_work_hours': True,
                        })
                current_time = max(current_time, block_end)
            
            # Free time after last event
            if current_time < day_end:
                duration_minutes = int((day_end - current_time).total_seconds() / 60)
                if duration_minutes >= 15:
                    free_blocks.append({
                        'start': current_time,
                        'end': day_end,
                        'duration_minutes': duration_minutes,
                        'is_work_hours': True,
                    })
            
            current_date += timedelta(days=1)
        
        serializer = FreeTimeBlockSerializer(free_blocks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def meeting_load(self, request):
        """Get meeting load analytics"""
        period = request.query_params.get('period', 'month')  # week, month, quarter
        
        # Determine date range
        today = date.today()
        if period == 'week':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'month':
            start_date = date(today.year, today.month, 1)
            end_date = date(today.year, today.month + 1, 1) - timedelta(days=1)
        elif period == 'quarter':
            quarter_start_month = ((today.month - 1) // 3) * 3 + 1
            start_date = date(today.year, quarter_start_month, 1)
            quarter_end_month = quarter_start_month + 2
            if quarter_end_month > 12:
                quarter_end_month -= 12
            end_date = date(today.year, quarter_end_month + 1, 1) - timedelta(days=1)
        else:
            start_date = today - timedelta(days=30)
            end_date = today
        
        meetings = self.get_queryset().filter(
            Q(start_date__gte=start_date) & Q(end_date__lte=end_date),
            event_type='meeting',
            status='confirmed'
        )
        
        # Calculate total meeting hours
        total_hours = 0
        for meeting in meetings:
            if meeting.start_time and meeting.end_time and meeting.start_date == meeting.end_date:
                start = datetime.combine(meeting.start_date, meeting.start_time)
                end = datetime.combine(meeting.end_date or meeting.start_date, meeting.end_time)
                total_hours += (end - start).total_seconds() / 3600
        
        # By day analysis
        by_day = []
        current_date = start_date
        while current_date <= end_date:
            day_meetings = [m for m in meetings if m.start_date == current_date]
            day_hours = 0
            for meeting in day_meetings:
                if meeting.start_time and meeting.end_time:
                    start = datetime.combine(meeting.start_date, meeting.start_time)
                    end = datetime.combine(meeting.end_date or meeting.start_date, meeting.end_time)
                    day_hours += (end - start).total_seconds() / 3600
            
            by_day.append({
                'date': current_date,
                'meeting_count': len(day_meetings),
                'hours': round(day_hours, 2),
            })
            current_date += timedelta(days=1)
        
        # Find peak day
        peak_day_data = max(by_day, key=lambda x: x['hours']) if by_day else {'date': None, 'hours': 0}
        
        # Calculate trend
        if len(by_day) >= 2:
            first_half = sum(d['hours'] for d in by_day[:len(by_day)//2])
            second_half = sum(d['hours'] for d in by_day[len(by_day)//2:])
            if second_half > first_half * 1.1:
                trend = 'increasing'
            elif second_half < first_half * 0.9:
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        total_period_days = (end_date - start_date).days + 1
        average_daily_hours = total_hours / total_period_days
        
        data = {
            'period': period,
            'period_start': start_date,
            'period_end': end_date,
            'total_meeting_hours': round(total_hours, 2),
            'meeting_count': meetings.count(),
            'average_daily_meeting_hours': round(average_daily_hours, 2),
            'peak_day': peak_day_data['date'],
            'peak_day_hours': round(peak_day_data['hours'], 2),
            'trend': trend,
            'by_day': by_day,
        }
        
        serializer = MeetingLoadSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def integration(self, request):
        """Get integrated view with tasks, habits, and pomodoro sessions"""
        start_date_str = request.query_params.get('start', date.today())
        end_date_str = request.query_params.get('end', date.today() + timedelta(days=7))
        
        if isinstance(start_date_str, str):
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = start_date_str
        
        if isinstance(end_date_str, str):
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = end_date_str
        
        # Get calendar events
        events = self.get_queryset().filter(
            Q(start_date__gte=start_date) & Q(end_date__lte=end_date),
            status='confirmed'
        )
        
        # Get tasks with due dates in range
        from apps.tasks.models import Task
        tasks = Task.objects.filter(
            user=self.request.user,
            due_date__gte=start_date,
            due_date__lte=end_date,
            status__in=['inbox', 'active']
        ).select_related('project')
        
        # Get habits
        from apps.habits.models import Habit
        habits = Habit.objects.filter(user=self.request.user, is_active=True)
        
        # Get pomodoro sessions
        from apps.pomodoro.models import PomodoroSession
        sessions = PomodoroSession.objects.filter(
            user=self.request.user,
            start_date__gte=start_date,
            start_date__lte=end_date
        ).select_related('task', 'project')
        
        event_serializer = CalendarEventSerializer(events, many=True)
        
        tasks_data = []
        for task in tasks:
            tasks_data.append({
                'id': str(task.id),
                'title': task.title,
                'due_date': task.due_date,
                'status': task.status,
                'priority': task.priority,
                'project': task.project.name if task.project else None,
                'type': 'task',
            })
        
        habits_data = []
        for habit in habits:
            habits_data.append({
                'id': str(habit.id),
                'name': habit.name,
                'frequency': habit.frequency,
                'type': 'habit',
            })
        
        sessions_data = []
        for session in sessions:
            sessions_data.append({
                'id': str(session.id),
                'date': session.start_date,
                'duration': session.planned_duration,
                'task': session.task.title if session.task else None,
                'type': 'pomodoro',
            })
        
        return Response({
            'events': event_serializer.data,
            'tasks': tasks_data,
            'habits': habits_data,
            'pomodoro_sessions': sessions_data,
        })

class CalendarPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj, created = CalendarViewPreference.objects.get_or_create(
            user=self.request.user,
            defaults={
                'default_view': 'week',
                'show_completed_tasks': True,
                'show_habits': True,
                'show_pomodoro': True,
            }
        )
        return obj
