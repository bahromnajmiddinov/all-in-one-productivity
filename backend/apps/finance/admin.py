from django.contrib import admin

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


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'account_type', 'balance')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'parent')


@admin.register(IncomeSource)
class IncomeSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'active')
    list_filter = ('active',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'account', 'amount', 'currency', 'type', 'date')
    list_filter = ('type', 'currency')


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'amount', 'start_date', 'end_date')


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'target_amount', 'current_amount', 'target_date')


@admin.register(RecurringTransaction)
class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'account', 'amount', 'frequency', 'next_run', 'active')


@admin.register(InvestmentHolding)
class InvestmentHoldingAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'asset_type', 'current_value', 'currency')
    list_filter = ('asset_type', 'currency')


@admin.register(NetWorthSnapshot)
class NetWorthSnapshotAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'assets', 'liabilities', 'net_worth')
    ordering = ('-date',)
