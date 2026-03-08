import { addMonths, addWeeks, addYears, endOfMonth, endOfWeek, endOfYear, format, getDaysInMonth, isAfter, isWithinInterval, startOfMonth, startOfWeek, startOfYear, subMonths, subWeeks, subYears } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card } from '../components/ui';
import type { Transaction } from '../types';

type ViewMode = 'week' | 'month' | 'year';

interface StatsViewProps {
  transactions: Transaction[];
  onBack: () => void;
}

const MODE_LABEL: Record<ViewMode, string> = {
  week: '周',
  month: '月',
  year: '年',
};

export const StatsView = ({ transactions, onBack }: StatsViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [anchorDate, setAnchorDate] = useState(new Date());

  const range = useMemo(() => {
    if (viewMode === 'week') {
      return {
        start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
        end: endOfWeek(anchorDate, { weekStartsOn: 1 }),
      };
    }

    if (viewMode === 'year') {
      return {
        start: startOfYear(anchorDate),
        end: endOfYear(anchorDate),
      };
    }

    return {
      start: startOfMonth(anchorDate),
      end: endOfMonth(anchorDate),
    };
  }, [anchorDate, viewMode]);

  const periodExpenses = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.type === 'expense' &&
          isWithinInterval(new Date(transaction.date), {
            start: range.start,
            end: range.end,
          }),
      ),
    [range.end, range.start, transactions],
  );

  const totalExpense = periodExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);

  const averageExpense = useMemo(() => {
    if (viewMode === 'week') {
      return totalExpense / 7;
    }
    if (viewMode === 'year') {
      return totalExpense / 12;
    }
    return totalExpense / getDaysInMonth(anchorDate);
  }, [anchorDate, totalExpense, viewMode]);

  const chartData = useMemo(() => {
    if (viewMode === 'year') {
      return Array.from({ length: 12 }, (_, monthIndex) => {
        const value = periodExpenses
          .filter((transaction) => new Date(transaction.date).getMonth() === monthIndex)
          .reduce((sum, transaction) => sum + transaction.amount, 0);

        return {
          label: `${monthIndex + 1}月`,
          value,
        };
      });
    }

    if (viewMode === 'week') {
      const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

      return labels.map((label, index) => {
        const value = periodExpenses
          .filter((transaction) => {
            const day = new Date(transaction.date).getDay();
            const normalized = day === 0 ? 6 : day - 1;
            return normalized === index;
          })
          .reduce((sum, transaction) => sum + transaction.amount, 0);

        return { label, value };
      });
    }

    const days = getDaysInMonth(anchorDate);
    return Array.from({ length: days }, (_, dayIndex) => {
      const value = periodExpenses
        .filter((transaction) => new Date(transaction.date).getDate() === dayIndex + 1)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return {
        label: `${dayIndex + 1}日`,
        value,
      };
    });
  }, [anchorDate, periodExpenses, viewMode]);

  const pieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    periodExpenses.forEach((transaction) => {
      grouped[transaction.category] = (grouped[transaction.category] ?? 0) + transaction.amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodExpenses]);

  const canGoForward = useMemo(() => {
    const nextAnchor =
      viewMode === 'week' ? addWeeks(anchorDate, 1) : viewMode === 'year' ? addYears(anchorDate, 1) : addMonths(anchorDate, 1);

    const nextRangeEnd =
      viewMode === 'week'
        ? endOfWeek(nextAnchor, { weekStartsOn: 1 })
        : viewMode === 'year'
          ? endOfYear(nextAnchor)
          : endOfMonth(nextAnchor);

    return !isAfter(nextRangeEnd, new Date());
  }, [anchorDate, viewMode]);

  const goPrev = () => {
    if (viewMode === 'week') {
      setAnchorDate((prev) => subWeeks(prev, 1));
      return;
    }
    if (viewMode === 'year') {
      setAnchorDate((prev) => subYears(prev, 1));
      return;
    }
    setAnchorDate((prev) => subMonths(prev, 1));
  };

  const goNext = () => {
    if (!canGoForward) {
      return;
    }

    if (viewMode === 'week') {
      setAnchorDate((prev) => addWeeks(prev, 1));
      return;
    }
    if (viewMode === 'year') {
      setAnchorDate((prev) => addYears(prev, 1));
      return;
    }
    setAnchorDate((prev) => addMonths(prev, 1));
  };

  const title =
    viewMode === 'week'
      ? `${format(range.start, 'MM/dd', { locale: zhCN })} - ${format(range.end, 'MM/dd', { locale: zhCN })}`
      : viewMode === 'year'
        ? format(anchorDate, 'yyyy年', { locale: zhCN })
        : format(anchorDate, 'yyyy年 M月', { locale: zhCN });

  return (
    <motion.div
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.22 }}
      className="space-y-4 px-4 pb-24 pt-6"
    >
      <button onClick={onBack} className="px-2 text-sm font-semibold text-brand-500">
        ← 返回账单列表
      </button>

      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          {(Object.keys(MODE_LABEL) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded-xl py-2 text-sm font-semibold transition ${
                viewMode === mode ? 'bg-white text-green-600 shadow-soft' : 'text-slate-500'
              }`}
            >
              {MODE_LABEL[mode]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={goPrev} className="rounded-full bg-slate-100 p-2">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="text-center">
            <p className="text-xs text-slate-400">{viewMode === 'year' ? '年份' : viewMode === 'week' ? '本周' : '月份'}</p>
            <p className="text-xl font-black text-slate-900">{title}</p>
          </div>
          <button onClick={goNext} disabled={!canGoForward} className="rounded-full bg-slate-100 p-2 disabled:opacity-40">
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-500">总支出</p>
            <p className="text-3xl font-black text-slate-900">¥{totalExpense.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{viewMode === 'year' ? '月均' : '日均'}</p>
            <p className="text-2xl font-bold text-slate-600">¥{averageExpense.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef2ff" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={viewMode === 'month' ? 4 : 0}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip formatter={(value: number) => [`¥${value.toFixed(2)}`, '支出']} />
              <Area type="monotone" dataKey="value" stroke="#22c55e" fill="url(#expense-gradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-lg font-black text-slate-900">分类占比</h3>
        {pieData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">暂无数据</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={62}
                    innerRadius={34}
                    fill="#4f46e5"
                    labelLine={false}
                  />
                  <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1">
              {pieData.map((item) => {
                const percent = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                return (
                  <div key={item.name} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      ¥{item.value.toFixed(2)} · {percent.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
