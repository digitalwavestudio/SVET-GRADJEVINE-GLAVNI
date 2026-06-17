import { exportService } from './exportService';

/**
 * Detects and filters out benign/non-actionable/third-party Chrome/Firefox/Safari extension errors.
 */
const isBenignExtensionOrThirdPartyError = (
  error: unknown,
  message: string = '',
  filename: string = ''
): boolean => {
  const lowercaseMsg = (message || '').toLowerCase();
  const lowercaseFilename = (filename || '').toLowerCase();
  const stack = error instanceof Error ? (error.stack || '').toLowerCase() : '';

  // 1. Filter out extension protocols
  if (
    lowercaseFilename.includes('chrome-extension://') ||
    lowercaseFilename.includes('moz-extension://') ||
    lowercaseFilename.includes('safari-extension://') ||
    lowercaseFilename.includes('safari-web-extension://') ||
    stack.includes('chrome-extension://') ||
    stack.includes('moz-extension://') ||
    stack.includes('safari-extension://')
  ) {
    return true;
  }

  // 2. Filter out known noisy non-actionable browser-level performance errors or synthetic/playwright noise
  if (
    lowercaseMsg.includes('resizeobserver') ||
    lowercaseMsg.includes('extension') ||
    lowercaseMsg.includes('script error') ||
    lowercaseMsg.includes('missing-service-account') ||
    lowercaseMsg.includes('top.__playwright')
  ) {
    return true;
  }

  // 3. Filter out known noisy browser extensions and third-party scripts (AdBlockers, password managers, analytics)
  const noisySignatures = [
    'extensions/',
    'content.js',
    'background.js',
    'inject',
    'grammarly',
    'adblock',
    'lastpass',
    'dashlane',
    '1password',
    'ublock',
    'react-devtools',
    'loom',
    'bitwarden',
    'avast',
    'kaspersky',
    'mcafee',
    'coinhive',
    'cryptoloot',
    'safari-web-extension',
    'serviceworker',
    'gtag',
    'analytics',
    'fbevents.js',
    'facebook'
  ];

  if (noisySignatures.some(sig => lowercaseMsg.includes(sig) || lowercaseFilename.includes(sig) || stack.includes(sig))) {
    return true;
  }

  return false;
};

/**
 * Svet Građevine - Global Reliability Monitor
 * Captures non-React runtime errors, hydration mismatches, and network failures.
 */
export const initErrorMonitor = () => {
  if (typeof window === 'undefined') return;

  // 1. Unhandled Runtime Errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    const msg = error instanceof Error ? error.message : event.message || '';
    const file = event.filename || '';

    // Ignore benign errors (e.g. Chrome extension noise)
    if (isBenignExtensionOrThirdPartyError(error, msg, file)) return;

    exportService.reportError(error || msg, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'runtime_error',
      severity: 'medium'
    });
  });

  // 2. Unhandled Promise Rejections (e.g. failed fetch not caught)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason || '');

    // Ignore extension and third-party rejection noise
    if (isBenignExtensionOrThirdPartyError(reason, msg, '')) return;

    exportService.reportError(reason || 'Unhandled Promise Rejection', {
      type: 'unhandled_promise_rejection',
      severity: 'medium'
    });
  });

  // 3. Hydration Mismatch Detection (React 18+)
  // React 18 logs specific warnings for hydration. We can sniff console.error.
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('Hydration') || msg.includes('did not match'))) {
      exportService.reportError('Hydration Mismatch', {
        details: msg,
        type: 'hydration_error',
        severity: 'low'
      });
    }
    originalError.apply(console, args);
  };

  if (import.meta.env.DEV) console.log('[Reliability] Global Error Monitoring Active');
};
