import { TransactionType } from "./financial-transaction.model";

export interface FinancialActivityFilters {
  coupleSpaceId: string,
  startDate: string,
  endDate: string,
  creatorId?: string,
  transactionType?: TransactionType,
  categoryIds?: string[],
  subcategoryId?: string,
  isSmallExpense?: boolean,
}