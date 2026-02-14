from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta
from django.utils import timezone
from django.db import models
from .models import CalendarEvent, CalendarViewPreference
from .serializers import CalendarEventSerializer, CalendarPreferenceSerializer

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CalendarEvent.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def range(self, request):
        """Get events for a date range"""
        start_date = request.query_params.get('start', date.today())
        end_date = request.query_params.get('end', date.today() + timedelta(days=7))
        
        events = self.get_queryset().filter(
            start_date__lte=end_date,
            end_date__gte=start_date if start_date else models.Q(start_date__gte=start_date)
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def day(self, request):
        """Get events for a specific day"""
        day = request.query_params.get('date', date.today())
        
        events = self.get_queryset().filter(
            start_date__lte=day,
            end_date__gte=day if day else models.Q(start_date=day)
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's events"""
        today = date.today()
        
        events = self.get_queryset().filter(
            start_date__lte=today,
            end_date__gte=today if today else models.Q(start_date=today)
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

class CalendarPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj, created = CalendarViewPreference.objects.get_or_create(
            user=self.request.user,
            defaults={'default_view': 'week'}
        )
        return obj
