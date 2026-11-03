import { Component, inject, OnInit, signal} from '@angular/core';
import { FinancialService } from '../../services/financial.service';
import { CoupleSpaceService } from '../../../couple-space/services/couple-space.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CoupleSpaceOverview } from '../../../couple-space/models/couple-space-overview.model';
import { FinancialActivityItem } from '../../models/financial-activity-item.model';
import { FinancialActivityQuery } from '../../models/financial-activity-query.model';
import { CurrencyPipe } from '@angular/common';
import { FinancialActivitySummary } from '../../models/financial-activity-summary.model';
import { FinancialActivityFilters } from '../../models/financial-activity-filters.model';

type FinancialActivityView = 'both' | 'me' | 'partner';

@Component({
  selector: 'app-financial-activity-page',
  imports: [CurrencyPipe],
  templateUrl: './financial-activity-page.html',
})
export class FinancialActivityPage implements OnInit {
  private readonly limitQuery: number = 50; 
  
  private readonly financialService = inject(FinancialService);
  private readonly coupleSpaceService = inject(CoupleSpaceService);
  private readonly authService = inject(AuthService);

  readonly activityItems = signal<FinancialActivityItem[]>([]);
  readonly activitySummary = signal<FinancialActivitySummary | null>(null);
  readonly coupleSpaceOverview = signal<CoupleSpaceOverview | null>(null);
  readonly selectedView = signal<FinancialActivityView>('both');
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly currentUserId = signal<string | null>(null);
  readonly selectedMonth = signal<string>('');

  public async ngOnInit(): Promise<void> {
    await this.loadActivity();
  }

  private async loadActivity(): Promise<void>{
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.activityItems.set([]);
    this.activitySummary.set(null);

    try{    
      const coupleSpaceOverview = await this.coupleSpaceService.getCurrentCoupleSpace();
      if(!coupleSpaceOverview){
        this.errorMessage.set('Aún no perteneces a un espacio de pareja.');
        return;
      }
      this.coupleSpaceOverview.set(coupleSpaceOverview);
      const coupleSpaceId = coupleSpaceOverview.coupleSpace.id;

      const userId = this.authService.requireAuthenticatedUserId();
      this.currentUserId.set(userId);
      let creatorId: string | undefined;

      if( this.selectedView() === 'me'){
        creatorId = userId;
      }
      if(this.selectedView() === 'partner'){
        const partner = coupleSpaceOverview.members.find((member) => member.userId !== userId);
        if(!partner){
          this.activityItems.set([]);
          return;
        }
        creatorId = partner.userId;
      }

      const {startDate, endDate} = this.getCurrentMonthRange();
      this.selectedMonth.set(this.formatEffectiveDate(startDate));

      const filters: FinancialActivityFilters = {
        coupleSpaceId,
        startDate,
        endDate,
      };

      if (creatorId) {
        filters.creatorId = creatorId;
      }

      const query: FinancialActivityQuery = {
        ...filters,
        limit: this.limitQuery,
      };

      const [activityItems, activitySummary] = await Promise.all([
        this.financialService.getFinancialActivity(query),
        this.financialService.getFinancialActivitySummary(filters),
      ]);

      this.activityItems.set(activityItems);
      this.activitySummary.set(activitySummary);
    } catch {
      this.errorMessage.set('No fue posible cargar la actividad financiera. Inténtalo nuevamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getCurrentMonthRange(): Pick<FinancialActivityQuery, 'startDate' | 'endDate'> {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const startDate = this.formatDate(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endDate = this.formatDate(year, month, lastDayOfMonth);

    return { startDate, endDate };
  }

  private formatDate(year: number, month: number, day: number): string {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  public onViewChange(view: FinancialActivityView): void {
    if (this.selectedView() === view) {
      return;
    }

    this.selectedView.set(view);
    void this.loadActivity();
  }

  public getMemberDisplayName (userId: string): string {
    const displayName = this.coupleSpaceOverview()?.members.find((member)=> userId === member.userId)?.displayName;

    if(!displayName){
      return 'Miembro del espacio'
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

}

