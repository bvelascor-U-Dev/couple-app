import { FinancialActivityFilters } from "./financial-activity-filters.model";

export interface FinancialActivityQuery extends FinancialActivityFilters {
    page: number,
    pageSize: number
};