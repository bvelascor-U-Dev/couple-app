import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { CoupleSpaceOverview } from '../../../couple-space/models/couple-space-overview.model';
import { CoupleSpaceService } from '../../../couple-space/services/couple-space.service';
import { AuthService } from '../../../auth/services/auth.service';
import type { FinancialActivityItem } from '../../models/financial-activity-item.model';
import type { FinancialActivitySummary } from '../../models/financial-activity-summary.model';
import { FinancialService } from '../../services/financial.service';
import { FinancialActivityPage } from './financial-activity-page';

registerLocaleData(localeEs, 'es-CO');

describe('FinancialActivityPage', () => {
  const getCurrentCoupleSpace = vi.fn();
  const getFinancialActivity = vi.fn();
  const getFinancialActivitySummary = vi.fn();
  const requireAuthenticatedUserId = vi.fn();

  const coupleSpaceServiceMock = {
    getCurrentCoupleSpace,
  };

  const financialServiceMock = {
    getFinancialActivity,
    getFinancialActivitySummary,
  };

  const authServiceMock = {
    requireAuthenticatedUserId,
  };

  const overview: CoupleSpaceOverview = {
    coupleSpace: {
      id: 'couple-space-1',
      name: 'Ana y Brayan',
      currencyCode: 'COP',
      createdBy: 'user-1',
      createdAt: '2026-11-01T12:00:00.000Z',
      updatedAt: '2026-11-01T12:00:00.000Z',
    },
    membership: {
      coupleSpaceId: 'couple-space-1',
      userId: 'user-1',
      role: 'owner',
      joinedAt: '2026-11-01T12:00:00.000Z',
    },
    members: [
      {
        userId: 'user-1',
        displayName: 'Brayan Román',
        role: 'owner',
        joinedAt: '2026-11-01T12:00:00.000Z',
      },
      {
        userId: 'user-2',
        displayName: 'Ana María',
        role: 'member',
        joinedAt: '2026-11-01T12:00:00.000Z',
      },
    ],
  };

  const activityItems: FinancialActivityItem[] = [
    {
      id: 'transaction-1',
      coupleSpaceId: 'couple-space-1',
      createdBy: 'user-2',
      transactionType: 'expense',
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      amount: '25000.0000',
      currencyCode: 'COP',
      effectiveDate: '2026-11-04',
      concept: 'Mercado semanal',
      expenseScope: 'shared',
      isSmallExpense: false,
      createdAt: '2026-11-04T12:00:00.000Z',
      updatedAt: '2026-11-04T12:00:00.000Z',
      categoryName: 'Alimentación',
      subcategoryName: 'Mercado',
    },
  ];

  const activitySummary: FinancialActivitySummary = {
    incomeTotal: '4000000.0000',
    expenseTotal: '25000.0000',
    balance: '3975000.0000',
  };

  let component: FinancialActivityPage;
  let fixture: ComponentFixture<FinancialActivityPage>;

  beforeEach(async () => {
    vi.clearAllMocks();
    getCurrentCoupleSpace.mockResolvedValue(overview);
    getFinancialActivity.mockResolvedValue(activityItems);
    getFinancialActivitySummary.mockResolvedValue(activitySummary);
    requireAuthenticatedUserId.mockReturnValue('user-1');

    await TestBed.configureTestingModule({
      imports: [FinancialActivityPage],
      providers: [
        {
          provide: CoupleSpaceService,
          useValue: coupleSpaceServiceMock,
        },
        {
          provide: FinancialService,
          useValue: financialServiceMock,
        },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialActivityPage);
    component = fixture.componentInstance;
  });

  async function initializeComponent(): Promise<void> {
    fixture.detectChanges();
    await vi.waitFor(() => expect(component.isLoading()).toBe(false));
    fixture.detectChanges();
  }

  it('should load and render the current couple space activity and summary', async () => {
    await initializeComponent();

    const content = (fixture.nativeElement as HTMLElement).textContent;

    expect(getCurrentCoupleSpace).toHaveBeenCalledTimes(1);
    expect(getFinancialActivity).toHaveBeenCalledWith(
      expect.objectContaining({ coupleSpaceId: 'couple-space-1', limit: 50 }),
    );
    expect(getFinancialActivitySummary).toHaveBeenCalledWith(
      expect.objectContaining({ coupleSpaceId: 'couple-space-1' }),
    );
    expect(component.activityItems()).toEqual(activityItems);
    expect(component.activitySummary()).toEqual(activitySummary);
    expect(content).toContain('Alimentación');
    expect(content).toContain('Ana María');
    expect(content).toContain('Gasto');
    expect(content).toContain('Compartido');
  });

  it('should reload only the authenticated user activity when selecting the personal view', async () => {
    await initializeComponent();
    getFinancialActivity.mockClear();
    getFinancialActivitySummary.mockClear();

    component.onViewChange('me');

    await vi.waitFor(() => expect(component.isLoading()).toBe(false));

    expect(component.selectedView()).toBe('me');
    expect(getFinancialActivity).toHaveBeenCalledWith(
      expect.objectContaining({ creatorId: 'user-1' }),
    );
    expect(getFinancialActivitySummary).toHaveBeenCalledWith(
      expect.objectContaining({ creatorId: 'user-1' }),
    );
  });

  it('should show guidance instead of loading activity when the partner view has no second member', async () => {
    getCurrentCoupleSpace.mockResolvedValue({
      ...overview,
      members: [overview.members[0]],
    });
    await initializeComponent();
    getFinancialActivity.mockClear();
    getFinancialActivitySummary.mockClear();

    component.onViewChange('partner');

    await vi.waitFor(() => expect(component.isLoading()).toBe(false));
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent;

    expect(getFinancialActivity).not.toHaveBeenCalled();
    expect(getFinancialActivitySummary).not.toHaveBeenCalled();
    expect(content).toContain('Aún no tienes una pareja vinculada.');
  });
});
