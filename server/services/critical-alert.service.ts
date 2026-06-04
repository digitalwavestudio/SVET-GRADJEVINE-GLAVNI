import { logger } from '../utils/logger';

// Optional: Set these from environment variables in production
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

export class CriticalAlertService {
  /**
   * Prijavljuje sistemski kritične događaje kao što su prekoračenje kvota ili nedostupnost resursa.
   */
  static async triggerResourceAlert(title: string, details: any = {}) {
    logger.error(`[CRITICAL ALERT] ${title}`, JSON.stringify(details, null, 2));

    if (DISCORD_WEBHOOK_URL) {
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `🚨 **CRITICAL ALERT: ${title}** 🚨\n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\``,
          }),
        });
      } catch (err) {
        logger.error('[CRITICAL ALERT] Failed to send Discord webhook', err);
      }
    }
  }

  /**
   * Specifična metoda za Firestore Quote / RESOURCE_EXHAUSTED greške
   */
  static async notifyQuotaExceeded(errorDetails: any) {
    await this.triggerResourceAlert('Firestore Quota Exceeded / RESOURCE_EXHAUSTED', errorDetails);
  }
}
