export interface NotificationDispatchContract {
  eventType: string; // 'MODERATION_APPROVED', 'CHECKOUT_CONFIRMED', etc
  recipientId: string;
  recipientEmail: string;
  templateId?: string;
  templateData: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
}
