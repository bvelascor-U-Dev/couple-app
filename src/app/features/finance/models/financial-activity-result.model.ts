import { FinancialActivityItem } from "./financial-activity-item.model";

export interface FinancialActivityResult {
  items: FinancialActivityItem[];
  totalCount: number;
}