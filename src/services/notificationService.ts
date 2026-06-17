import { NotificationEventType, NotificationPayload } from '@/src/modules/dashboard';
import { apiClient } from '@/src/lib/apiClient';

/**
 * Standardized trigger function to align with future Backend API (DISPATCH_NOTIFICATION)
 */
export const notificationService = {
  /**
   * Triggers a notification event. 
   * Prepares payload for future 'NotificationDispatchContract' integration.
   */
  async trigger(eventType: NotificationEventType, payload: NotificationPayload) {
    const activity = {
      userId: payload.userId,
      type: eventType,
      targetId: payload.targetId,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata || {},
      priority: payload.priority || 'medium',
      read: false
    };

    try {
      await apiClient.post('/notifications', { activity });
      console.info('✅ Aktivnost/notifikacija poslata serveru.');
    } catch (err) {
      console.error('[NOTIFY] Error:', err);
      return false;
    }
    
    return true;
  }
};

