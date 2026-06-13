export type NotificationEventType = 
  | 'MODERATION_APPROVED' 
  | 'MODERATION_REJECTED' 
  | 'CHECKOUT_CONFIRMED' 
  | 'CHECKOUT_FAILED' 
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_REVIEWED' 
  | 'APPLICATION_ACCEPTED' 
  | 'APPLICATION_REJECTED'
  | 'MESSAGE_RECEIVED'
  | 'MATCH_FOUND'
  | 'RESOURCE_AVAILABLE'
  | 'WALLET_TRANSACTION'
  | 'PROFILE_VERIFIED';

export interface NotificationPayload {
  userId: string;
  targetId: string; // ID of the entity (job, application, checkout, etc)
  recipientEmail?: string; // Optional: Backend will usually fetch this from userId
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high';
}
