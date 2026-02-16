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
  AlertCircle
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

type TabType = 'overview' | 'transactions' | 'budgets' | 'analytics' | 'goals';

const tabs = [
  { id: 'overview' as TabType, label: 'Overview', icon: Wallet },
  { id: 'transactions' as TabType, label: 'Transactions', icon: Receipt },
  { id: 'budgets' as TabType, label: 'Budgets', icon: PieChart },
  { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
  { id: 'goals' as TabType, label: 'Goals', icon: Target },
] as const;

export function Finance() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-fg-muted mt-2 max-w-md">
            Track your income, expenses, and financial goals in one place
          </p>
        </div>
        <Button 
          variant="primary" 
          className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowUpRight className="w-4 h-4" />
          New Transaction
        </Button>
      </div>

      {/* Quick Stats - Always Visible */}
      <FinanceOverview key={refreshKey} />

      {/* Tab Navigation */}
      <div className="border-b border-border/60">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2.5 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200
                  ${activeTab === tab.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-fg-muted hover:text-foreground hover:border-border/60'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-soft-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group" onClick={() => setActiveTab('transactions')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform duration-200">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Add Income</p>
                      <p className="text-xs text-fg-muted">Record new earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-soft-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group" onClick={() => setActiveTab('transactions')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform duration-200">
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Add Expense</p>
                      <p className="text-xs text-fg-muted">Track spending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-soft-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group" onClick={() => setActiveTab('budgets')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-200">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Set Budget</p>
                      <p className="text-xs text-fg-muted">Manage limits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-soft-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group" onClick={() => setActiveTab('goals')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform duration-200">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">New Goal</p>
                      <p className="text-xs text-fg-muted">Save for targets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2.5 text-lg">
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
                    <CardTitle className="flex items-center gap-2.5 text-lg">
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
                    <CardTitle className="flex items-center gap-2.5 text-lg">
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
                    <CardTitle className="flex items-center gap-2.5 text-lg">
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
                  <CardTitle className="text-lg">Add Transaction</CardTitle>
                  <CardDescription>Record a new income or expense</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionForm onSaved={handleDataChange} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
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
                  <CardTitle className="text-lg">All Transactions</CardTitle>
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
                  <CardTitle className="text-lg">Create Budget</CardTitle>
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
                  <CardTitle className="flex items-center gap-2.5 text-lg">
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
                  <CardTitle className="text-lg">Recurring Transactions</CardTitle>
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
                  <CardTitle className="text-lg">Cash Flow</CardTitle>
                  <CardDescription>Visualize money movement</CardDescription>
                </CardHeader>
                <CardContent>
                  <CashFlowSankey />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Category Heatmap</CardTitle>
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
                  <CardTitle className="text-lg">Month Comparison</CardTitle>
                  <CardDescription>Compare spending month over month</CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthOverMonthComparison />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investment Portfolio</CardTitle>
                  <CardDescription>Track your investments</CardDescription>
                </CardHeader>
                <CardContent>
                  <InvestmentPortfolio />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Trends</CardTitle>
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
                <CardTitle className="flex items-center gap-2.5 text-lg">
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
