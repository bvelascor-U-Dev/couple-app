import { TransactionType } from './financial-transaction.model';

export interface FinancialCategory {
  id: string;
  name: string;
  transactionType: TransactionType;
  isActive: boolean;
  sortOrder: number;
}
