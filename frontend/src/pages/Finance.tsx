import { useState } from 'react';
import { 
  Wallet, 
  Receipt, 
  PieChart, 
  Target, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  PiggyBank,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { AccountList } from '../components/finance/AccountList';
import { TransactionList } from '../components/finance/TransactionList';
import { TransactionForm } from '../components/finance/TransactionForm';
import { BudgetForm } from '../components/finance/BudgetForm';
import { SpendingTrends } from '../components/finance/SpendingTrends';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { BudgetVsActual } from '../components/finance/BudgetVsActual';
import { GoalsTracker } from '../components/finance/GoalsTracker';
import { IncomeStreams } from '../components/finance/IncomeStreams';
import { CashFlowSankey } from '../components/finance/CashFlowSankey';
import { CategoryHeatmap } from '../components/finance/CategoryHeatmap';
import { MonthOverMonthComparison } from '../components/finance/MonthOverMonthComparison';
import { InvestmentPortfolio } from '../components/finance/InvestmentPortfolio';
import { RecurringTransactions } from '../components/finance/RecurringTransactions';
import { CategoryManager } from '../components/finance/CategoryManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

type TabType = 'overview' | 'transactions' | 'budgets' | 'analytics' | 'goals';

const tabs = [
  { id: 'overview' as TabType, label: 'Overview', icon: Wallet },
  { id: 'transactions' as TabType, label: 'Transactions', icon: Receipt },
  { id: 'budgets' as TabType, label: 'Budgets', icon: PieChart },
  { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
  { id: 'goals' as TabType, label: 'Goals', icon: Target },
] as const;

const quickActions = [
  { id: 'income', label: 'Add Income', description: 'Record new earnings', icon: ArrowUpRight, color: 'success', tab: 'transactions' },
  { id: 'expense', label: 'Add Expense', description: 'Track spending', icon: ArrowDownRight, color: 'destructive', tab: 'transactions' },
  { id: 'budget', label: 'Set Budget', description: 'Manage limits', icon: PieChart, color: 'accent', tab: 'budgets' },
  { id: 'goal', label: 'New Goal', description: 'Save for targets', icon: Target, color: 'warning', tab: 'goals' },
] as const;

export function Finance() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-[var(--radius)] bg-success-subtle text-success">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-h1">Finance</h1>
          </div>
          <p className="text-body max-w-xl">
            Track your income, expenses, and financial goals in one place. 
            Stay on top of your financial health.
          </p>
        </div>
        <Button 
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowUpRight className="w-4 h-4 mr-1.5" />
          New Transaction
        </Button>
      </div>

      {/* Quick Stats - Always Visible */}
      <FinanceOverview key={refreshKey} />

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-fast',
                  activeTab === tab.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-fg-muted hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const colorClasses = {
                  success: 'bg-success-subtle text-success group-hover:bg-success group-hover:text-success-foreground',
                  destructive: 'bg-destructive-subtle text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground',
                  accent: 'bg-accent-subtle text-accent group-hover:bg-accent group-hover:text-white',
                  warning: 'bg-warning-subtle text-warning group-hover:bg-warning group-hover:text-warning-foreground',
                };
                
                return (
                  <Card 
                    key={action.id}
                    isInteractive 
                    className="group"
                    onClick={() => setActiveTab(action.tab as TabType)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-3 rounded-[var(--radius)] transition-fast',
                          colorClasses[action.color]
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold text-foreground">{action.label}</p>
                          <p className="text-caption text-fg-muted">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-fg-muted" />
                      Accounts
                    </CardTitle>
                    <CardDescription>Manage your bank accounts and wallets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AccountList onUpdate={handleDataChange} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-fg-muted" />
                      Income Sources
                    </CardTitle>
                    <CardDescription>Track where your money comes from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IncomeStreams onUpdate={handleDataChange} />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-fg-muted" />
                      Recent Transactions
                    </CardTitle>
                    <CardDescription>Your latest financial activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionList limit={5} onUpdate={handleDataChange} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-fg-muted" />
                      Spending Overview
                    </CardTitle>
                    <CardDescription>Income vs expenses over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SpendingTrends compact />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Transaction</CardTitle>
                  <CardDescription>Record a new income or expense</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionForm onSaved={handleDataChange} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Manage expense categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryManager onUpdate={handleDataChange} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription>View and manage your transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionList onUpdate={handleDataChange} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Create Budget</CardTitle>
                  <CardDescription>Set a new spending limit</CardDescription>
                </CardHeader>
                <CardContent>
                  <BudgetForm onSaved={handleDataChange} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-fg-muted" />
                    Budget Status
                  </CardTitle>
                  <CardDescription>Track your spending against budgets</CardDescription>
                </CardHeader>
                <CardContent>
                  <BudgetVsActual />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recurring Transactions</CardTitle>
                  <CardDescription>Manage scheduled payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecurringTransactions />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow</CardTitle>
                  <CardDescription>Visualize money movement</CardDescription>
                </CardHeader>
                <CardContent>
                  <CashFlowSankey />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Heatmap</CardTitle>
                  <CardDescription>Spending patterns by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryHeatmap />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Month Comparison</CardTitle>
                  <CardDescription>Compare spending month over month</CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthOverMonthComparison />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investment Portfolio</CardTitle>
                  <CardDescription>Track your investments</CardDescription>
                </CardHeader>
                <CardContent>
                  <InvestmentPortfolio />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Trends</CardTitle>
                <CardDescription>Comprehensive spending analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <SpendingTrends />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-fg-muted" />
                  Financial Goals
                </CardTitle>
                <CardDescription>Track your savings targets and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <GoalsTracker />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
