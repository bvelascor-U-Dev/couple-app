import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { FinancialTransaction, TransactionType } from '../models/financial-transaction.model';
import { AuthService } from '../../auth/services/auth.service';
import { FinancialCategory } from '../models/financial-category.model';
import { FinancialSubcategory } from '../models/financial-subcategory.model';
import { FinancialTransactionInput } from '../models/financial-transaction.input';
import { FinancialActivityItem } from '../models/financial-activity-item.model';
import { FinancialActivityQuery } from '../models/financial-activity-query.model';
import { FinancialActivityFilters } from '../models/financial-activity-filters.model';
import { FinancialActivitySummary } from '../models/financial-activity-summary.model';
import { FinancialActivityResult } from '../models/financial-activity-result.model';

interface FinancialCategoryRow {
  id: string;
  name: string;
  transaction_type: TransactionType;
  is_active: boolean;
  sort_order: number;
}

interface FinancialSubcategoryRow {
  id: string;
  category_id: string;
  name: string;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
}

interface FinancialTransactionRow {
  id: string;
  couple_space_id: string;
  created_by: string;
  transaction_type: TransactionType;
  category_id: string;
  subcategory_id: string | null;
  amount: string;
  currency_code: string;
  effective_date: string;
  concept: string | null;
  expense_scope: FinancialTransaction['expenseScope'];
  is_small_expense: boolean;
  created_at: string;
  updated_at: string;
}

interface FinancialActivityRow extends FinancialTransactionRow {
  category: {
    name: string;
  };
  subcategory: {
    name: string;
  } | null;
};

interface FinancialActivitySummaryRow {
  income_total: string,
  expense_total: string,
  balance: string,
}

@Service()
export class FinancialService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly authService = inject(AuthService);

  public async getCategories(transactionType?: TransactionType): Promise<FinancialCategory[]> {
    this.authService.requireAuthenticatedUserId();

    let categoryQuery = this.supabase
      .from('financial_categories')
      .select('id,name,transaction_type,is_active,sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if(transactionType !== undefined){
      categoryQuery = categoryQuery.eq('transaction_type',transactionType)
    }

    const{data, error} = await categoryQuery;

    if (error) {
      throw error;
    }

    const categoryRows = (data ?? []) as FinancialCategoryRow[];

    return categoryRows.map((category) => ({
      id: category.id,
      name: category.name,
      transactionType: category.transaction_type,
      isActive: category.is_active,
      sortOrder: category.sort_order,
    }));
  }

  public async getSubcategories(categoryId: string): Promise<FinancialSubcategory[]> {
    this.authService.requireAuthenticatedUserId();

    const { data, error } = await this.supabase
      .from('financial_subcategories')
      .select('id,category_id,name,is_system,is_active,sort_order')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) {
      throw error;
    }

    const subCategoryRows = (data ?? []) as FinancialSubcategoryRow[];

    return subCategoryRows.map((subcategory) => ({
      id: subcategory.id,
      categoryId: subcategory.category_id,
      name: subcategory.name,
      isSystem: subcategory.is_system,
      isActive: subcategory.is_active,
      sortOrder: subcategory.sort_order,
    }));
  }

  public async createTransaction(
    transactionInput: FinancialTransactionInput,
  ): Promise<FinancialTransaction> {
    this.authService.requireAuthenticatedUserId();

    const { data, error } = await this.supabase
      .from('financial_transactions')
      .insert({
        transaction_type: transactionInput.transactionType,
        category_id: transactionInput.categoryId,
        subcategory_id: transactionInput.subcategoryId ?? null,
        amount: transactionInput.amount,
        effective_date: transactionInput.effectiveDate,
        concept: transactionInput.concept ?? null,
        expense_scope: transactionInput.expenseScope ?? null,
        is_small_expense: transactionInput.isSmallExpense ?? false,
      })
      .select(
        'id,couple_space_id,created_by,transaction_type,category_id,subcategory_id,amount,currency_code,effective_date,concept,expense_scope,is_small_expense,created_at,updated_at',
      )
      .single();

    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('Transaction creation did not return a record.');
    }

    return this.mapFinancialTransaction(data as FinancialTransactionRow);
  }

  public async getFinancialActivity(query: FinancialActivityQuery): Promise<FinancialActivityResult>{
    this.authService.requireAuthenticatedUserId();

    if (!query.coupleSpaceId || !query.startDate || !query.endDate) {
      throw new Error('A couple space and date range are required.');
    }

    if (!Number.isInteger(query.page) || query.page < 1) {
      throw new Error('The page must be greater than zero.');
    }

    if (!Number.isInteger(query.pageSize) || query.pageSize < 1) {
      throw new Error('The page size must be greater than zero.');
    }
    const from = (query.page-1)*query.pageSize;
    const to = (query.page*query.pageSize)-1;

    let activityQuery = this.supabase 
      .from('financial_transactions')
      .select('id,couple_space_id,created_by,transaction_type,category_id,subcategory_id,amount,currency_code,effective_date,concept,expense_scope,is_small_expense,created_at,updated_at,category:financial_categories(name),subcategory:financial_subcategories(name)',{ count: 'exact' })
      .eq('couple_space_id',query.coupleSpaceId)
      .gte('effective_date',query.startDate)
      .lte('effective_date', query.endDate)
      .order('effective_date', {ascending: false})
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from,to)
      
    const equalityFilters = [
      ['created_by', query.creatorId],
      ['transaction_type', query.transactionType],
      ['subcategory_id', query.subcategoryId],
      ['is_small_expense', query.isSmallExpense],
    ] as const;

    for (const [column, value] of equalityFilters) {
      if (value !== undefined) {
        activityQuery = activityQuery.eq(column, value);
      }
    }

    if (query.categoryIds && query.categoryIds.length > 0) {
      activityQuery = activityQuery.in(
        'category_id',
        query.categoryIds,
      );
    }

    const {data, error, count} = await activityQuery;
    if(error){
      throw error;
    }

    const financialItems = (data ?? []) as unknown as FinancialActivityRow[];

    const items = financialItems.map((item) => {
      return this.mapFinancialActivityItem(item);
    });
    
    return {
      items: items,
      totalCount: count ?? 0
    };      
  };
  

  private mapFinancialTransaction(row: FinancialTransactionRow): FinancialTransaction {
    return {
      id: row.id,
      coupleSpaceId: row.couple_space_id,
      createdBy: row.created_by,
      transactionType: row.transaction_type,
      categoryId: row.category_id,
      subcategoryId: row.subcategory_id,
      amount: row.amount,
      currencyCode: row.currency_code,
      effectiveDate: row.effective_date,
      concept: row.concept,
      expenseScope: row.expense_scope,
      isSmallExpense: row.is_small_expense,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  };

  private mapFinancialActivityItem(row: FinancialActivityRow): FinancialActivityItem {
    return{
      ...this.mapFinancialTransaction(row),
      categoryName: row.category.name,
      subcategoryName: row.subcategory?.name ?? null,
    };
  };

  public async getFinancialActivitySummary (filters: FinancialActivityFilters): Promise<FinancialActivitySummary>{
    this.authService.requireAuthenticatedUserId();

    if (!filters.coupleSpaceId || !filters.startDate || !filters.endDate) {
      throw new Error('A couple space and date range are required.');
    }

    const {data, error} = await this.supabase.rpc('get_financial_activity_summary', {
      p_couple_space_id: filters.coupleSpaceId,
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
      p_creator_id: filters.creatorId ?? null,
      p_transaction_type: filters.transactionType ?? null,
      p_category_ids: filters.categoryIds ?? null,
      p_subcategory_id: filters.subcategoryId ?? null,
      p_is_small_expense: filters.isSmallExpense ?? null,
    })
    .single();

    if(error){
      throw error;
    }

    if (!data) {
      throw new Error('Financial activity summary did not return a record.');
    }

    const financialSummary = data as FinancialActivitySummaryRow;
     return {
      incomeTotal: financialSummary.income_total,
      expenseTotal: financialSummary.expense_total,
      balance: financialSummary.balance
     }
  }

  public async updateTransaction(transactionId: string, transactionInput: FinancialTransactionInput): Promise<FinancialTransaction>{
    const userId = this.authService.requireAuthenticatedUserId();

    const {data,error} = await this.supabase
      .from('financial_transactions')
      .update({transaction_type: transactionInput.transactionType,
        category_id: transactionInput.categoryId,
        subcategory_id: transactionInput.subcategoryId ?? null,
        amount: transactionInput.amount,
        effective_date: transactionInput.effectiveDate,
        concept: transactionInput.concept ?? null,
        expense_scope: transactionInput.expenseScope ?? null,
        is_small_expense: transactionInput.isSmallExpense ?? false,})
      .eq('created_by',userId)
      .eq('id',transactionId)
      .select('id,couple_space_id,created_by,transaction_type,category_id,subcategory_id,amount,currency_code,effective_date,concept,expense_scope,is_small_expense,created_at,updated_at',)
      .single()

    if(error){
      throw error
    }
    if (!data) {
      throw new Error('Transaction update did not return a record.');
    }
    return this.mapFinancialTransaction(data as FinancialTransactionRow)      
  }

  public async deleteTransaction(transactionId: string): Promise<void> {
    const userId = this.authService.requireAuthenticatedUserId();

    if (!transactionId.trim()) {
      throw new Error('A transaction identifier is required.');
    }

    const { data, error } = await this.supabase
      .from('financial_transactions')
      .delete()
      .eq('id', transactionId)
      .eq('created_by', userId)
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Transaction deletion did not return a record.');
    }
  }
}
