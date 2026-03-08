import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  ClipboardPaste,
  PenLine,
  ScanText,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useDeepSeekParser } from '../../hooks';
import { Button } from '../../components/ui';
import { CATEGORIES, ParsedTransactionData } from '../../types';

interface Props {
  onAdd: (data: ParsedTransactionData) => void;
  onClose: () => void;
  initialText?: string;
  autoPaste?: boolean;
  mode?: 'add' | 'edit';
  initialData?: ParsedTransactionData;
  onDelete?: () => void;
}

const DRAG_CLOSE_DISTANCE = 140;
const DRAG_CLOSE_VELOCITY = 900;

export const SmartEntry: React.FC<Props> = ({
  onAdd,
  onClose,
  initialText = '',
  autoPaste = false,
  mode = 'add',
  initialData,
  onDelete,
}) => {
  const [input, setInput] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [showAutoPasteOverlay, setShowAutoPasteOverlay] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const dragControls = useDragControls();

  const { parseText, retryLast, isParsing, error: parseError, clearParseError } = useDeepSeekParser();

  const [parsedData, setParsedData] = useState<ParsedTransactionData | null>(() => {
    if (initialData) {
      return initialData;
    }

    const isShortcutAction = Boolean(initialText) || autoPaste;
    if (mode === 'add' && !isShortcutAction) {
      return {
        amount: 0,
        type: 'expense',
        category: '餐饮',
        description: '',
        date: new Date().toISOString(),
      };
    }

    return null;
  });

  useEffect(() => {
    if (mode !== 'add') {
      return;
    }

    if (initialText) {
      void handleParse(initialText);
      return;
    }

    if (autoPaste && !parsedData) {
      void attemptAutoPaste();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText, autoPaste, mode]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const syncInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
    };

    syncInset();
    viewport.addEventListener('resize', syncInset);
    viewport.addEventListener('scroll', syncInset);

    return () => {
      viewport.removeEventListener('resize', syncInset);
      viewport.removeEventListener('scroll', syncInset);
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const contentBottomPadding = useMemo(() => {
    return `calc(env(safe-area-inset-bottom) + ${Math.max(12, keyboardInset)}px)`;
  }, [keyboardInset]);

  const attemptAutoPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text);
        await handleParse(text);
      } else {
        setShowAutoPasteOverlay(true);
      }
    } catch {
      setShowAutoPasteOverlay(true);
    }
  };

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || input;
    if (!text.trim()) {
      return;
    }

    setError(null);
    clearParseError();
    setShowAutoPasteOverlay(false);

    try {
      const result = await parseText(text, { retries: 1 });
      setParsedData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '无法识别内容。';
      setError(message);
    }
  };

  const handleRetry = async () => {
    setError(null);
    clearParseError();

    try {
      const result = await retryLast();
      setParsedData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '重试失败，请稍后再试。';
      setError(message);
    }
  };

  const handleManualEntry = () => {
    setParsedData({
      amount: 0,
      type: 'expense',
      category: '餐饮',
      description: '',
      date: new Date().toISOString(),
    });
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setError(null);
      if (text.trim()) {
        await handleParse(text);
      }
    } catch {
      setError('无法访问剪贴板，请手动粘贴或在设置中允许。');
      setShowAutoPasteOverlay(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedData) {
      return;
    }

    if (parsedData.amount <= 0 && mode === 'add') {
      setError('金额必须大于 0');
      return;
    }

    onAdd(parsedData);
    onClose();
  };

  const toLocalISOString = (isoString: string) => {
    if (!isoString) {
      return '';
    }

    try {
      const date = new Date(isoString);
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1.5px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="flex min-h-full items-end justify-center">
          <motion.div
            role="dialog"
            aria-modal="true"
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > DRAG_CLOSE_DISTANCE || info.velocity.y > DRAG_CLOSE_VELOCITY) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <button
              type="button"
              onPointerDown={(event) => dragControls.start(event)}
              className="flex w-full justify-center py-3"
              aria-label="拖动关闭"
            >
              <span className="h-1.5 w-10 rounded-full bg-slate-300" />
            </button>

            <div
              className="max-h-[86dvh] overflow-y-auto px-5 pb-4 no-scrollbar"
              style={{ paddingBottom: contentBottomPadding }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-500">
                  {mode === 'add' && !parsedData ? <Sparkles className="h-5 w-5" /> : null}
                  {mode === 'edit' || parsedData ? <PenLine className="h-5 w-5" /> : null}
                  <h2 className="text-lg font-bold text-slate-900">
                    {mode === 'edit' ? '编辑账单' : parsedData ? '记一笔' : 'AI 智能记账'}
                  </h2>
                </div>
                <button onClick={onClose} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200">
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              {!parsedData ? (
                <>
                  <div className="relative mb-4">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="在此粘贴截图识别出的文字..."
                      className="h-44 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      autoFocus={!showAutoPasteOverlay}
                    />

                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => void handlePaste()}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all active:scale-95"
                        title="从剪贴板粘贴"
                      >
                        <ClipboardPaste className="h-4 w-4" /> 粘贴
                      </button>
                    </div>

                    {showAutoPasteOverlay ? (
                      <div
                        onClick={() => void handlePaste()}
                        className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/95 backdrop-blur-sm"
                      >
                        <div className="mb-3 rounded-full bg-brand-100 p-4 text-brand-600">
                          <ScanText className="h-10 w-10" />
                        </div>
                        <p className="text-xl font-bold text-brand-600">点击屏幕开始分析</p>
                        <p className="mt-2 text-sm text-brand-400">已从快捷指令跳转</p>
                      </div>
                    ) : null}
                  </div>

                  {error || parseError ? (
                    <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3">
                      <p className="text-xs text-red-500">{error || parseError}</p>
                      <button
                        onClick={() => void handleRetry()}
                        className="mt-2 text-xs font-semibold text-red-600 underline"
                        disabled={isParsing}
                      >
                        重试一次
                      </button>
                    </div>
                  ) : null}

                  <Button
                    onClick={() => void handleParse()}
                    loading={isParsing}
                    className="mb-4 w-full"
                    disabled={!input.trim()}
                  >
                    {initialText ? '正在分析...' : '开始分析'}
                  </Button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-100" />
                    <span className="mx-4 flex-shrink-0 text-xs text-slate-300">或者</span>
                    <div className="flex-grow border-t border-slate-100" />
                  </div>

                  <button
                    onClick={handleManualEntry}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  >
                    <PenLine className="h-4 w-4" /> 直接手动记账
                  </button>
                </>
              ) : (
                <div className="space-y-5">
                  <div
                    className={`rounded-2xl border p-5 transition-colors ${
                      parsedData.type === 'income' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex rounded-lg bg-white/70 p-1">
                        <button
                          onClick={() => setParsedData({ ...parsedData, type: 'expense' })}
                          className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold transition-all ${
                            parsedData.type === 'expense' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'
                          }`}
                        >
                          <ArrowUpCircle className="h-3 w-3" /> 支出
                        </button>
                        <button
                          onClick={() => setParsedData({ ...parsedData, type: 'income' })}
                          className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold transition-all ${
                            parsedData.type === 'income' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'
                          }`}
                        >
                          <ArrowDownCircle className="h-3 w-3" /> 收入
                        </button>
                      </div>

                      <input
                        type="datetime-local"
                        value={toLocalISOString(parsedData.date)}
                        onChange={(event) => {
                          const localValue = event.target.value;
                          if (!localValue) {
                            return;
                          }
                          setParsedData({ ...parsedData, date: new Date(localValue).toISOString() });
                        }}
                        className="min-w-0 bg-transparent text-right text-xs font-medium text-slate-500 outline-none"
                      />
                    </div>

                    <div className="relative">
                      <span
                        className={`absolute left-0 top-0 text-xl font-bold ${
                          parsedData.type === 'income' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        ¥
                      </span>
                      <input
                        type="number"
                        value={parsedData.amount === 0 ? '' : parsedData.amount}
                        onChange={(event) => {
                          const value = Number.parseFloat(event.target.value);
                          setParsedData({ ...parsedData, amount: Number.isNaN(value) ? 0 : value });
                        }}
                        placeholder="0.00"
                        className={`block w-full border-b border-transparent bg-transparent pl-6 text-4xl font-extrabold outline-none transition-colors hover:border-black/10 ${
                          parsedData.type === 'income' ? 'text-red-700' : 'text-green-700'
                        } placeholder:text-slate-300`}
                        autoFocus={mode !== 'edit'}
                      />
                    </div>
                  </div>

                  {error ? <p className="text-center text-xs text-red-500">{error}</p> : null}

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">商户 / 描述</label>
                      <input
                        type="text"
                        value={parsedData.description}
                        onChange={(event) => setParsedData({ ...parsedData, description: event.target.value })}
                        placeholder="例如：午饭、打车..."
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">分类</label>
                      <div className="no-scrollbar flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                        {CATEGORIES.map((category) => (
                          <button
                            key={category}
                            onClick={() => setParsedData({ ...parsedData, category })}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                              parsedData.category === category
                                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    {mode === 'edit' && onDelete ? (
                      <Button variant="danger" onClick={onDelete} className="flex-1">
                        <Trash2 className="mr-1 h-4 w-4" /> 删除
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setParsedData(null);
                          setError(null);
                        }}
                        className="flex-1"
                      >
                        <Sparkles className="mr-1 h-4 w-4 text-brand-500" /> AI 记账
                      </Button>
                    )}

                    <Button onClick={handleConfirm} className="flex-[1.7]">
                      <Check className="mr-1 h-5 w-5" /> {mode === 'edit' ? '保存修改' : '确认记账'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
