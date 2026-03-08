import { format, isSameDay, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { TransactionCard } from '../components/common/TransactionCard';
import { Button, Card } from '../components/ui';
import type { Transaction } from '../types';

interface HomeViewProps {
  transactions: Transaction[];
  onOpenStats: () => void;
  onOpenShortcutGuide: () => void;
  onOpenSmartEntry: () => void;
  onStartEditing: (id: string) => void;
}

interface GroupedTransaction {
  date: Date;
  items: Transaction[];
  totalExpense: number;
}

const groupByDate = (transactions: Transaction[]): GroupedTransaction[] => {
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const groups: GroupedTransaction[] = [];

  sorted.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const existing = groups.find((group) => isSameDay(group.date, transactionDate));

    if (existing) {
      existing.items.push(transaction);
      if (transaction.type === 'expense') {
        existing.totalExpense += transaction.amount;
      }
      return;
    }

    groups.push({
      date: transactionDate,
      items: [transaction],
      totalExpense: transaction.type === 'expense' ? transaction.amount : 0,
    });
  });

  return groups;
};

export const HomeView = ({
  transactions,
  onOpenStats,
  onOpenShortcutGuide,
  onOpenSmartEntry,
  onStartEditing,
}: HomeViewProps) => {
  const now = new Date();
  const monthlyTransactions = transactions.filter((transaction) => isSameMonth(new Date(transaction.date), now));

  const totalExpense = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalIncome = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const groupedTransactions = groupByDate(transactions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="space-y-4"
    >
      <header className="rounded-b-3xl bg-white px-6 pb-6 pt-10 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">我的账本</h1>
          <Button variant="secondary" size="sm" onClick={onOpenShortcutGuide} className="rounded-full bg-brand-50 text-brand-600">
            <Zap className="h-4 w-4" /> 敲一敲记账
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-green-100 bg-green-50/70 p-4" elevated={false}>
            <p className="text-xs font-semibold text-green-700">本月支出</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-green-700">¥{totalExpense.toFixed(2)}</p>
          </Card>
          <Card className="border-rose-100 bg-rose-50/70 p-4" elevated={false}>
            <p className="text-xs font-semibold text-rose-700">本月收入</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-rose-700">¥{totalIncome.toFixed(2)}</p>
          </Card>
        </div>
      </header>

      <section className="px-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-900">最近账单</h2>
          <button onClick={onOpenStats} className="text-sm font-semibold text-brand-500">
            查看分析
          </button>
        </div>

        {groupedTransactions.length === 0 ? (
          <Card className="mx-1 border-dashed border-slate-200 py-12 text-center" elevated={false}>
            <p className="mb-4 text-slate-500">暂无账单</p>
            <Button onClick={onOpenSmartEntry}>点击 + 开始记账</Button>
          </Card>
        ) : (
          <div className="space-y-5">
            {groupedTransactions.map((group) => (
              <div key={group.date.toISOString()}>
                <div className="mb-2 flex items-end justify-between px-2">
                  <span className="text-xs font-medium text-slate-500">
                    {format(group.date, 'MM月dd日 EEEE', { locale: zhCN })}
                  </span>
                  {group.totalExpense > 0 ? (
                    <span className="text-xs text-slate-400">
                      支出: <span className="font-bold text-green-600">{Math.floor(group.totalExpense)}</span>
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {group.items.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onClick={() => onStartEditing(transaction.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
};
