export type TransactionType = 'income' | 'expense';
export type ExpenseScope = 'personal' | 'shared';

export interface FinancialTransaction {
  id: string;
  coupleSpaceId: string;
  createdBy: string;
  transactionType: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  amount: string;
  currencyCode: string;
  effectiveDate: string;
  concept: string | null;
  expenseScope: ExpenseScope | null;
  isSmallExpense: boolean;
  createdAt: string;
  updatedAt: string;
}
