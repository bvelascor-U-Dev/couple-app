import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinancialCategory } from '../../models/financial-category.model';
import { FinancialFilterSelection } from '../../models/financial-filter-selection.model';
import { FinancialFiltersComponent } from './financial-filters.component';

describe('FinancialFiltersComponent', () => {
  const initialFilters: FinancialFilterSelection = {
    memberView: 'me',
    categoryIds: ['expense-category'],
    isSmallExpense: true,
    dateRange: {
      mode: 'month',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    },
  };

  const categories: FinancialCategory[] = [
    {
      id: 'expense-category',
      name: 'Alimentación',
      transactionType: 'expense',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'income-category',
      name: 'Salario',
      transactionType: 'income',
      isActive: true,
      sortOrder: 1,
    },
  ];

  let component: FinancialFiltersComponent;
  let fixture: ComponentFixture<FinancialFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filters', initialFilters);
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();
  });

  it('should emit a complete selection and clear incompatible filters when income is selected', () => {
    const emittedFilters = vi.fn();
    component.filtersChange.subscribe(emittedFilters);

    component.onTransactionTypeChange('income');

    expect(emittedFilters).toHaveBeenCalledWith({
      ...initialFilters,
      transactionType: 'income',
      categoryIds: undefined,
      isSmallExpense: undefined,
    });
  });

  it('should add and remove categories without mutating the current selection', () => {
    const emittedFilters = vi.fn();
    component.filtersChange.subscribe(emittedFilters);

    component.onCategoryToggle('income-category');
    component.onCategoryToggle('expense-category');

    expect(emittedFilters).toHaveBeenNthCalledWith(1, {
      ...initialFilters,
      categoryIds: ['expense-category', 'income-category'],
    });
    expect(emittedFilters).toHaveBeenNthCalledWith(2, {
      ...initialFilters,
      categoryIds: undefined,
    });
    expect(initialFilters.categoryIds).toEqual(['expense-category']);
  });

  it('should toggle the small-expense filter between true and no filter', () => {
    const emittedFilters = vi.fn();
    component.filtersChange.subscribe(emittedFilters);

    component.onSmallExpenseToggle();

    expect(emittedFilters).toHaveBeenCalledWith({
      ...initialFilters,
      isSmallExpense: undefined,
    });
  });

  it('should emit the adjacent complete month when navigating backward or forward', () => {
    const emittedFilters = vi.fn();
    component.filtersChange.subscribe(emittedFilters);

    component.onPreviousMonth();
    component.onNextMonth();

    expect(emittedFilters).toHaveBeenNthCalledWith(1, {
      ...initialFilters,
      dateRange: {
        mode: 'month',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      },
    });
    expect(emittedFilters).toHaveBeenNthCalledWith(2, {
      ...initialFilters,
      dateRange: {
        mode: 'month',
        startDate: '2026-12-01',
        endDate: '2026-12-31',
      },
    });
  });

  it('should validate and apply a custom date range', () => {
    const emittedFilters = vi.fn();
    const dropdown = document.createElement('details');
    dropdown.open = true;
    component.filtersChange.subscribe(emittedFilters);

    component.onCustomDateRangeApply('2026-11-30', '2026-11-01', dropdown);

    expect(component.dateRangeError()).toBe(
      'La fecha inicial no puede ser posterior a la fecha final.',
    );
    expect(emittedFilters).not.toHaveBeenCalled();
    expect(dropdown.open).toBe(true);

    component.onCustomDateRangeApply('2026-10-15', '2026-11-05', dropdown);

    expect(component.dateRangeError()).toBeNull();
    expect(dropdown.open).toBe(false);
    expect(emittedFilters).toHaveBeenCalledWith({
      ...initialFilters,
      dateRange: {
        mode: 'custom',
        startDate: '2026-10-15',
        endDate: '2026-11-05',
      },
    });
  });

  it('should restore the default filter selection when clearing active filters', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 4));
    const emittedFilters = vi.fn();
    component.filtersChange.subscribe(emittedFilters);

    component.onClearAllFilters();

    expect(emittedFilters).toHaveBeenCalledWith({
      memberView: 'me',
      transactionType: undefined,
      categoryIds: undefined,
      isSmallExpense: undefined,
      dateRange: {
        mode: 'month',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      },
    });

    vi.useRealTimers();
  });
});
