let installed = false;

export const installGlobalErrorHandler = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const message = event.message || "Unknown error";
    const source = event.filename ? ` @ ${event.filename}:${event.lineno}` : "";
    console.error(`[global-error]${source}: ${message}`, event.error ?? "");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : JSON.stringify(reason);
    console.error(`[unhandled-rejection]: ${message}`, reason ?? "");
  });
};
