import { FinancialTransaction } from "./financial-transaction.model";

export interface FinancialActivityItem extends FinancialTransaction {
    categoryName: string,
    subcategoryName: string | null
};