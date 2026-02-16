from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Account, Category, Transaction, Budget, Goal, RecurringTransaction
from .serializers import (
    AccountSerializer,
    CategorySerializer,
    TransactionSerializer,
    BudgetSerializer,
    GoalSerializer,
    RecurringTransactionSerializer,
)


class IsOwnerMixin:
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccountViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['account_type', 'currency']
    search_fields = ['name']
    ordering_fields = ['balance', 'name']

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


class CategoryViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)


class TransactionViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'currency', 'account', 'category', 'date']
    search_fields = ['memo', 'account__name', 'category__name']
    ordering_fields = ['date', 'amount']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related('account', 'category')


class BudgetViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BudgetSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['start_date', 'end_date', 'category']
    ordering_fields = ['start_date', 'end_date', 'amount']

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)


class GoalViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GoalSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['target_date', 'target_amount']

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)


class RecurringTransactionViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecurringTransactionSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['frequency', 'active', 'account']
    ordering_fields = ['next_run', 'amount']

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def run_due(self, request):
        # Placeholder: trigger run of due recurring transactions for the user
        return Response({'status': 'scheduled'})
