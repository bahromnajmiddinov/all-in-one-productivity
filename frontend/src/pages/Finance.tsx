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

export function Finance() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Personal Finance Tracking</h1>
      <FinanceOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Accounts</h2>
            <AccountList />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Income Streams</h2>
            <IncomeStreams />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Expense Categories</h2>
            <CategoryManager />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Add Transaction</h2>
            <TransactionForm onSaved={() => {}} />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">New Budget</h2>
            <BudgetForm onSaved={() => {}} />
          </section>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Recent Transactions</h2>
            <TransactionList />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Spending Trends</h2>
            <SpendingTrends />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Budget vs. Actual</h2>
            <BudgetVsActual />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Financial Goals</h2>
            <GoalsTracker />
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded border p-4 bg-bg-elevated">
          <h2 className="text-lg font-medium mb-3">Cash Flow Visualization</h2>
          <CashFlowSankey />
        </section>
        <section className="rounded border p-4 bg-bg-elevated">
          <h2 className="text-lg font-medium mb-3">Category Spending Heatmap</h2>
          <CategoryHeatmap />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded border p-4 bg-bg-elevated">
          <h2 className="text-lg font-medium mb-3">Month-over-Month Comparison</h2>
          <MonthOverMonthComparison />
        </section>
        <section className="rounded border p-4 bg-bg-elevated">
          <h2 className="text-lg font-medium mb-3">Recurring Transactions</h2>
          <RecurringTransactions />
        </section>
      </div>

      <section className="rounded border p-4 bg-bg-elevated">
        <h2 className="text-lg font-medium mb-3">Investment Portfolio</h2>
        <InvestmentPortfolio />
      </section>
    </div>
  );
}
