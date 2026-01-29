export type TransactionType = "expense" | "income";

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  created_at: string;
};

export const CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Health",
  "Salary",
  "Other"
] as const;

export type Category = (typeof CATEGORIES)[number];

