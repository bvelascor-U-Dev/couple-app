import { ExpenseScope, TransactionType } from './financial-transaction.model';

export interface FinancialTransactionInput {
  transactionType: TransactionType;
  categoryId: string;
  subcategoryId?: string | null;
  amount: number;
  effectiveDate: string;
  concept?: string | null;
  expenseScope?: ExpenseScope | null;
  isSmallExpense?: boolean;
}
