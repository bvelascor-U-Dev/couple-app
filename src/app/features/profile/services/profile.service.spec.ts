import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { AuthService } from '../../auth/services/auth.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const from = vi.fn();
  const user = vi.fn();

  const supabaseClientMock = {
    from,
  } as unknown as SupabaseClient;

  const authServiceMock = {
    user,
  } as unknown as AuthService;

  let service: ProfileService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
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

    service = TestBed.inject(ProfileService);
  });

  it('should retrieve and map the authenticated user profile', async () => {
    user.mockReturnValue({ id: 'user-1' });

    const profileRow = {
      id: 'user-1',
      display_name: 'Sofia Example',
      created_at: '2026-10-19T12:00:00.000Z',
      updated_at: '2026-10-19T12:00:00.000Z',
    };
    const single = vi.fn().mockResolvedValue({ data: profileRow, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });

    from.mockReturnValue({ select });

    const result = await service.getProfile();

    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('id,display_name,created_at,updated_at');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(result).toEqual({
      id: 'user-1',
      displayName: 'Sofia Example',
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:00:00.000Z',
    });
  });

  it('should update the authenticated user profile with a normalized display name', async () => {
    user.mockReturnValue({ id: 'user-1' });

    const profileRow = {
      id: 'user-1',
      display_name: 'Sofia Example',
      created_at: '2026-10-19T12:00:00.000Z',
      updated_at: '2026-10-19T12:30:00.000Z',
    };
    const single = vi.fn().mockResolvedValue({ data: profileRow, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });

    from.mockReturnValue({ update });

    const result = await service.updateProfile({ displayName: '  Sofia Example  ' });

    expect(from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith({ display_name: 'Sofia Example' });
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(result).toEqual({
      id: 'user-1',
      displayName: 'Sofia Example',
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:30:00.000Z',
    });
  });

  it('should reject profile operations when there is no authenticated user', async () => {
    user.mockReturnValue(null);

    await expect(service.getProfile()).rejects.toThrow('No authenticated user.');
    await expect(service.updateProfile({ displayName: 'Sofia Example' })).rejects.toThrow(
      'No authenticated user.',
    );

    expect(from).not.toHaveBeenCalled();
  });
});
