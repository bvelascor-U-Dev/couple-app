import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.provider';
import { AuthService } from '../../auth/services/auth.service';
import { CoupleSpaceOverview } from '../models/couple-space-overview.model';
import { CoupleSpace } from '../models/couple-space.model';
import { CoupleSpaceMembership } from '../models/couple-space-membership.model';
import { CoupleSpaceMember } from '../models/couple-space-member.model';

interface CoupleSpaceMemberRow {
  user_id: string;
  display_name: string;
  role: CoupleSpaceMember['role'];
  joined_at: string;
}

@Service()
export class CoupleSpaceService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly authService = inject(AuthService);

  public async getCurrentCoupleSpace(): Promise<CoupleSpaceOverview | null> {
    const userId = this.getAuthenticatedUserId();

    const coupleSpaceMembership: CoupleSpaceMembership | null =
      await this.getCoupleSpaceMembership(userId);

    if (coupleSpaceMembership == null) {
      return null;
    }

    const [coupleSpace, members] = await Promise.all([
      this.getCoupleSpace(coupleSpaceMembership.coupleSpaceId),
      this.getMembers(),
    ]);

    return {
      coupleSpace: coupleSpace,
      membership: coupleSpaceMembership,
      members: members,
    };
  }

  private async getCoupleSpaceMembership(id: string): Promise<CoupleSpaceMembership | null> {
    const { data, error } = await this.supabase
      .from('couple_space_memberships')
      .select('couple_space_id,user_id,role,joined_at')
      .eq('user_id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      coupleSpaceId: data.couple_space_id,
      userId: data.user_id,
      role: data.role,
      joinedAt: data.joined_at,
    };
  }

  private async getCoupleSpace(spaceId: string): Promise<CoupleSpace> {
    const { data, error } = await this.supabase
      .from('couple_spaces')
      .select('id,name,created_by,created_at,updated_at')
      .eq('id', spaceId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Couple space not found.');
    }

    return {
      id: data.id,
      name: data.name,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private async getMembers(): Promise<CoupleSpaceMember[]> {
    const { data, error } = await this.supabase.rpc('get_current_couple_space_members');

    if (error) {
      throw error;
    }

    const memberRows = (data ?? []) as CoupleSpaceMemberRow[];

    return memberRows.map((member) => ({
      userId: member.user_id,
      displayName: member.display_name,
      role: member.role,
      joinedAt: member.joined_at,
    }));
  }

  public async createCoupleSpace(name: string): Promise<CoupleSpaceOverview> {
    this.getAuthenticatedUserId();
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new Error('Invalid couple space name');
    }

    const { data: createdCoupleSpaceId, error } = await this.supabase.rpc('create_couple_space', {
      p_name: normalizedName,
    });

    if (error) {
      throw error;
    }

    if (!createdCoupleSpaceId) {
      throw new Error('Couple space creation did not return an identifier.');
    }

    const overview = await this.getCurrentCoupleSpace();

    if (!overview || overview.coupleSpace.id !== createdCoupleSpaceId) {
      throw new Error('Created couple space could not be loaded.');
    }

    return overview;
  }

  public async createCoupleSpaceInvitation(): Promise<string> {
    this.getAuthenticatedUserId();

    const { data, error } = await this.supabase.rpc('create_couple_space_invitation');

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Invitation creation did not return a token.');
    }
    return data;
  }

  public async acceptCoupleSpaceInvitation(token: string): Promise<CoupleSpaceOverview> {
    this.getAuthenticatedUserId();
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new Error('A valid invitation token is required.');
    }

    const { data: acceptedCoupleSpaceId, error } = await this.supabase.rpc(
      'accept_couple_space_invitation',
      { p_token: normalizedToken },
    );

    if (error) {
      throw error;
    }

    if (!acceptedCoupleSpaceId) {
      throw new Error('Invitation acceptance did not return a confirmation.');
    }

    const overview = await this.getCurrentCoupleSpace();

    if (!overview || acceptedCoupleSpaceId !== overview.coupleSpace.id) {
      throw new Error('Accepted couple space could not be loaded.');
    }

    return overview;
  }

  private getAuthenticatedUserId(): string {
    const userId = this.authService.user()?.id;

    if (!userId) {
      throw new Error('No authenticated user');
    }
    return userId;
  }
}
