import { CoupleSpaceMember } from './couple-space-member.model';
import { CoupleSpaceMembership } from './couple-space-membership.model';
import { CoupleSpace } from './couple-space.model';

export interface CoupleSpaceOverview {
  coupleSpace: CoupleSpace;
  membership: CoupleSpaceMembership;
  members: CoupleSpaceMember[];
}
