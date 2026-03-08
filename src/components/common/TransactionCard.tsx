import React from 'react';
import { Transaction } from '../../types';
import { 
  Coffee, Car, ShoppingBag, Film, Home, CreditCard, HelpCircle, TrendingUp, 
  Smartphone, Shirt, Bed, Laptop, Banknote, Apple, Dumbbell, Sparkles 
} from 'lucide-react';

interface Props {
  transaction: Transaction;
  onClick: () => void;
}

export const TransactionCard: React.FC<Props> = ({ transaction, onClick }) => {
  const dateObj = new Date(transaction.date);
  const isIncome = transaction.type === 'income';
  
  const getIcon = (category: string) => {
    switch(category) {
      // 支出类
      case '餐饮': return <Coffee className="w-5 h-5 text-orange-500" />;
      case '购物': return <ShoppingBag className="w-5 h-5 text-pink-500" />;
      case '日用': return <Home className="w-5 h-5 text-yellow-500" />;
      case '交通': return <Car className="w-5 h-5 text-blue-500" />;
      case '水果': return <Apple className="w-5 h-5 text-red-400" />;
      case '运动': return <Dumbbell className="w-5 h-5 text-indigo-500" />;
      case '娱乐': return <Film className="w-5 h-5 text-purple-500" />;
      case '通讯': return <Smartphone className="w-5 h-5 text-cyan-500" />;
      case '服饰': return <Shirt className="w-5 h-5 text-rose-500" />;
      case '美容': return <Sparkles className="w-5 h-5 text-fuchsia-500" />;
      case '酒店': return <Bed className="w-5 h-5 text-teal-500" />;
      case '数码': return <Laptop className="w-5 h-5 text-slate-500" />;
      
      // 收入类
      case '工资': return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case '兼职': return <Banknote className="w-5 h-5 text-lime-600" />;
      case '理财': return <TrendingUp className="w-5 h-5 text-red-500" />;
      
      // 其他
      default: return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group transition-all hover:shadow-md active:bg-gray-50 active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Icon Background: Income=Red, Expense=Green */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-red-50' : 'bg-green-50'}`}>
          {getIcon(transaction.category)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{transaction.description}</h3>
          <p className="text-xs text-gray-400">
            {dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <div className="text-right">
        {/* Amount Text: Income=Red, Expense=Green */}
        <span className={`font-bold block text-lg ${isIncome ? 'text-red-600' : 'text-green-600'}`}>
          {isIncome ? '+' : ''}{Math.floor(transaction.amount) === transaction.amount ? transaction.amount : transaction.amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
