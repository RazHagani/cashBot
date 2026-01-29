import { z } from "zod";

export const CategoryEnum = z.enum([
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Health",
  "Salary",
  "Other"
]);

export const TransactionTypeEnum = z.enum(["expense", "income"]);

export const ParsedResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    transaction: z.object({
      amount: z.number().positive(),
      description: z.string().min(1).max(200),
      category: CategoryEnum,
      type: TransactionTypeEnum
    })
  }),
  z.object({
    ok: z.literal(false),
    reason: z.string().min(1).max(200),
    question: z.string().min(1).max(200)
  })
]);

export type ParsedResult = z.infer<typeof ParsedResultSchema>;

