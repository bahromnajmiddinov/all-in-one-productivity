from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import (
    AccountViewSet,
    CategoryViewSet,
    IncomeSourceViewSet,
    TransactionViewSet,
    BudgetViewSet,
    GoalViewSet,
    RecurringTransactionViewSet,
    InvestmentHoldingViewSet,
    NetWorthSnapshotViewSet,
    FinanceAnalyticsViewSet,
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='finance-account')
router.register(r'categories', CategoryViewSet, basename='finance-category')
router.register(r'income-sources', IncomeSourceViewSet, basename='finance-income-source')
router.register(r'transactions', TransactionViewSet, basename='finance-transaction')
router.register(r'budgets', BudgetViewSet, basename='finance-budget')
router.register(r'goals', GoalViewSet, basename='finance-goal')
router.register(r'recurring', RecurringTransactionViewSet, basename='finance-recurring')
router.register(r'investments', InvestmentHoldingViewSet, basename='finance-investment')
router.register(r'net-worth', NetWorthSnapshotViewSet, basename='finance-net-worth')
router.register(r'analytics', FinanceAnalyticsViewSet, basename='finance-analytics')

urlpatterns = [
    path('', include(router.urls)),
]
