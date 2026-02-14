from datetime import date
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Habit, HabitCompletion
from .serializers import HabitSerializer, HabitCompletionSerializer


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        habit = self.get_object()
        completion_date = request.data.get('date', date.today())

        # Check if already completed for this date
        if HabitCompletion.objects.filter(habit=habit, date=completion_date).exists():
            return Response({'error': 'Already completed for this date'}, status=400)

        completion = HabitCompletion.objects.create(
            habit=habit,
            user=request.user,
            date=completion_date,
            notes=request.data.get('notes', '')
        )

        serializer = HabitCompletionSerializer(completion)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def uncomplete(self, request, pk=None):
        habit = self.get_object()
        completion_date = request.data.get('date', date.today())

        HabitCompletion.objects.filter(habit=habit, date=completion_date).delete()
        return Response({'status': 'uncompleted'})

    @action(detail=True, methods=['get'])
    def completions(self, request, pk=None):
        habit = self.get_object()
        year = request.query_params.get('year', date.today().year)
        month = request.query_params.get('month', date.today().month)

        completions = habit.completions.filter(
            date__year=year,
            date__month=month
        ).values_list('date', flat=True)

        return Response({
            'completions': [d.isoformat() for d in completions]
        })


class HabitCompletionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HabitCompletionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HabitCompletion.objects.filter(user=self.request.user)
