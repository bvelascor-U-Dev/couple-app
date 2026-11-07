import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  LucideBriefcaseBusiness,
  LucideCarFront,
  LucideChartNoAxesCombined,
  LucideCheck,
  LucideCircleDollarSign,
  LucideDynamicIcon,
  LucideGift,
  LucideGraduationCap,
  LucideHandCoins,
  LucideHeartPulse,
  LucideHouse,
  type LucideIcon,
  LucideLandmark,
  LucidePawPrint,
  LucidePlaneTakeoff,
  LucidePopcorn,
  LucideReceiptText,
  LucideRotateCcw,
  LucideShoppingBag,
  LucideTags,
  LucideUtensils,
  LucideWalletCards,
} from '@lucide/angular';
import { FinancialCategory } from '../../models/financial-category.model';
import {
  FinancialFilterSelection,
  FinancialMemberView,
} from '../../models/financial-filter-selection.model';
import { TransactionType } from '../../models/financial-transaction.model';
import { FinancialActivityDateRange } from '../../models/financial-activity-date-range.model';

@Component({
  selector: 'app-financial-filters',
  imports: [LucideCheck, LucideDynamicIcon],
  templateUrl: './financial-filters.html',
  styleUrl: './financial-filters.css',
})
export class FinancialFiltersComponent {
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly filters = input.required<FinancialFilterSelection>();
  readonly categories = input.required<FinancialCategory[]>();
  readonly isLoadingCategories = input(false);
  readonly categoryErrorMessage = input<string | null>(null);
  readonly dateRangeError = signal<string | null>(null);

  readonly filtersChange = output<FinancialFilterSelection>();

  readonly memberOptions: ReadonlyArray<{
    value: FinancialMemberView;
    label: string;
    initials: string;
  }> = [
    { value: 'me', label: 'Mis movimientos', initials: 'Yo' },
    { value: 'partner', label: 'Movimientos de pareja', initials: 'P' },
    { value: 'both', label: 'Ambos', initials: 'A B' },
  ];

  private readonly categoryIcons: Readonly<Record<string, LucideIcon>> = {
    Salario: LucideWalletCards,
    'Trabajo independiente': LucideBriefcaseBusiness,
    'Rendimientos e inversiones': LucideChartNoAxesCombined,
    Reembolsos: LucideRotateCcw,
    'Regalos y apoyos': LucideGift,
    'Otros ingresos': LucideCircleDollarSign,
    Vivienda: LucideHouse,
    Alimentación: LucideUtensils,
    Transporte: LucideCarFront,
    'Salud y bienestar': LucideHeartPulse,
    'Obligaciones financieras': LucideLandmark,
    'Entretenimiento y vida social': LucidePopcorn,
    'Educación y desarrollo': LucideGraduationCap,
    'Apoyo familiar': LucideHandCoins,
    'Compras y cuidado personal': LucideShoppingBag,
    Mascotas: LucidePawPrint,
    Viajes: LucidePlaneTakeoff,
    'Otros gastos': LucideReceiptText,
  };

  readonly expenseCategories = computed(() => {
    return this.categories().filter((category) => category.transactionType === 'expense');
  });

  readonly incomeCategories = computed(() => {
    return this.categories().filter((category) => category.transactionType === 'income');
  });

  readonly selectedCategoriesLabel = computed(() => {
    const categoryIds = this.filters().categoryIds;

    if (!categoryIds || categoryIds.length === 0) {
      return 'Categorías';
    }

    if (categoryIds.length === 1) {
      const selectedCategory = this.categories().find((category) => category.id === categoryIds[0]);

      return selectedCategory?.name ?? '1 categoría';
    }

    return `${categoryIds.length} categorías`;
  });

  readonly selectedPeriodLabel = computed(() => {
    const dateRange = this.filters().dateRange;

    if (dateRange.mode === 'custom') {
      return `${this.formatDisplayDate(dateRange.startDate)} – ${this.formatDisplayDate(dateRange.endDate)}`;
    }

    return this.formatMonthLabel(dateRange.startDate);
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.filters();
    const currentMonthRange = this.createMonthDateRange(new Date());

    return (
      filters.memberView !== 'me' ||
      filters.transactionType !== undefined ||
      filters.categoryIds !== undefined ||
      filters.isSmallExpense !== undefined ||
      filters.dateRange.mode !== 'month' ||
      filters.dateRange.startDate !== currentMonthRange.startDate ||
      filters.dateRange.endDate !== currentMonthRange.endDate
    );
  });

  @HostListener('document:click', ['$event'])
  public closeDropdownsOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    const openDropdowns = (this.hostElement.nativeElement as HTMLElement).querySelectorAll(
      'details[open]',
    ) as NodeListOf<HTMLDetailsElement>;

    openDropdowns.forEach((dropdown: HTMLDetailsElement) => {
      if (!dropdown.contains(target)) {
        dropdown.open = false;
      }
    });
  }

  public onMemberViewChange(memberView: FinancialMemberView, dropdown?: HTMLDetailsElement): void {
    this.closeDropdown(dropdown);

    if (this.filters().memberView === memberView) {
      return;
    }

    this.emitFilters({ memberView });
  }

  public onTransactionTypeChange(
    transactionType: TransactionType | undefined,
    dropdown?: HTMLDetailsElement,
  ): void {
    this.closeDropdown(dropdown);

    if (this.filters().transactionType === transactionType) {
      return;
    }

    this.emitFilters({
      transactionType,
      categoryIds: undefined,
      isSmallExpense: transactionType === 'income' ? undefined : this.filters().isSmallExpense,
    });
  }

  public onCategoryToggle(categoryId: string): void {
    const currentCategoryIds = this.filters().categoryIds ?? [];
    const nextCategoryIds = currentCategoryIds.includes(categoryId)
      ? currentCategoryIds.filter((id) => id !== categoryId)
      : [...currentCategoryIds, categoryId];

    this.emitFilters({
      categoryIds: nextCategoryIds.length > 0 ? nextCategoryIds : undefined,
    });
  }

  public onClearCategories(): void {
    if (this.filters().categoryIds === undefined) {
      return;
    }

    this.emitFilters({ categoryIds: undefined });
  }

  public onSmallExpenseToggle(): void {
    this.emitFilters({
      isSmallExpense: this.filters().isSmallExpense === true ? undefined : true,
    });
  }

  public getCategoryIcon(category: FinancialCategory): LucideIcon {
    return this.categoryIcons[category.name] ?? LucideTags;
  }

  private emitFilters(changes: Partial<FinancialFilterSelection>): void {
    this.filtersChange.emit({
      ...this.filters(),
      ...changes,
    });
  }

  private closeDropdown(dropdown?: HTMLDetailsElement): void {
    if (dropdown) {
      dropdown.open = false;
    }
  }

  private formatMonthLabel(effectiveDate: string): string {
    const date = this.parseLocalDate(effectiveDate);
    const parts = new Intl.DateTimeFormat('es-CO', {
      month: 'short',
      year: 'numeric',
    }).formatToParts(date);
    const month = parts.find((part) => part.type === 'month')?.value.replace('.', '');
    const year = parts.find((part) => part.type === 'year')?.value;

    return month && year ? `${month} ${year}` : effectiveDate;
  }

  private formatDisplayDate(effectiveDate: string): string {
    const date = this.parseLocalDate(effectiveDate);

    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private parseLocalDate(effectiveDate: string): Date {
    const [yearText, monthText, dayText] = effectiveDate.split('-');

    return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  }

  private createMonthDateRange(referenceDate: Date): FinancialActivityDateRange {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    const startDate = this.formatDate(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endDate = this.formatDate(year, month, lastDayOfMonth);

    return {
      mode: 'month',
      startDate,
      endDate,
    };
  }

  private formatDate(year: number, month: number, day: number): string {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  public onPreviousMonth(): void {
    const currentStartDate = this.parseLocalDate(this.filters().dateRange.startDate);

    const previousMonth = new Date(
      currentStartDate.getFullYear(),
      currentStartDate.getMonth() - 1,
      1,
    );

    this.emitFilters({
      dateRange: this.createMonthDateRange(previousMonth),
    });
  }

  public onNextMonth(): void {
    const currentStartDate = this.parseLocalDate(this.filters().dateRange.startDate);

    const previousMonth = new Date(
      currentStartDate.getFullYear(),
      currentStartDate.getMonth() + 1,
      1,
    );

    this.emitFilters({
      dateRange: this.createMonthDateRange(previousMonth),
    });
  }

  public onCustomDateRangeApply(
    startDate: string,
    endDate: string,
    dropdown?: HTMLDetailsElement,
  ): void {
    if (!startDate || !endDate) {
      this.dateRangeError.set('Selecciona una fecha inicial y una fecha final.');
      return;
    }

    if (startDate > endDate) {
      this.dateRangeError.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }

    this.dateRangeError.set(null);

    this.emitFilters({
      dateRange: {
        mode: 'custom',
        startDate,
        endDate,
      },
    });

    if (dropdown) {
      dropdown.open = false;
    }
  }

  public onClearAllFilters(): void {
    if (!this.hasActiveFilters()) {
      return;
    }

    this.dateRangeError.set(null);

    this.emitFilters({
      memberView: 'me',
      transactionType: undefined,
      categoryIds: undefined,
      isSmallExpense: undefined,
      dateRange: this.createMonthDateRange(new Date()),
    });
  }
}
