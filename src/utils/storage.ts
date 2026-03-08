import { transactionListSchema } from '../types/schemas';
import type { Transaction } from '../types';

const STORAGE_KEY = 'gemini-expenses';

export const loadTransactions = (): Transaction[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    const result = transactionListSchema.safeParse(parsed);

    if (!result.success) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return result.data;
  } catch {
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // ignore quota / serialization errors in UI thread
  }
};
