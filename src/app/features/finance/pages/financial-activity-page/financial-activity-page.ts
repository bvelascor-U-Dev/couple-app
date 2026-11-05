import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FinancialService } from '../../services/financial.service';
import { CoupleSpaceService } from '../../../couple-space/services/couple-space.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CoupleSpaceOverview } from '../../../couple-space/models/couple-space-overview.model';
import { FinancialActivityItem } from '../../models/financial-activity-item.model';
import { FinancialActivityQuery } from '../../models/financial-activity-query.model';
import { CurrencyPipe } from '@angular/common';
import { FinancialActivitySummary } from '../../models/financial-activity-summary.model';
import { FinancialActivityFilters } from '../../models/financial-activity-filters.model';
import { FinancialCategory } from '../../models/financial-category.model';
import { FinancialFilterSelection } from '../../models/financial-filter-selection.model';
import { FinancialFiltersComponent } from '../../components/financial-filters/financial-filters.component';

@Component({
  selector: 'app-financial-activity-page',
  imports: [CurrencyPipe, FinancialFiltersComponent],
  templateUrl: './financial-activity-page.html',
})
export class FinancialActivityPage implements OnInit {
  private readonly pageSize = 20;

  private readonly financialService = inject(FinancialService);
  private readonly coupleSpaceService = inject(CoupleSpaceService);
  private readonly authService = inject(AuthService);
  readonly activityItems = signal<FinancialActivityItem[]>([]);
  readonly activitySummary = signal<FinancialActivitySummary | null>(null);
  readonly coupleSpaceOverview = signal<CoupleSpaceOverview | null>(null);
  readonly selectedFilters = signal<FinancialFilterSelection>(this.createInitialFilters());
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly currentUserId = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly totalCount = signal(0);
  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  });
  readonly categories = signal<FinancialCategory[]>([]);
  readonly isLoadingCategories = signal(false);
  readonly categoryErrorMessage = signal<string | null>(null);

  public async ngOnInit(): Promise<void> {
    await Promise.all([this.loadActivity(), this.loadCategories()]);
  }

  private async loadActivity(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.activityItems.set([]);
    this.activitySummary.set(null);
    this.totalCount.set(0);

    try {
      const coupleSpaceOverview = await this.coupleSpaceService.getCurrentCoupleSpace();
      if (!coupleSpaceOverview) {
        this.errorMessage.set('Aún no perteneces a un espacio de pareja.');
        return;
      }
      this.coupleSpaceOverview.set(coupleSpaceOverview);
      const coupleSpaceId = coupleSpaceOverview.coupleSpace.id;

      const userId = this.authService.requireAuthenticatedUserId();
      this.currentUserId.set(userId);
      let creatorId: string | undefined;

      const selectedFilters = this.selectedFilters();

      if (selectedFilters.memberView === 'me') {
        creatorId = userId;
      }
      if (selectedFilters.memberView === 'partner') {
        const partner = coupleSpaceOverview.members.find((member) => member.userId !== userId);
        if (!partner) {
          this.activityItems.set([]);
          return;
        }
        creatorId = partner.userId;
      }

      const { startDate, endDate } = selectedFilters.dateRange;

      const filters: FinancialActivityFilters = {
        coupleSpaceId: coupleSpaceId,
        startDate: startDate,
        endDate: endDate,
        creatorId: creatorId,
        transactionType: selectedFilters.transactionType,
        categoryIds: selectedFilters.categoryIds,
        isSmallExpense: selectedFilters.isSmallExpense,
      };

      const query: FinancialActivityQuery = {
        ...filters,
        page: this.currentPage(),
        pageSize: this.pageSize,
      };

      const [activityResult, activitySummary] = await Promise.all([
        this.financialService.getFinancialActivity(query),
        this.financialService.getFinancialActivitySummary(filters),
      ]);

      this.activityItems.set(activityResult.items);
      this.totalCount.set(activityResult.totalCount);
      this.activitySummary.set(activitySummary);
    } catch {
      this.errorMessage.set('No fue posible cargar la actividad financiera. Inténtalo nuevamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private createInitialFilters(): FinancialFilterSelection {
    return {
      memberView: 'both',
      dateRange: this.createCurrentMonthDateRange(),
    };
  }

  private formatDate(year: number, month: number, day: number): string {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  public onFiltersChange(filters: FinancialFilterSelection): void {
    const previousFilters = this.selectedFilters();
    const shouldReloadCategories = previousFilters.transactionType !== filters.transactionType;

    this.selectedFilters.set(filters);
    this.currentPage.set(1);

    void Promise.all([
      this.loadActivity(),
      ...(shouldReloadCategories ? [this.loadCategories()] : []),
    ]);
  }

  public onPreviousPage(): void {
    if (this.isLoading() || this.currentPage() === 1) {
      return;
    }
    this.currentPage.update((page) => page - 1);
    void this.loadActivity();
  }

  public onNextPage(): void {
    if (this.isLoading() || this.currentPage() >= this.totalPages()) {
      return;
    }
    this.currentPage.update((page) => page + 1);
    void this.loadActivity();
  }

  public getMemberDisplayName(userId: string): string {
    const displayName = this.coupleSpaceOverview()?.members.find(
      (member) => userId === member.userId,
    )?.displayName;

    if (!displayName) {
      return 'Miembro del espacio';
    }
    return displayName;
  }

  public formatEffectiveDate(effectiveDate: string): string {
    const [yearText, monthText, dayText] = effectiveDate.split('-');

    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    const localDate = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(localDate);
  }

  private async loadCategories(): Promise<void> {
    this.isLoadingCategories.set(true);
    this.categoryErrorMessage.set(null);

    try {
      const categories = await this.financialService.getCategories(
        this.selectedFilters().transactionType,
      );

      this.categories.set(categories);
    } catch {
      this.categories.set([]);
      this.categoryErrorMessage.set('No fue posible cargar las categorías.');
    } finally {
      this.isLoadingCategories.set(false);
    }
  }
  private createCurrentMonthDateRange() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const startDate = this.formatDate(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endDate = this.formatDate(year, month, lastDayOfMonth);

    return {
      mode: 'month' as const,
      startDate,
      endDate,
    };
  }
}
