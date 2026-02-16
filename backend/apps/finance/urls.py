from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import (
    AccountViewSet,
    CategoryViewSet,
    TransactionViewSet,
    BudgetViewSet,
    GoalViewSet,
    RecurringTransactionViewSet,
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='finance-account')
router.register(r'categories', CategoryViewSet, basename='finance-category')
router.register(r'transactions', TransactionViewSet, basename='finance-transaction')
router.register(r'budgets', BudgetViewSet, basename='finance-budget')
router.register(r'goals', GoalViewSet, basename='finance-goal')
router.register(r'recurring', RecurringTransactionViewSet, basename='finance-recurring')

urlpatterns = [
    path('', include(router.urls)),
]
