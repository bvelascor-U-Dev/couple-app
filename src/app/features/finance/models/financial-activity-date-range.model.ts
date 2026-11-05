export type FinancialActivityDateRangeMode = 'month' | 'custom';

export interface FinancialActivityDateRange {
  mode: FinancialActivityDateRangeMode;
  startDate: string;
  endDate: string;
}
