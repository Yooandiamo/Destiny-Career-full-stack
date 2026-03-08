import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ViewState, type ParsedTransactionData, type Transaction } from '../types';
import { loadTransactions, saveTransactions } from '../utils/storage';

type ModalState = {
  smartEntry: boolean;
  shortcutGuide: boolean;
};

interface ExpenseState {
  transactions: Transaction[];
  view: ViewState;
  modals: ModalState;
  editingTransactionId: string | null;
  initialSmartText: string;
  shouldAutoPaste: boolean;

  setView: (view: ViewState) => void;
  addTransaction: (data: ParsedTransactionData) => void;
  updateTransaction: (id: string, data: ParsedTransactionData) => void;
  deleteTransaction: (id: string) => void;

  openSmartEntry: (payload?: { initialText?: string; autoPaste?: boolean }) => void;
  closeSmartEntry: () => void;
  openShortcutGuide: () => void;
  closeShortcutGuide: () => void;

  startEditing: (id: string) => void;
  stopEditing: () => void;
}

const persistTransactions = (transactions: Transaction[]) => {
  saveTransactions(transactions);
  return transactions;
};

export const useExpenseStore = create<ExpenseState>((set) => ({
  transactions: loadTransactions(),
  view: ViewState.DASHBOARD,
  modals: {
    smartEntry: false,
    shortcutGuide: false,
  },
  editingTransactionId: null,
  initialSmartText: '',
  shouldAutoPaste: false,

  setView: (view) => set({ view }),

  addTransaction: (data) =>
    set((state) => {
      const next = persistTransactions([
        {
          id: uuidv4(),
          ...data,
          createdAt: Date.now(),
        },
        ...state.transactions,
      ]);

      return {
        transactions: next,
        modals: { ...state.modals, smartEntry: false },
        initialSmartText: '',
        shouldAutoPaste: false,
      };
    }),

  updateTransaction: (id, data) =>
    set((state) => {
      const next = persistTransactions(
        state.transactions.map((transaction) =>
          transaction.id === id ? { ...transaction, ...data } : transaction,
        ),
      );

      return {
        transactions: next,
        editingTransactionId: null,
      };
    }),

  deleteTransaction: (id) =>
    set((state) => {
      const next = persistTransactions(state.transactions.filter((transaction) => transaction.id !== id));

      return {
        transactions: next,
        editingTransactionId: state.editingTransactionId === id ? null : state.editingTransactionId,
      };
    }),

  openSmartEntry: (payload) =>
    set((state) => ({
      modals: { ...state.modals, smartEntry: true },
      initialSmartText: payload?.initialText ?? '',
      shouldAutoPaste: payload?.autoPaste ?? false,
    })),

  closeSmartEntry: () =>
    set((state) => ({
      modals: { ...state.modals, smartEntry: false },
      initialSmartText: '',
      shouldAutoPaste: false,
    })),

  openShortcutGuide: () => set((state) => ({ modals: { ...state.modals, shortcutGuide: true } })),
  closeShortcutGuide: () => set((state) => ({ modals: { ...state.modals, shortcutGuide: false } })),

  startEditing: (id) => set({ editingTransactionId: id }),
  stopEditing: () => set({ editingTransactionId: null }),
}));
