export interface ModerationActionContract {
  adminId: string;
  collectionName: string;
  targetId: string;
  action: 'approve' | 'reject' | 'flag' | 'delete';
  reason?: string;
  internalNotes?: string;
}
