import { CoupleSpaceRole } from './couple-space-membership.model';

export interface CoupleSpaceMember {
  userId: string;
  displayName: string;
  role: CoupleSpaceRole;
  joinedAt: string;
}
