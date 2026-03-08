import { useCallback, useState } from 'react';
import type { ParsedTransactionData } from '../types';
import { parseTransactionWithAI } from '../services/geminiService';

interface ParseOptions {
  retries?: number;
}

export const useDeepSeekParser = () => {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<string>('');

  const parseText = useCallback(async (text: string, options?: ParseOptions): Promise<ParsedTransactionData> => {
    const retries = Math.max(0, options?.retries ?? 1);
    let attempt = 0;
    let lastError: Error | null = null;

    setIsParsing(true);
    setError(null);
    setLastInput(text);

    try {
      while (attempt <= retries) {
        try {
          const parsed = await parseTransactionWithAI(text);
          setError(null);
          return parsed;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('解析失败');
          attempt += 1;
        }
      }

      const message = lastError?.message ?? '无法识别账单，请稍后重试。';
      setError(message);
      throw new Error(message);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const retryLast = useCallback(async () => {
    if (!lastInput.trim()) {
      throw new Error('没有可重试的内容');
    }

    return parseText(lastInput, { retries: 1 });
  }, [lastInput, parseText]);

  const clearParseError = useCallback(() => setError(null), []);

  return {
    isParsing,
    error,
    parseText,
    retryLast,
    clearParseError,
  };
};
