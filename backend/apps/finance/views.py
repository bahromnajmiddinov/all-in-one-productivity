from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Account,
    Category,
    IncomeSource,
    Transaction,
    Budget,
    Goal,
    RecurringTransaction,
    InvestmentHolding,
    NetWorthSnapshot,
)
from .serializers import (
    AccountSerializer,
    CategorySerializer,
    IncomeSourceSerializer,
    TransactionSerializer,
    BudgetSerializer,
    GoalSerializer,
    RecurringTransactionSerializer,
    InvestmentHoldingSerializer,
    NetWorthSnapshotSerializer,
)
from .tasks import process_recurring_transactions


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


class IncomeSourceViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IncomeSourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    filterset_fields = ['active']

    def get_queryset(self):
        return IncomeSource.objects.filter(user=self.request.user)


class TransactionViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'currency', 'account', 'category', 'income_source', 'date']
    search_fields = ['memo', 'account__name', 'category__name']
    ordering_fields = ['date', 'amount']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related('account', 'category', 'income_source')


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
        result = process_recurring_transactions.delay()
        return Response({'status': 'scheduled', 'task_id': result.id})


class InvestmentHoldingViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InvestmentHoldingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'symbol']
    ordering_fields = ['current_value', 'last_updated']

    def get_queryset(self):
        return InvestmentHolding.objects.filter(user=self.request.user).select_related('account')


class NetWorthSnapshotViewSet(IsOwnerMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NetWorthSnapshotSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['date', 'net_worth']

    def get_queryset(self):
        return NetWorthSnapshot.objects.filter(user=self.request.user)


class FinanceAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_category_descendants(self, category):
        descendants = [category.id]
        children = Category.objects.filter(parent=category)
        for child in children:
            descendants.extend(self._get_category_descendants(child))
        return descendants

    @action(detail=False, methods=['get'])
    def spending_trends(self, request):
        days = int(request.query_params.get('days', 90))
        start = timezone.localdate() - timedelta(days=days)
        txs = Transaction.objects.filter(user=request.user, date__date__gte=start)

        daily_data = defaultdict(lambda: {'income': 0, 'expense': 0, 'transfer': 0})
        daily_rows = (
            txs.annotate(day=TruncDate('date'))
            .values('day', 'type')
            .annotate(total=Sum('amount'))
        )
        for row in daily_rows:
            day = row['day'].isoformat()
            daily_data[day][row['type']] = float(row['total'] or 0)

        daily = [
            {
                'date': day,
                'income': values['income'],
                'expense': values['expense'],
                'transfer': values['transfer'],
                'net': values['income'] - values['expense'],
            }
            for day, values in sorted(daily_data.items())
        ]

        category_rows = (
            txs.filter(type='expense')
            .values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        by_category = [
            {'category': row['category__name'] or 'Uncategorized', 'total': float(row['total'] or 0)}
            for row in category_rows
        ]

        account_rows = (
            txs.filter(type='expense')
            .values('account__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        by_account = [
            {'account': row['account__name'] or 'Unknown', 'total': float(row['total'] or 0)}
            for row in account_rows
        ]

        return Response({'daily': daily, 'by_category': by_category, 'by_account': by_account})

    @action(detail=False, methods=['get'])
    def cash_flow(self, request):
        days = int(request.query_params.get('days', 90))
        start = timezone.localdate() - timedelta(days=days)
        txs = Transaction.objects.filter(user=request.user, date__date__gte=start).select_related(
            'account', 'category', 'income_source'
        )

        nodes = {}
        links = defaultdict(float)

        def node_index(name):
            if name not in nodes:
                nodes[name] = len(nodes)
            return nodes[name]

        for tx in txs:
            amount = float(tx.amount)
            if tx.type == 'income':
                source_name = tx.income_source.name if tx.income_source else 'Income'
                target_name = tx.account.name if tx.account else 'Account'
            elif tx.type == 'expense':
                source_name = tx.account.name if tx.account else 'Account'
                target_name = tx.category.name if tx.category else 'Uncategorized'
            else:
                source_name = tx.account.name if tx.account else 'Account'
                target_name = 'Transfers'
            source_idx = node_index(source_name)
            target_idx = node_index(target_name)
            links[(source_idx, target_idx)] += abs(amount)

        return Response({
            'nodes': [{'name': name} for name, _ in sorted(nodes.items(), key=lambda item: item[1])],
            'links': [
                {'source': source, 'target': target, 'value': value}
                for (source, target), value in links.items()
            ],
        })

    @action(detail=False, methods=['get'])
    def budget_vs_actual(self, request):
        budgets = Budget.objects.filter(user=request.user).select_related('category')
        results = []
        for budget in budgets:
            txs = Transaction.objects.filter(
                user=request.user,
                type='expense',
                date__date__gte=budget.start_date,
                date__date__lte=budget.end_date,
            )
            if budget.category:
                category_ids = self._get_category_descendants(budget.category)
                txs = txs.filter(category_id__in=category_ids)
            actual = txs.aggregate(total=Sum('amount'))['total'] or 0
            percent_used = float(actual) / float(budget.amount) * 100 if budget.amount else 0
            results.append({
                'id': budget.id,
                'name': budget.name,
                'category': budget.category.name if budget.category else 'All Spending',
                'amount': float(budget.amount),
                'actual': float(actual),
                'start_date': budget.start_date.isoformat(),
                'end_date': budget.end_date.isoformat(),
                'percent_used': round(percent_used, 1),
                'variance': float(budget.amount) - float(actual),
                'alert': percent_used >= 90,
            })
        return Response(results)

    @action(detail=False, methods=['get'])
    def net_worth(self, request):
        accounts = Account.objects.filter(user=request.user)
        liability_types = {'credit', 'loan', 'liability'}
        assets = sum(
            float(a.balance) for a in accounts if a.account_type not in liability_types
        )
        liabilities = sum(
            float(a.balance) for a in accounts if a.account_type in liability_types
        )
        net_worth = assets - liabilities

        if request.query_params.get('snapshot') == 'true':
            today = timezone.localdate()
            NetWorthSnapshot.objects.update_or_create(
                user=request.user,
                date=today,
                defaults={'assets': assets, 'liabilities': liabilities},
            )

        history = NetWorthSnapshot.objects.filter(user=request.user).order_by('date')
        return Response({
            'assets': assets,
            'liabilities': liabilities,
            'net_worth': net_worth,
            'history': NetWorthSnapshotSerializer(history, many=True).data,
            'accounts': AccountSerializer(accounts, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def health_score(self, request):
        days = int(request.query_params.get('days', 30))
        start = timezone.localdate() - timedelta(days=days)
        txs = Transaction.objects.filter(user=request.user, date__date__gte=start)
        income_total = txs.filter(type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense_total = txs.filter(type='expense').aggregate(total=Sum('amount'))['total'] or 0

        savings_rate = (float(income_total) - float(expense_total)) / float(income_total) if income_total else 0
        savings_score = max(0, min(100, savings_rate * 100))

        budgets = Budget.objects.filter(user=request.user, end_date__gte=start)
        budget_percents = []
        for budget in budgets:
            txs_budget = Transaction.objects.filter(
                user=request.user,
                type='expense',
                date__date__gte=budget.start_date,
                date__date__lte=budget.end_date,
            )
            if budget.category:
                category_ids = self._get_category_descendants(budget.category)
                txs_budget = txs_budget.filter(category_id__in=category_ids)
            actual = txs_budget.aggregate(total=Sum('amount'))['total'] or 0
            if budget.amount:
                budget_percents.append(float(actual) / float(budget.amount))
        avg_budget = sum(budget_percents) / len(budget_percents) if budget_percents else 0
        budget_score = max(0, min(100, 100 - (avg_budget * 100)))

        accounts = Account.objects.filter(user=request.user)
        liability_types = {'credit', 'loan', 'liability'}
        assets = sum(float(a.balance) for a in accounts if a.account_type not in liability_types)
        liabilities = sum(float(a.balance) for a in accounts if a.account_type in liability_types)
        debt_ratio = liabilities / assets if assets else 0
        debt_score = max(0, min(100, 100 - (debt_ratio * 100)))

        overall_score = round((savings_score * 0.4) + (budget_score * 0.3) + (debt_score * 0.3), 1)

        return Response({
            'overall_score': overall_score,
            'savings_score': round(savings_score, 1),
            'budget_score': round(budget_score, 1),
            'debt_score': round(debt_score, 1),
            'savings_rate': round(savings_rate * 100, 1),
            'income_total': float(income_total),
            'expense_total': float(expense_total),
        })

    @action(detail=False, methods=['get'])
    def category_heatmap(self, request):
        days = int(request.query_params.get('days', 60))
        start = timezone.localdate() - timedelta(days=days)
        txs = Transaction.objects.filter(
            user=request.user,
            type='expense',
            date__date__gte=start,
        )
        rows = (
            txs.annotate(day=TruncDate('date'))
            .values('day', 'category__name')
            .annotate(total=Sum('amount'))
            .order_by('day')
        )
        data = [
            {
                'date': row['day'].isoformat(),
                'category': row['category__name'] or 'Uncategorized',
                'total': float(row['total'] or 0),
            }
            for row in rows
        ]
        return Response(data)

    @action(detail=False, methods=['get'])
    def month_over_month(self, request):
        today = timezone.localdate()
        current_start = today.replace(day=1)
        previous_end = current_start - timedelta(days=1)
        previous_start = previous_end.replace(day=1)

        current_rows = (
            Transaction.objects.filter(
                user=request.user,
                type='expense',
                date__date__gte=current_start,
                date__date__lte=today,
            )
            .values('category__name')
            .annotate(total=Sum('amount'))
        )
        previous_rows = (
            Transaction.objects.filter(
                user=request.user,
                type='expense',
                date__date__gte=previous_start,
                date__date__lte=previous_end,
            )
            .values('category__name')
            .annotate(total=Sum('amount'))
        )
        current_map = {row['category__name'] or 'Uncategorized': float(row['total'] or 0) for row in current_rows}
        previous_map = {row['category__name'] or 'Uncategorized': float(row['total'] or 0) for row in previous_rows}
        categories = sorted(set(current_map) | set(previous_map))
        comparison = []
        for category in categories:
            current_total = current_map.get(category, 0)
            previous_total = previous_map.get(category, 0)
            change = current_total - previous_total
            percent_change = (change / previous_total * 100) if previous_total else None
            comparison.append({
                'category': category,
                'current_total': current_total,
                'previous_total': previous_total,
                'change': change,
                'percent_change': round(percent_change, 1) if percent_change is not None else None,
            })
        return Response({
            'current_month': current_start.isoformat(),
            'previous_month': previous_start.isoformat(),
            'comparison': comparison,
        })

    @action(detail=False, methods=['get'])
    def investment_performance(self, request):
        holdings = InvestmentHolding.objects.filter(user=request.user).select_related('account')
        total_cost = sum(float(h.cost_basis) for h in holdings)
        total_value = sum(float(h.current_value) for h in holdings)
        total_gain = total_value - total_cost
        data = []
        for holding in holdings:
            gain = float(holding.current_value) - float(holding.cost_basis)
            gain_percent = (gain / float(holding.cost_basis) * 100) if holding.cost_basis else 0
            data.append({
                'id': holding.id,
                'name': holding.name,
                'symbol': holding.symbol,
                'asset_type': holding.asset_type,
                'quantity': float(holding.quantity),
                'cost_basis': float(holding.cost_basis),
                'current_value': float(holding.current_value),
                'currency': holding.currency,
                'account': holding.account.name if holding.account else None,
                'gain': gain,
                'gain_percent': round(gain_percent, 1),
            })
        return Response({
            'total_cost': total_cost,
            'total_value': total_value,
            'total_gain': total_gain,
            'holdings': data,
        })

    @action(detail=False, methods=['get'])
    def income_streams(self, request):
        txs = Transaction.objects.filter(user=request.user, type='income')
        rows = (
            txs.values('income_source__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        data = [
            {'source': row['income_source__name'] or 'Uncategorized', 'total': float(row['total'] or 0)}
            for row in rows
        ]
        return Response(data)
