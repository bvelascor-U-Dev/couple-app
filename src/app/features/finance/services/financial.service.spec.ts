import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { AuthService } from '../../auth/services/auth.service';
import { FinancialService } from './financial.service';

describe('FinancialService', () => {
  const from = vi.fn();
  const rpc = vi.fn();
  const requireAuthenticatedUserId = vi.fn();

  const supabaseClientMock = {
    from,
    rpc,
  } as unknown as SupabaseClient;

  const authServiceMock = {
    requireAuthenticatedUserId,
  } as unknown as AuthService;

  let service: FinancialService;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserId.mockReturnValue('user-1');

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
    const eqTransactionType = vi.fn().mockResolvedValue({
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
    const orderByName = vi.fn().mockReturnValue({ eq: eqTransactionType });
    const orderBySortOrder = vi.fn().mockReturnValue({ order: orderByName });
    const eqActive = vi.fn().mockReturnValue({ order: orderBySortOrder });
    const select = vi.fn().mockReturnValue({ eq: eqActive });

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
    const eqTransactionType = vi.fn().mockResolvedValue({
      data: null,
      error: databaseError,
    });
    const orderByName = vi.fn().mockReturnValue({ eq: eqTransactionType });
    const orderBySortOrder = vi.fn().mockReturnValue({ order: orderByName });
    const eqActive = vi.fn().mockReturnValue({ order: orderBySortOrder });
    const select = vi.fn().mockReturnValue({ eq: eqActive });

    from.mockReturnValue({ select });

    await expect(service.getCategories('income')).rejects.toBe(databaseError);
  });

  it('should update only the authenticated creator transaction and map the result', async () => {
    const transactionRow = {
      id: 'transaction-1',
      couple_space_id: 'couple-space-1',
      created_by: 'user-1',
      transaction_type: 'expense',
      category_id: 'category-2',
      subcategory_id: null,
      amount: '30000.0000',
      currency_code: 'COP',
      effective_date: '2026-11-06',
      concept: 'Mercado actualizado',
      expense_scope: 'shared',
      is_small_expense: false,
      created_at: '2026-11-01T12:00:00.000Z',
      updated_at: '2026-11-06T12:00:00.000Z',
    };
    const single = vi.fn().mockResolvedValue({ data: transactionRow, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eqById = vi.fn().mockReturnValue({ select });
    const eqByCreator = vi.fn().mockReturnValue({ eq: eqById });
    const update = vi.fn().mockReturnValue({ eq: eqByCreator });

    from.mockReturnValue({ update });

    await expect(
      service.updateTransaction('transaction-1', {
        transactionType: 'expense',
        categoryId: 'category-2',
        subcategoryId: null,
        amount: 30000,
        effectiveDate: '2026-11-06',
        concept: 'Mercado actualizado',
        expenseScope: 'shared',
        isSmallExpense: false,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'transaction-1',
        categoryId: 'category-2',
        amount: '30000.0000',
        updatedAt: '2026-11-06T12:00:00.000Z',
      }),
    );

    expect(update).toHaveBeenCalledWith({
      transaction_type: 'expense',
      category_id: 'category-2',
      subcategory_id: null,
      amount: 30000,
      effective_date: '2026-11-06',
      concept: 'Mercado actualizado',
      expense_scope: 'shared',
      is_small_expense: false,
    });
    expect(eqByCreator).toHaveBeenCalledWith('created_by', 'user-1');
    expect(eqById).toHaveBeenCalledWith('id', 'transaction-1');
  });

  it('should delete only the authenticated creator transaction', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'transaction-1' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eqByCreator = vi.fn().mockReturnValue({ select });
    const eqById = vi.fn().mockReturnValue({ eq: eqByCreator });
    const remove = vi.fn().mockReturnValue({ eq: eqById });

    from.mockReturnValue({ delete: remove });

    await expect(service.deleteTransaction('transaction-1')).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(eqById).toHaveBeenCalledWith('id', 'transaction-1');
    expect(eqByCreator).toHaveBeenCalledWith('created_by', 'user-1');
    expect(select).toHaveBeenCalledWith('id');
  });

  it('should retrieve financial activity for the requested member and map related names', async () => {
    const activityRow = {
      id: 'transaction-1',
      couple_space_id: 'couple-space-1',
      created_by: 'user-2',
      transaction_type: 'expense',
      category_id: 'category-1',
      subcategory_id: null,
      amount: '25000.0000',
      currency_code: 'COP',
      effective_date: '2026-11-04',
      concept: 'Mercado semanal',
      expense_scope: 'shared',
      is_small_expense: false,
      created_at: '2026-11-04T12:00:00.000Z',
      updated_at: '2026-11-04T12:00:00.000Z',
      category: { name: 'Alimentación' },
      subcategory: null,
    };
    const queryResult = Promise.resolve({
      data: [activityRow],
      error: null,
      count: 1,
    });
    const activityQuery = {
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      in: vi.fn(),
      then: queryResult.then.bind(queryResult),
    };

    activityQuery.eq.mockReturnValue(activityQuery);
    activityQuery.gte.mockReturnValue(activityQuery);
    activityQuery.lte.mockReturnValue(activityQuery);
    activityQuery.order.mockReturnValue(activityQuery);
    activityQuery.range.mockReturnValue(activityQuery);
    activityQuery.in.mockReturnValue(activityQuery);

    const select = vi.fn().mockReturnValue(activityQuery);

    from.mockReturnValue({ select });

    await expect(
      service.getFinancialActivity({
        coupleSpaceId: 'couple-space-1',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        creatorId: 'user-2',
        page: 1,
        pageSize: 20,
      }),
    ).resolves.toEqual({
      items: [
        {
          id: 'transaction-1',
          coupleSpaceId: 'couple-space-1',
          createdBy: 'user-2',
          transactionType: 'expense',
          categoryId: 'category-1',
          subcategoryId: null,
          amount: '25000.0000',
          currencyCode: 'COP',
          effectiveDate: '2026-11-04',
          concept: 'Mercado semanal',
          expenseScope: 'shared',
          isSmallExpense: false,
          createdAt: '2026-11-04T12:00:00.000Z',
          updatedAt: '2026-11-04T12:00:00.000Z',
          categoryName: 'Alimentación',
          subcategoryName: null,
        },
      ],
      totalCount: 1,
    });

    expect(requireAuthenticatedUserId).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('financial_transactions');
    expect(activityQuery.eq).toHaveBeenCalledWith('couple_space_id', 'couple-space-1');
    expect(activityQuery.gte).toHaveBeenCalledWith('effective_date', '2026-11-01');
    expect(activityQuery.lte).toHaveBeenCalledWith('effective_date', '2026-11-30');
    expect(activityQuery.eq).toHaveBeenCalledWith('created_by', 'user-2');
    expect(activityQuery.range).toHaveBeenCalledWith(0, 19);
  });

  it('should compose combined activity filters and request the selected page', async () => {
    const queryResult = Promise.resolve({
      data: [],
      error: null,
      count: 43,
    });
    const activityQuery = {
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      in: vi.fn(),
      then: queryResult.then.bind(queryResult),
    };

    activityQuery.eq.mockReturnValue(activityQuery);
    activityQuery.gte.mockReturnValue(activityQuery);
    activityQuery.lte.mockReturnValue(activityQuery);
    activityQuery.order.mockReturnValue(activityQuery);
    activityQuery.range.mockReturnValue(activityQuery);
    activityQuery.in.mockReturnValue(activityQuery);

    const select = vi.fn().mockReturnValue(activityQuery);
    from.mockReturnValue({ select });

    await expect(
      service.getFinancialActivity({
        coupleSpaceId: 'couple-space-1',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        creatorId: 'user-1',
        transactionType: 'expense',
        categoryIds: ['category-1', 'category-2'],
        subcategoryId: 'subcategory-1',
        isSmallExpense: true,
        page: 2,
        pageSize: 20,
      }),
    ).resolves.toEqual({ items: [], totalCount: 43 });

    expect(activityQuery.eq).toHaveBeenCalledWith('created_by', 'user-1');
    expect(activityQuery.eq).toHaveBeenCalledWith('transaction_type', 'expense');
    expect(activityQuery.eq).toHaveBeenCalledWith('subcategory_id', 'subcategory-1');
    expect(activityQuery.eq).toHaveBeenCalledWith('is_small_expense', true);
    expect(activityQuery.in).toHaveBeenCalledWith('category_id', ['category-1', 'category-2']);
    expect(activityQuery.range).toHaveBeenCalledWith(20, 39);
  });

  it('should retrieve and map the financial activity summary', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        income_total: '4000000.0000',
        expense_total: '25000.0000',
        balance: '3975000.0000',
      },
      error: null,
    });

    rpc.mockReturnValue({ single });

    await expect(
      service.getFinancialActivitySummary({
        coupleSpaceId: 'couple-space-1',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        creatorId: 'user-1',
        transactionType: 'expense',
        categoryIds: ['category-1', 'category-2'],
        subcategoryId: 'subcategory-1',
        isSmallExpense: true,
      }),
    ).resolves.toEqual({
      incomeTotal: '4000000.0000',
      expenseTotal: '25000.0000',
      balance: '3975000.0000',
    });

    expect(requireAuthenticatedUserId).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('get_financial_activity_summary', {
      p_couple_space_id: 'couple-space-1',
      p_start_date: '2026-11-01',
      p_end_date: '2026-11-30',
      p_creator_id: 'user-1',
      p_transaction_type: 'expense',
      p_category_ids: ['category-1', 'category-2'],
      p_subcategory_id: 'subcategory-1',
      p_is_small_expense: true,
    });
    expect(single).toHaveBeenCalledTimes(1);
  });
});
