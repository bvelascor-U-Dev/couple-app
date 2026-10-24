export type CoupleSpaceRole = 'owner' | 'member';

export interface CoupleSpaceMembership {
  coupleSpaceId: string;
  userId: string;
  role: CoupleSpaceRole;
  joinedAt: string;
}
