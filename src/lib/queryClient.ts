// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { trackMutationError } from "@/src/utils/telemetry";

// Persister is created locally in main.tsx — this export is unused
// export const persister = typeof window !== "undefined"
//   ? createAsyncStoragePersister({
//       storage: asyncSafeStorage,
//       key: "SVET_GRADJEVINE_OFFLINE_CACHE",
//     })
//   : undefined;

function getFormattedErrorMessage(error: unknown, fallbackMessage: string): string {
  // Safe extraction of network/status errors
  let isForbidden = false;
  let status: number | null = null;
  let statusCode: number | null = null;
  let resStatus: number | null = null;
  let errName: string | null = null;
  let errMsg: string | null = null;
  let errData: Record<string, unknown> | null = null;

  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.status === 'number') status = errObj.status;
    if (typeof errObj.statusCode === 'number') statusCode = errObj.statusCode;
    if (typeof errObj.name === 'string') errName = errObj.name;
    if (typeof errObj.message === 'string') errMsg = errObj.message;
    if (errObj.response && typeof errObj.response === 'object') {
      const resp = errObj.response as Record<string, unknown>;
      if (typeof resp.status === 'number') resStatus = resp.status;
    }
    if (errObj.data && typeof errObj.data === 'object') {
      errData = errObj.data as Record<string, unknown>;
    }
  }

  isForbidden =
    status === 403 ||
    statusCode === 403 ||
    resStatus === 403 ||
    (errMsg !== null &&
      (errMsg.includes("403") ||
        errMsg.toLowerCase().includes("forbidden") ||
        errMsg.toLowerCase().includes("permissions") ||
        errMsg.toLowerCase().includes("unauthorized")));

  if (isForbidden) {
    return "Nemate dozvolu za pristup ovim podacima";
  }

  if (errName === "ApiError" && errData) {
    if (Array.isArray(errData.issues)) {
      const issues = errData.issues as Array<{ path?: string[]; message?: string }>;
      return issues.map((i) => `${i.path?.join(".") || "unknown"}: ${i.message || "Unknown issue"}`).join("\n");
    }
    if (typeof errData.error === 'string') {
      return errData.error;
    }
  }

  if (errMsg) {
    try {
      const parsed = JSON.parse(errMsg) as { error?: string };
      if (
        parsed.error &&
        (parsed.error.toLowerCase().includes("permissions") ||
          parsed.error.toLowerCase().includes("forbidden") ||
          parsed.error.toLowerCase().includes("403"))
      ) {
        return "Nemate dozvolu za pristup ovim podacima";
      } else if (parsed.error) {
        return parsed.error;
      }
    } catch (e) {
      // Ignorisanje greške parsiranja
    }
  }

  return errMsg || fallbackMessage;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      console.error("[React Query] Global Query Error:", error);
      const message = getFormattedErrorMessage(
        error,
        "Došlo je do greške prilikom učitavanja podataka.",
      );
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown, variables: unknown, context: unknown, mutation: unknown) => {
      console.error("[React Query] Global Mutation Error:", error);

      // Asynchronously track the mutation error in our telemetry system
      try {
        trackMutationError(error, mutation);
      } catch (err) {
        console.error("[Telemetry] Error tracking mutation:", err);
      }

      const message = getFormattedErrorMessage(
        error,
        "Došlo je do greške prilikom izvršavanja akcije.",
      );
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      // 10 minuta za sprečavanje re-fetching zaostalih podataka u kratkim intervalima
      staleTime: 1000 * 60 * 10,
      // 10 minuta čuvanje u memoriji kako bi se zadržala topla memorjska struktura (gcTime)
      gcTime: 1000 * 60 * 10,
      // Onemogućava se refetchOnWindowFocus radi eliminacije poplave mrežnih requestova (N+1)
      refetchOnWindowFocus: false,
      // Sprečava waterfall mount-ovanje komponenata (ZADATAK 8)
      refetchOnMount: false,
      // Ne pokušavaj stalno ako je not-found ili mreža spora
      retry: 1,
      refetchOnReconnect: false, // sprečava udar na server nakon gubljenja i vraćanja konekcije
      // Rerender Shield: TanStack Query (v5) podrazumevano koristi 'tracked' režim za automatsko praćenje korišćenih propertija
      // Enterprise Optimization: Sprečava referentne promene za identične JSON strukture (eliminiše nepotrebne re-rendere)
      structuralSharing: true,
    },
  },
});
