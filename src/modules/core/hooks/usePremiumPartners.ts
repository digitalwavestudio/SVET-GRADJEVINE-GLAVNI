import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

export interface Partner {
  id: string;
  name: string;
  logo: string;
}

const FALLBACK_PARTNERS: Partner[] = [
  { id: "f1", name: "ENERGOPROJEKT", logo: "" },
  { id: "f2", name: "STRABAG", logo: "" },
  { id: "f3", name: "NAPRED", logo: "" },
  { id: "f4", name: "LUCID", logo: "" },
  { id: "f5", name: "PUTEVI SRBIJE", logo: "" },
];

export function usePremiumPartners() {
  return useQuery({
    queryKey: ["premium-partners"],
    queryFn: async () => {
      const data = await apiClient.get<Partner[]>("/ads/premium-partners");
      return data && data.length > 0 ? data : FALLBACK_PARTNERS;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes fresh
    gcTime: 60 * 60 * 1000,    // 1 hour in memory
    placeholderData: FALLBACK_PARTNERS,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
