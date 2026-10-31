import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { CoupleSpaceInvitation } from '../../models/couple-space-invitation.model';
import type { CoupleSpaceOverview } from '../../models/couple-space-overview.model';
import { CoupleSpaceService } from '../../services/couple-space.service';
import { CoupleSpacePage } from './couple-space-page';

describe('CoupleSpacePage', () => {
  const getCurrentCoupleSpace = vi.fn();
  const createCoupleSpace = vi.fn();
  const createCoupleSpaceInvitation = vi.fn();
  const getCurrentInvitation = vi.fn();
  const acceptCoupleSpaceInvitation = vi.fn();

  const coupleSpaceServiceMock = {
    getCurrentCoupleSpace,
    createCoupleSpace,
    createCoupleSpaceInvitation,
    getCurrentInvitation,
    acceptCoupleSpaceInvitation,
  };

  const overview: CoupleSpaceOverview = {
    coupleSpace: {
      id: 'couple-space-1',
      name: 'Sofia y Daniel',
      currencyCode: 'COP',
      createdBy: 'user-1',
      createdAt: '2026-10-24T12:00:00.000Z',
      updatedAt: '2026-10-24T12:00:00.000Z',
    },
    membership: {
      coupleSpaceId: 'couple-space-1',
      userId: 'user-1',
      role: 'owner',
      joinedAt: '2026-10-24T12:00:00.000Z',
    },
    members: [
      {
        userId: 'user-1',
        displayName: 'Sofia Example',
        role: 'owner',
        joinedAt: '2026-10-24T12:00:00.000Z',
      },
      {
        userId: 'user-2',
        displayName: 'Daniel Example',
        role: 'member',
        joinedAt: '2026-10-24T12:30:00.000Z',
      },
    ],
  };

  const pendingInvitation: CoupleSpaceInvitation = {
    invitationId: 'invitation-1',
    token: 'invitation-token',
    status: 'pending',
    expiresAt: '2026-11-02T12:00:00.000Z',
    acceptedAt: null,
    createdAt: '2026-10-26T12:00:00.000Z',
  };

  let component: CoupleSpacePage;
  let fixture: ComponentFixture<CoupleSpacePage>;

  beforeEach(async () => {
    vi.clearAllMocks();
    getCurrentCoupleSpace.mockResolvedValue(null);
    getCurrentInvitation.mockResolvedValue(null);

    await TestBed.configureTestingModule({
      imports: [CoupleSpacePage],
      providers: [
        {
          provide: CoupleSpaceService,
          useValue: coupleSpaceServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoupleSpacePage);
    component = fixture.componentInstance;
  });

  it('should load and render the current couple space members', async () => {
    getCurrentCoupleSpace.mockResolvedValue(overview);

    fixture.detectChanges();
    await vi.waitFor(() => expect(component.isLoading()).toBe(false));
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent;

    expect(getCurrentCoupleSpace).toHaveBeenCalledTimes(1);
    expect(component.coupleSpaceOverview()).toEqual(overview);
    expect(content).toContain('Sofia y Daniel');
    expect(content).toContain('Sofia Example');
    expect(content).toContain('Daniel Example');
    expect(content).toContain('2 de 2');
  });

  it('should not submit invalid create or join forms', async () => {
    await component.onCreateSpace();
    await component.onJoinSpace();

    expect(component.createSpaceForm.controls.name.touched).toBe(true);
    expect(component.joinSpaceForm.controls.invitationToken.touched).toBe(true);
    expect(createCoupleSpace).not.toHaveBeenCalled();
    expect(acceptCoupleSpaceInvitation).not.toHaveBeenCalled();
  });

  it('should create a couple space and then generate an invitation', async () => {
    const ownerOverview: CoupleSpaceOverview = {
      ...overview,
      members: [overview.members[0]],
    };
    createCoupleSpace.mockResolvedValue(ownerOverview);
    createCoupleSpaceInvitation.mockResolvedValue('invitation-token');
    getCurrentInvitation.mockResolvedValue(pendingInvitation);
    component.createSpaceForm.setValue({ name: 'Sofia y Daniel' });

    await component.onCreateSpace();
    await component.onCreateInvitation();

    expect(createCoupleSpace).toHaveBeenCalledWith('Sofia y Daniel');
    expect(component.coupleSpaceOverview()).toEqual(ownerOverview);
    expect(createCoupleSpaceInvitation).toHaveBeenCalledTimes(1);
    expect(getCurrentInvitation).toHaveBeenCalledTimes(1);
    expect(component.currentInvitation()).toEqual(pendingInvitation);
    expect(component.successMessage()).toBe('La invitación está lista para compartir.');
    expect(component.isCreating()).toBe(false);
    expect(component.isCreatingInvitation()).toBe(false);
  });
});
