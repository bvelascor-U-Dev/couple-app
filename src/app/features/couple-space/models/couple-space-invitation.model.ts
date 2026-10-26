export type CoupleSpaceInvitationStatus = 'pending' | 'accepted' | 'expired';

export interface CoupleSpaceInvitation {
  invitationId: string;
  token: string;
  status: CoupleSpaceInvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}
