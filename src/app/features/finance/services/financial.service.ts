import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { FinancialTransaction, TransactionType } from '../models/financial-transaction.model';
import { AuthService } from '../../auth/services/auth.service';
import { FinancialCategory } from '../models/financial-category.model';
import { FinancialSubcategory } from '../models/financial-subcategory.model';
import { FinancialTransactionInput } from '../models/create-financial-transaction.input';

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

@Service()
export class FinancialService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly authService = inject(AuthService);

  public async getCategories(transactionType: TransactionType): Promise<FinancialCategory[]> {
    this.authService.requireAuthenticatedUserId();
    const { data, error } = await this.supabase
      .from('financial_categories')
      .select('id,name,transaction_type,is_active,sort_order')
      .eq('transaction_type', transactionType)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

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
  }
}
