export interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  date: string; // ISO string
  createdAt: number;
}

export interface ParsedTransactionData {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  date: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ADD = 'ADD',
  STATS = 'STATS'
}

export const CATEGORIES = [
  '餐饮',
  '购物',
  '日用',
  '交通',
  '水果',
  '运动',
  '娱乐',
  '通讯',
  '服饰',
  '美容',
  '酒店',
  '数码',
  '工资',
  '兼职',
  '理财',
  '其他'
];