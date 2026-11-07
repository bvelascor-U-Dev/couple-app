import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinancialCategory } from '../../models/financial-category.model';
import { FinancialTransaction } from '../../models/financial-transaction.model';
import { FinancialService } from '../../services/financial.service';
import { FinancialTransactionFormComponent } from './financial-transaction-form.component';

describe('FinancialTransactionFormComponent', () => {
  const getCategories = vi.fn();
  const getSubcategories = vi.fn();
  const createTransaction = vi.fn();
  const updateTransaction = vi.fn();

  const financialServiceMock = {
    getCategories,
    getSubcategories,
    createTransaction,
    updateTransaction,
  };

  const expenseCategories: FinancialCategory[] = [
    {
      id: 'expense-category-1',
      name: 'Alimentación',
      transactionType: 'expense',
      isActive: true,
      sortOrder: 1,
    },
  ];

  let component: FinancialTransactionFormComponent;
  let fixture: ComponentFixture<FinancialTransactionFormComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    getCategories.mockResolvedValue(expenseCategories);
    getSubcategories.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [FinancialTransactionFormComponent],
      providers: [
        {
          provide: FinancialService,
          useValue: financialServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialTransactionFormComponent);
    component = fixture.componentInstance;
  });

  async function initializeComponent(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should load the initial expense categories', async () => {
    await initializeComponent();

    expect(getCategories).toHaveBeenCalledWith('expense');
    expect(component.categories()).toEqual(expenseCategories);
    expect(component.isLoadingCategories()).toBe(false);
    expect(component.loadErrorMessage()).toBeNull();
  });

  it('should mark required fields as touched without submitting an invalid transaction', async () => {
    await initializeComponent();

    await component.onSave();

    expect(component.transactionForm.controls.amount.touched).toBe(true);
    expect(component.transactionForm.controls.categoryId.touched).toBe(true);
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('should save an expense with normalized optional fields and reset only entry fields', async () => {
    await initializeComponent();
    createTransaction.mockResolvedValue({ id: 'transaction-1' });
    const expectedNextEffectiveDate = component.transactionForm.controls.effectiveDate.value;
    vi.useFakeTimers();

    try {
      component.transactionForm.setValue({
        transactionType: 'expense',
        categoryId: 'expense-category-1',
        subcategoryId: null,
        amount: 25000,
        effectiveDate: '2026-10-31',
        concept: '  Mercado semanal  ',
        expenseScope: 'shared',
        isSmallExpense: true,
      });

      await component.onSave();

      expect(createTransaction).toHaveBeenCalledWith({
        transactionType: 'expense',
        categoryId: 'expense-category-1',
        subcategoryId: null,
        amount: 25000,
        effectiveDate: '2026-10-31',
        concept: 'Mercado semanal',
        expenseScope: 'shared',
        isSmallExpense: true,
      });
      expect(component.successMessage()).toBe('El movimiento se registró correctamente.');
      expect(component.transactionForm.controls.transactionType.value).toBe('expense');
      expect(component.transactionForm.controls.effectiveDate.value).toBe(
        expectedNextEffectiveDate,
      );
      expect(component.transactionForm.controls.categoryId.value).toBe('');
      expect(component.transactionForm.controls.amount.value).toBeNull();
      expect(component.transactionForm.controls.concept.value).toBe('');
      expect(component.transactionForm.controls.isSmallExpense.value).toBe(false);
      expect(component.isSaving()).toBe(false);

      vi.advanceTimersByTime(2000);

      expect(component.successMessage()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should omit expense-only values when saving an income', async () => {
    await initializeComponent();
    createTransaction.mockResolvedValue({ id: 'transaction-1' });

    component.transactionForm.setValue({
      transactionType: 'income',
      categoryId: 'income-category-1',
      subcategoryId: 'income-subcategory-1',
      amount: 4000000,
      effectiveDate: '2026-11-02',
      concept: '',
      expenseScope: 'shared',
      isSmallExpense: true,
    });

    await component.onSave();

    expect(createTransaction).toHaveBeenCalledWith({
      transactionType: 'income',
      categoryId: 'income-category-1',
      subcategoryId: 'income-subcategory-1',
      amount: 4000000,
      effectiveDate: '2026-11-02',
      concept: null,
      expenseScope: null,
      isSmallExpense: false,
    });
  });

  it('should populate and save the supplied transaction in editing mode', async () => {
    const transactionToEdit: FinancialTransaction = {
      id: 'transaction-1',
      coupleSpaceId: 'couple-space-1',
      createdBy: 'user-1',
      transactionType: 'expense',
      categoryId: 'expense-category-1',
      subcategoryId: null,
      amount: '25000.0000',
      currencyCode: 'COP',
      effectiveDate: '2026-11-01',
      concept: 'Mercado semanal',
      expenseScope: 'shared',
      isSmallExpense: true,
      createdAt: '2026-11-01T12:00:00.000Z',
      updatedAt: '2026-11-01T12:00:00.000Z',
    };
    const savedTransaction = { ...transactionToEdit, amount: '30000.0000' };
    const emittedTransactions: FinancialTransaction[] = [];

    fixture.componentRef.setInput('transactionToEdit', transactionToEdit);
    updateTransaction.mockResolvedValue(savedTransaction);
    component.transactionSaved.subscribe((transaction) => emittedTransactions.push(transaction));

    await initializeComponent();

    expect(component.isEditing()).toBe(true);
    expect(component.transactionForm.getRawValue()).toEqual({
      transactionType: 'expense',
      categoryId: 'expense-category-1',
      subcategoryId: null,
      amount: 25000,
      effectiveDate: '2026-11-01',
      concept: 'Mercado semanal',
      expenseScope: 'shared',
      isSmallExpense: true,
    });

    component.transactionForm.controls.amount.setValue(30000);
    await component.onSave();

    expect(updateTransaction).toHaveBeenCalledWith('transaction-1', {
      transactionType: 'expense',
      categoryId: 'expense-category-1',
      subcategoryId: null,
      amount: 30000,
      effectiveDate: '2026-11-01',
      concept: 'Mercado semanal',
      expenseScope: 'shared',
      isSmallExpense: true,
    });
    expect(createTransaction).not.toHaveBeenCalled();
    expect(component.successMessage()).toBeNull();
    expect(emittedTransactions).toEqual([savedTransaction]);
  });

  it('should show a save error when the transaction cannot be created', async () => {
    await initializeComponent();
    createTransaction.mockRejectedValue(new Error('Database request failed'));

    component.transactionForm.setValue({
      transactionType: 'expense',
      categoryId: 'expense-category-1',
      subcategoryId: null,
      amount: 25000,
      effectiveDate: '2026-10-31',
      concept: '',
      expenseScope: 'personal',
      isSmallExpense: false,
    });

    await component.onSave();

    expect(component.saveErrorMessage()).toBe(
      'No fue posible guardar el movimiento. Inténtalo nuevamente.',
    );
    expect(component.successMessage()).toBeNull();
    expect(component.isSaving()).toBe(false);
  });
});
