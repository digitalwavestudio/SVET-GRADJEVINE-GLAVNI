import { exportService } from './exportService';

/**
 * Svet Građevine - Client-Side Threat Intelligence
 * Detects bot patterns before they hit the server
 */
export const securityObserver = {
  /**
   * Reports suspicious client behavior to the backend
   */
  reportSuspiciousActivity(type: 'bot_navigation' | 'honeypot_touch' | 'rapid_input', metadata: Record<string, unknown> = {}) {
     exportService.enqueue({
       type: 'event',
       name: `security_${type}`,
       category: 'security',
       metadata: {
         ...metadata,
         is_suspicious: true,
         threat_level: type === 'honeypot_touch' ? 'high' : 'medium'
       }
     });
  },

  /**
   * Use this to bind to "invisible" buttons/inputs that only bots find in DOM
   */
  bindHoneypot(element: HTMLElement) {
    element.addEventListener('click', (e) => {
      this.reportSuspiciousActivity('honeypot_touch', { element_id: element.id });
    });
  }
};
