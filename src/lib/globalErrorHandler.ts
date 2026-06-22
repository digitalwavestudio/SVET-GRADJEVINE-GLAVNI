/**
 * Global frontend error handler — installed once at app bootstrap.
 *
 * Extracted from src/main.tsx so that import order is explicit and the handler
 * is registered through a normal import (clearer than side-effect statements
 * mixed with React imports at the top of the entry file).
 *
 * - Filters benign platform/extension errors (ResizeObserver, ServiceWorker, fetch proxy).
 * - POSTs real errors to /api/dev/log-error (server-side guard: dev-only + rate-limited).
 * - Mirrors the inline handler in index.html; both are safe to co-exist because
 *   they no-op on the same filtered substrings.
 */

const BENIGN_SUBSTRINGS = [
  "cannot set property fetch",
  "fetch of #<window>",
  "resizeobserver",
  "script error",
  "serviceworker",
  "abort",
];

const isBenign = (raw: unknown): boolean => {
  const s = String(raw ?? "").toLowerCase();
  return BENIGN_SUBSTRINGS.some((sub) => s.includes(sub));
};

const postError = (payload: Record<string, unknown>) => {
  try {
    fetch("/api/dev/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => console.warn("[globalErrorHandler] log fetch failed"));
  } catch (e) {
    console.error("[globalErrorHandler] log post error:", e);
  }
};

export function installGlobalErrorHandler() {
  if (typeof window === "undefined") return;

  // Avoid double-install in StrictMode / HMR
  if ((window as unknown as { __sgErrorHandlerInstalled?: boolean }).__sgErrorHandlerInstalled) return;
  (window as unknown as { __sgErrorHandlerInstalled?: boolean }).__sgErrorHandlerInstalled = true;

  window.onerror = function (message, source, lineno, colno, error) {
    if (isBenign(message)) {
      console.warn("[Benign Platform Error Ignored]:", message);
      return true; // Cancel error bubbling & console dump
    }
    postError({
      type: "window.onerror",
      message,
      source,
      lineno,
      colno,
      stack: error?.stack,
    });
    console.error("[Main] Global Error:", { message, source, lineno, colno, stack: error?.stack });
  };

  window.addEventListener("unhandledrejection", function (event) {
    const reason = event.reason;
    const reasonMsg = reason?.message ?? reason;
    if (isBenign(reasonMsg)) {
      console.warn("[Benign Rejection Ignored]:", reason);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    postError({
      type: "unhandledrejection",
      reason: reason?.message ?? String(reason),
      stack: reason?.stack,
    });
    console.error("[Main] Unhandled Promise Rejection:", reason);
  });
}
