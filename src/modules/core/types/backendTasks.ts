/**
 * Registry of Backend Tasks that will be invoked via API/Cloud Functions.
 */
export const BACKEND_TASKS = {
  CREATE_PAYMENT_SESSION: 'POST /api/payments/session',
  PROCESS_WEBHOOK: 'POST /api/webhooks/payment',
  VERIFY_PARTNER_CONVERSION: 'POST /api/partners/verify-conversion',
  SUBMIT_JOB_APPLICATION: 'POST /api/jobs/apply',
  DISPATCH_NOTIFICATION: 'POST /api/notifications/dispatch',
  PERFORM_MODERATION: 'POST /api/moderation/execute'
};
