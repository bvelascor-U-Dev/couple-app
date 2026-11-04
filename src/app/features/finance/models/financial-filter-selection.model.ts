import { FinancialActivityDateRange } from './financial-activity-date-range.model';
import { TransactionType } from './financial-transaction.model';

export type FinancialMemberView = 'both' | 'me' | 'partner';

export interface FinancialFilterSelection {
  memberView: FinancialMemberView;
  transactionType?: TransactionType;
  categoryIds?: string[];
  isSmallExpense?: boolean;
  dateRange: FinancialActivityDateRange;
}
