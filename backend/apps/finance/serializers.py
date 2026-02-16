from rest_framework import serializers

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


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'
        read_only_fields = ('user',)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('user',)


class IncomeSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeSource
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
        depth = 1


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('user',)
        depth = 1


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ('user',)


class RecurringTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurringTransaction
        fields = '__all__'
        read_only_fields = ('user', 'last_run')
        depth = 1


class InvestmentHoldingSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentHolding
        fields = '__all__'
        read_only_fields = ('user', 'last_updated')
        depth = 1


class NetWorthSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = NetWorthSnapshot
        fields = '__all__'
        read_only_fields = ('user', 'net_worth')
