import { useState, useEffect } from "react";
import { db } from "@/src/firebase-db";
import { doc, onSnapshot } from "firebase/firestore";

interface VerificationResult {
  isProvisioned: boolean;
  isLoading: boolean;
  error: string | null;
  status: string | null;
}

export const useCheckoutVerification = (
  sessionId: string | null,
): VerificationResult => {
  const [state, setState] = useState<VerificationResult>({
    isProvisioned: false,
    isLoading: true, // Sprečavamo flickering pre prvog fetch-a
    error: null,
    status: null,
  });

  const [isTabSuspended, setIsTabSuspended] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    let suspendTimeoutId: any = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        suspendTimeoutId = setTimeout(() => {
          if (import.meta.env.DEV) console.log("[useCheckoutVerification] Idle timeout exceeded. Disconnecting checkout subscription to save counts.");
          setIsTabSuspended(true);
        }, 180000);
      } else {
        if (suspendTimeoutId) {
          clearTimeout(suspendTimeoutId);
          suspendTimeoutId = null;
        }
        setIsTabSuspended(false); // Sigurno stanje bez referenciranja same sebe za proveru
        if (import.meta.env.DEV) console.log("[useCheckoutVerification] Active state restored. Resuming checkout subscription.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (suspendTimeoutId) clearTimeout(suspendTimeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!sessionId || isTabSuspended) {
      if (isTabSuspended) {
        setState(prev => prev.isLoading ? { ...prev, isLoading: false } : prev);
      } else {
        setState({
          isProvisioned: false,
          isLoading: false,
          error: "missing_session_id",
          status: null,
        });
      }
      return;
    }

    const docRef = doc(db, "checkout_sessions", sessionId);
    
    // Timeout of 30 seconds for pending processes
    const timeoutMsg = setTimeout(() => {
      setState(prev => {
        if (!prev.isProvisioned && prev.status !== "PROVISIONED") {
          return {
            ...prev,
            isLoading: false,
            error: "timeout",
          };
        }
        return prev;
      });
    }, 30000);

    let lastExecution = 0;
    let throttleTimer: any = null;
    let pendingUpdate: (() => void) | null = null;

    const runThrottledUpdate = (updateFn: () => void) => {
      const now = Date.now();
      const remaining = 1500 - (now - lastExecution);

      if (remaining <= 0) {
        if (throttleTimer) {
          clearTimeout(throttleTimer);
          throttleTimer = null;
        }
        lastExecution = now;
        updateFn();
        pendingUpdate = null;
      } else {
        pendingUpdate = updateFn;
        if (!throttleTimer) {
          throttleTimer = setTimeout(() => {
            if (pendingUpdate) {
              lastExecution = Date.now();
              pendingUpdate();
              pendingUpdate = null;
            }
            throttleTimer = null;
          }, remaining);
        }
      }
    };

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) {
        runThrottledUpdate(() => {
          setState({
            isProvisioned: false,
            isLoading: false,
            error: "session_not_found",
            status: null,
          });
        });
        return;
      }

      const data = snapshot.data();
      const status = data?.status || "PENDING";

      if (status === "PROVISIONED") {
        clearTimeout(timeoutMsg);
        runThrottledUpdate(() => {
          setState({
            isProvisioned: true,
            isLoading: false,
            error: null,
            status: "PROVISIONED",
          });
        });
      } else {
        runThrottledUpdate(() => {
          setState(prev => {
            if (prev.status === status && !prev.isLoading) return prev;
            return {
              ...prev,
              status,
              isLoading: false
            };
          });
        });
      }
    }, (error) => {
      console.error("[useCheckoutVerification] snapshot error:", error);
      clearTimeout(timeoutMsg);
      runThrottledUpdate(() => {
        setState({
          isProvisioned: false,
          isLoading: false,
          error: "network_error",
          status: null,
        });
      });
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutMsg);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [sessionId, isTabSuspended]);

  return state;
};
