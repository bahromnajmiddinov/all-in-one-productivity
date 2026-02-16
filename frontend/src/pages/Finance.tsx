import { AccountList } from '../components/finance/AccountList';
import { TransactionList } from '../components/finance/TransactionList';
import { TransactionForm } from '../components/finance/TransactionForm';
import { BudgetForm } from '../components/finance/BudgetForm';
import { SpendingTrends } from '../components/finance/SpendingTrends';

export function Finance() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Finance</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Accounts</h2>
            <AccountList />
          </section>
          <section className="rounded border p-4 bg-bg-elevated">
            <h2 className="text-lg font-medium mb-3">Add Transaction</h2>
            <TransactionForm onSaved={() => { /* refresh logic in future */ }} />
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
            <h2 className="text-lg font-medium mb-3">Visualizations</h2>
            <SpendingTrends />
          </section>
        </div>
      </div>
    </div>
  );
}
