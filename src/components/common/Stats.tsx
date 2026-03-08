import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Transaction, CATEGORIES } from '../../types';
import { 
  ChevronLeft, ChevronRight, 
  Coffee, ShoppingBag, Home, Car, Apple, Dumbbell, Film, Smartphone, Shirt, Sparkles, Bed, Laptop, CreditCard, Banknote, TrendingUp, HelpCircle 
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

type ViewMode = 'week' | 'month' | 'year';

export const Stats: React.FC<Props> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Date Helpers ---

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfWeek = (date: Date) => {
    const d = getStartOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const getEndOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  const getStartOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
  const getEndOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

  const navigate = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDateLabel = (date: Date) => {
    if (viewMode === 'week') {
      const start = getStartOfWeek(date);
      const end = getEndOfWeek(date);
      return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
    }
    if (viewMode === 'month') {
      return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
    }
    return `${date.getFullYear()}年`;
  };

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
  }

  // --- Data Processing ---

  const { filteredTransactions, totalExpense, averageExpense, chartData, rankingData } = useMemo(() => {
    let start: Date, end: Date;
    
    if (viewMode === 'week') {
      start = getStartOfWeek(currentDate);
      end = getEndOfWeek(currentDate);
    } else if (viewMode === 'month') {
      start = getStartOfMonth(currentDate);
      end = getEndOfMonth(currentDate);
    } else {
      start = getStartOfYear(currentDate);
      end = getEndOfYear(currentDate);
    }

    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end && t.type === 'expense';
    });

    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate Average
    let avg = 0;
    if (viewMode === 'week') avg = total / 7;
    else if (viewMode === 'month') avg = total / end.getDate(); // Divide by days in month
    else avg = total / 12; // Monthly average for year view

    // Prepare Chart Data
    let dataPoints: any[] = [];
    const groupedByTime: Record<string, number> = {};

    filtered.forEach(t => {
      const tDate = new Date(t.date);
      let key = '';
      if (viewMode === 'week') {
        const days = ['周日','周一','周二','周三','周四','周五','周六'];
        key = days[tDate.getDay()];
      } else if (viewMode === 'month') {
        key = `${tDate.getMonth() + 1}-${tDate.getDate()}`;
      } else {
        key = `${tDate.getMonth() + 1}月`;
      }
      groupedByTime[key] = (groupedByTime[key] || 0) + t.amount;
    });

    if (viewMode === 'week') {
      const weekDays = ['周一','周二','周三','周四','周五','周六','周日'];
      dataPoints = weekDays.map(day => ({ name: day, value: groupedByTime[day] || 0 }));
    } else if (viewMode === 'month') {
      const daysInMonth = end.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const key = `${currentDate.getMonth() + 1}-${i}`;
        // Only show points for every 5 days or if it has data to reduce clutter, 
        // OR just show all but format axis interval
        dataPoints.push({ name: `${i}日`, value: groupedByTime[key] || 0, fullDate: key });
      }
    } else {
      for (let i = 1; i <= 12; i++) {
        const key = `${i}月`;
        dataPoints.push({ name: key, value: groupedByTime[key] || 0 });
      }
    }

    // Prepare Ranking Data
    const groupedByCategory: Record<string, number> = {};
    filtered.forEach(t => {
      groupedByCategory[t.category] = (groupedByCategory[t.category] || 0) + t.amount;
    });

    const ranking = Object.entries(groupedByCategory)
      .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    return { 
      filteredTransactions: filtered, 
      totalExpense: total, 
      averageExpense: avg, 
      chartData: dataPoints, 
      rankingData: ranking 
    };
  }, [transactions, viewMode, currentDate]);

  // --- Icon Helper ---
  const getIcon = (category: string) => {
    const style = "w-5 h-5";
    switch(category) {
      case '餐饮': return <Coffee className={`${style} text-orange-500`} />;
      case '购物': return <ShoppingBag className={`${style} text-pink-500`} />;
      case '日用': return <Home className={`${style} text-yellow-500`} />;
      case '交通': return <Car className={`${style} text-blue-500`} />;
      case '水果': return <Apple className={`${style} text-red-400`} />;
      case '运动': return <Dumbbell className={`${style} text-indigo-500`} />;
      case '娱乐': return <Film className={`${style} text-purple-500`} />;
      case '通讯': return <Smartphone className={`${style} text-cyan-500`} />;
      case '服饰': return <Shirt className={`${style} text-rose-500`} />;
      case '美容': return <Sparkles className={`${style} text-fuchsia-500`} />;
      case '酒店': return <Bed className={`${style} text-teal-500`} />;
      case '数码': return <Laptop className={`${style} text-slate-500`} />;
      default: return <HelpCircle className={`${style} text-gray-400`} />;
    }
  };

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* 1. Top Tabs */}
      <div className="bg-gray-50 p-1 mx-4 mt-4 rounded-xl flex sticky top-0 z-10">
        {(['week', 'month', 'year'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              viewMode === mode 
                ? 'bg-white text-green-600 shadow-sm' // Active: Green
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {mode === 'week' ? '周' : mode === 'month' ? '月' : '年'}
          </button>
        ))}
      </div>

      {/* 2. Date Navigator */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1 font-medium">
             {viewMode === 'week' ? `第 ${getWeekNumber(currentDate)} 周` : 
              viewMode === 'month' ? '月份' : '年份'}
          </p>
          <p className="text-lg font-bold text-gray-800">{formatDateLabel(currentDate)}</p>
        </div>
        <button onClick={() => navigate(1)} 
          className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 disabled:opacity-30"
          disabled={
             (viewMode === 'week' && getEndOfWeek(currentDate) > new Date()) ||
             (viewMode === 'month' && getEndOfMonth(currentDate) > new Date()) ||
             (viewMode === 'year' && getEndOfYear(currentDate) > new Date())
          }
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 3. Summary */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-end border-b border-gray-100 pb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">总支出</p>
            <p className="text-2xl font-bold text-gray-900">¥{totalExpense.toFixed(2)}</p>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-400 mb-1">
               {viewMode === 'year' ? '月均' : '日均'}值
             </p>
             <p className="text-lg font-bold text-gray-500">¥{averageExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 4. Chart */}
      <div className="h-48 w-full px-2 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/> {/* Green-500 */}
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fill: '#9CA3AF'}} 
              interval={viewMode === 'month' ? 4 : 0} // Avoid clutter in month view
              padding={{ left: 10, right: 10 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4' }} // Green cursor
              formatter={(value: number) => [`¥${value.toFixed(2)}`, '支出']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#22c55e" // Green-500
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#16a34a' }} // Green-600
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 5. Ranking List */}
      <div className="px-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4">支出排行榜</h3>
        <div className="space-y-5">
          {rankingData.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">暂无数据</div>
          ) : (
            rankingData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {getIcon(item.name)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.name} <span className="text-gray-400 text-xs ml-1">{item.percent.toFixed(1)}%</span></span>
                    <span className="text-sm font-bold text-gray-900">¥{item.value.toFixed(1)}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" // Green Bar
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};