import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { AuthService } from '../../auth/services/auth.service';
import { FinancialService } from './financial.service';

describe('FinancialService', () => {
  const from = vi.fn();
  const requireAuthenticatedUserId = vi.fn();

  const supabaseClientMock = {
    from,
  } as unknown as SupabaseClient;

  const authServiceMock = {
    requireAuthenticatedUserId,
  } as unknown as AuthService;

  let service: FinancialService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        FinancialService,
        {
          provide: SUPABASE_CLIENT,
          useValue: supabaseClientMock,
        },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    });

    service = TestBed.inject(FinancialService);
  });

  it('should retrieve active categories of the requested transaction type and map them', async () => {
    const orderByName = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'category-1',
          name: 'Alimentación',
          transaction_type: 'expense',
          is_active: true,
          sort_order: 2,
        },
      ],
      error: null,
    });
    const orderBySortOrder = vi.fn().mockReturnValue({ order: orderByName });
    const eqActive = vi.fn().mockReturnValue({ order: orderBySortOrder });
    const eqTransactionType = vi.fn().mockReturnValue({ eq: eqActive });
    const select = vi.fn().mockReturnValue({ eq: eqTransactionType });

    from.mockReturnValue({ select });

    await expect(service.getCategories('expense')).resolves.toEqual([
      {
        id: 'category-1',
        name: 'Alimentación',
        transactionType: 'expense',
        isActive: true,
        sortOrder: 2,
      },
    ]);

    expect(requireAuthenticatedUserId).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('financial_categories');
    expect(eqTransactionType).toHaveBeenCalledWith('transaction_type', 'expense');
    expect(eqActive).toHaveBeenCalledWith('is_active', true);
    expect(orderBySortOrder).toHaveBeenCalledWith('sort_order');
    expect(orderByName).toHaveBeenCalledWith('name');
  });

  it('should retrieve active subcategories for the requested category and map them', async () => {
    const orderByName = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'subcategory-1',
          category_id: 'category-1',
          name: 'Mercado',
          is_system: true,
          is_active: true,
          sort_order: 1,
        },
      ],
      error: null,
    });
    const orderBySortOrder = vi.fn().mockReturnValue({ order: orderByName });
    const eqActive = vi.fn().mockReturnValue({ order: orderBySortOrder });
    const eqCategory = vi.fn().mockReturnValue({ eq: eqActive });
    const select = vi.fn().mockReturnValue({ eq: eqCategory });

    from.mockReturnValue({ select });

    await expect(service.getSubcategories('category-1')).resolves.toEqual([
      {
        id: 'subcategory-1',
        categoryId: 'category-1',
        name: 'Mercado',
        isSystem: true,
        isActive: true,
        sortOrder: 1,
      },
    ]);

    expect(requireAuthenticatedUserId).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('financial_subcategories');
    expect(eqCategory).toHaveBeenCalledWith('category_id', 'category-1');
    expect(eqActive).toHaveBeenCalledWith('is_active', true);
  });

  it('should create a transaction without trusting client-side ownership fields and map the result', async () => {
    const transactionRow = {
      id: 'transaction-1',
      couple_space_id: 'couple-space-1',
      created_by: 'user-1',
      transaction_type: 'expense',
      category_id: 'category-1',
      subcategory_id: null,
      amount: '25000.0000',
      currency_code: 'COP',
      effective_date: '2026-10-31',
      concept: null,
      expense_scope: 'shared',
      is_small_expense: false,
      created_at: '2026-10-31T12:00:00.000Z',
      updated_at: '2026-10-31T12:00:00.000Z',
    };
    const single = vi.fn().mockResolvedValue({ data: transactionRow, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });

    from.mockReturnValue({ insert });

    await expect(
      service.createTransaction({
        transactionType: 'expense',
        categoryId: 'category-1',
        subcategoryId: null,
        amount: 25000,
        effectiveDate: '2026-10-31',
        concept: null,
        expenseScope: 'shared',
        isSmallExpense: false,
      }),
    ).resolves.toEqual({
      id: 'transaction-1',
      coupleSpaceId: 'couple-space-1',
      createdBy: 'user-1',
      transactionType: 'expense',
      categoryId: 'category-1',
      subcategoryId: null,
      amount: '25000.0000',
      currencyCode: 'COP',
      effectiveDate: '2026-10-31',
      concept: null,
      expenseScope: 'shared',
      isSmallExpense: false,
      createdAt: '2026-10-31T12:00:00.000Z',
      updatedAt: '2026-10-31T12:00:00.000Z',
    });

    expect(requireAuthenticatedUserId).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('financial_transactions');
    expect(insert).toHaveBeenCalledWith({
      transaction_type: 'expense',
      category_id: 'category-1',
      subcategory_id: null,
      amount: 25000,
      effective_date: '2026-10-31',
      concept: null,
      expense_scope: 'shared',
      is_small_expense: false,
    });
  });

  it('should propagate database errors', async () => {
    const databaseError = new Error('Database request failed');
    const orderByName = vi.fn().mockResolvedValue({ data: null, error: databaseError });
    const orderBySortOrder = vi.fn().mockReturnValue({ order: orderByName });
    const eqActive = vi.fn().mockReturnValue({ order: orderBySortOrder });
    const eqTransactionType = vi.fn().mockReturnValue({ eq: eqActive });
    const select = vi.fn().mockReturnValue({ eq: eqTransactionType });

    from.mockReturnValue({ select });

    await expect(service.getCategories('income')).rejects.toBe(databaseError);
  });
});
