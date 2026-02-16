from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class Account(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=200)
    account_type = models.CharField(max_length=50, default='bank')
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='USD')

    def __str__(self):
        return f"{self.name} ({self.currency})"


class Category(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='finance_categories')
    name = models.CharField(max_length=200)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')

    def __str__(self):
        return self.name


class IncomeSource(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='income_sources')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Transaction(models.Model):
    TYPE_CHOICES = (('expense', 'Expense'), ('income', 'Income'), ('transfer', 'Transfer'))

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='transactions')
    income_source = models.ForeignKey(
        IncomeSource,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='transactions',
    )
    memo = models.TextField(blank=True)
    date = models.DateTimeField(default=timezone.now)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.type} {self.amount} {self.currency}"


class Budget(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budgets')
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='budgets')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return self.name


class Goal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=200)
    target_amount = models.DecimalField(max_digits=14, decimal_places=2)
    current_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    target_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name


class RecurringTransaction(models.Model):
    FREQUENCY_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recurring_transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='recurring_transactions')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    type = models.CharField(max_length=10, choices=Transaction.TYPE_CHOICES)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    memo = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    interval = models.PositiveIntegerField(default=1)
    next_run = models.DateTimeField(null=True, blank=True)
    last_run = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"Recurring {self.amount} {self.currency} ({self.frequency})"


class InvestmentHolding(models.Model):
    ASSET_TYPES = (
        ('stock', 'Stock'),
        ('fund', 'Fund'),
        ('crypto', 'Crypto'),
        ('bond', 'Bond'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='investment_holdings')
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.SET_NULL, related_name='investments')
    name = models.CharField(max_length=200)
    symbol = models.CharField(max_length=50, blank=True)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPES, default='stock')
    quantity = models.DecimalField(max_digits=16, decimal_places=4, default=Decimal('0.0000'))
    cost_basis = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    current_value = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='USD')
    last_updated = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name


class NetWorthSnapshot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='net_worth_snapshots')
    date = models.DateField()
    assets = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    liabilities = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    net_worth = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['date']

    def save(self, *args, **kwargs):
        self.net_worth = self.assets - self.liabilities
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} - {self.net_worth}"
