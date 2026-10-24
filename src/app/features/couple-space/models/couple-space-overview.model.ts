import { CoupleSpaceMembership } from './couple-space-membership.model';
import { CoupleSpace } from './couple-space.model';

export interface CoupleSpaceOverview {
  coupleSpace: CoupleSpace;
  membership: CoupleSpaceMembership;
  memberCount: number;
}
