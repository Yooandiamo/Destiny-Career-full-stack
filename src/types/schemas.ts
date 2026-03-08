import { z } from 'zod';

export const transactionTypeSchema = z.enum(['expense', 'income']);

export const parsedTransactionDataSchema = z.object({
  amount: z.number().finite(),
  type: transactionTypeSchema,
  category: z.string().min(1),
  description: z.string(),
  date: z.string().min(1),
});

export const transactionSchema = parsedTransactionDataSchema.extend({
  id: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
});

export const transactionListSchema = z.array(transactionSchema);

export type ParsedTransactionDataInput = z.infer<typeof parsedTransactionDataSchema>;
