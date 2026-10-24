import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { AuthService } from '../../auth/services/auth.service';
import type { CoupleSpaceOverview } from '../models/couple-space-overview.model';
import { CoupleSpaceService } from './couple-space.service';

describe('CoupleSpaceService', () => {
  const from = vi.fn();
  const rpc = vi.fn();
  const user = vi.fn();

  const supabaseClientMock = {
    from,
    rpc,
  } as unknown as SupabaseClient;

  const authServiceMock = {
    user,
  } as unknown as AuthService;

  const overview: CoupleSpaceOverview = {
    coupleSpace: {
      id: 'couple-space-1',
      name: 'Nuestro espacio',
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
    memberCount: 2,
  };

  let service: CoupleSpaceService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        CoupleSpaceService,
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

    service = TestBed.inject(CoupleSpaceService);
  });

  it('should return null when the authenticated user does not belong to a couple space', async () => {
    user.mockReturnValue({ id: 'user-1' });

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });

    from.mockReturnValue({ select });

    await expect(service.getCurrentCoupleSpace()).resolves.toBeNull();

    expect(from).toHaveBeenCalledWith('couple_space_memberships');
    expect(select).toHaveBeenCalledWith('couple_space_id,user_id,role,joined_at');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('should retrieve and map the authenticated user couple space overview', async () => {
    user.mockReturnValue({ id: 'user-1' });

    const membershipRow = {
      couple_space_id: 'couple-space-1',
      user_id: 'user-1',
      role: 'owner',
      joined_at: '2026-10-24T12:00:00.000Z',
    };
    const coupleSpaceRow = {
      id: 'couple-space-1',
      name: 'Nuestro espacio',
      created_by: 'user-1',
      created_at: '2026-10-24T12:00:00.000Z',
      updated_at: '2026-10-24T12:00:00.000Z',
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: membershipRow, error: null });
    const membershipEq = vi.fn().mockReturnValue({ maybeSingle });
    const memberCountEq = vi.fn().mockResolvedValue({
      data: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
      error: null,
    });
    const membershipsSelect = vi.fn((columns: string) => {
      if (columns === 'couple_space_id,user_id,role,joined_at') {
        return { eq: membershipEq };
      }

      return { eq: memberCountEq };
    });
    const single = vi.fn().mockResolvedValue({ data: coupleSpaceRow, error: null });
    const coupleSpaceEq = vi.fn().mockReturnValue({ single });
    const coupleSpaceSelect = vi.fn().mockReturnValue({ eq: coupleSpaceEq });

    from.mockImplementation((table: string) => {
      if (table === 'couple_space_memberships') {
        return { select: membershipsSelect };
      }

      return { select: coupleSpaceSelect };
    });

    await expect(service.getCurrentCoupleSpace()).resolves.toEqual(overview);

    expect(from).toHaveBeenCalledWith('couple_spaces');
    expect(memberCountEq).toHaveBeenCalledWith('couple_space_id', 'couple-space-1');
  });

  it('should create a couple space with a normalized name and return its overview', async () => {
    user.mockReturnValue({ id: 'user-1' });
    rpc.mockResolvedValue({ data: 'couple-space-1', error: null });
    const getCurrentCoupleSpace = vi
      .spyOn(service, 'getCurrentCoupleSpace')
      .mockResolvedValue(overview);

    await expect(service.createCoupleSpace('  Nuestro espacio  ')).resolves.toEqual(overview);

    expect(rpc).toHaveBeenCalledWith('create_couple_space', {
      p_name: 'Nuestro espacio',
    });
    expect(getCurrentCoupleSpace).toHaveBeenCalledTimes(1);
  });

  it('should create an invitation and accept it using a normalized token', async () => {
    user.mockReturnValue({ id: 'user-2' });
    rpc
      .mockResolvedValueOnce({ data: 'invitation-token', error: null })
      .mockResolvedValueOnce({ data: 'couple-space-1', error: null });
    const getCurrentCoupleSpace = vi
      .spyOn(service, 'getCurrentCoupleSpace')
      .mockResolvedValue(overview);

    await expect(service.createCoupleSpaceInvitation()).resolves.toBe('invitation-token');
    await expect(service.acceptCoupleSpaceInvitation('  invitation-token  ')).resolves.toEqual(
      overview,
    );

    expect(rpc).toHaveBeenNthCalledWith(1, 'create_couple_space_invitation');
    expect(rpc).toHaveBeenNthCalledWith(2, 'accept_couple_space_invitation', {
      p_token: 'invitation-token',
    });
    expect(getCurrentCoupleSpace).toHaveBeenCalledTimes(1);
  });
});
