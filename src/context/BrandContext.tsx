import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

interface BrandContextType {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  isLoading: boolean;
}

interface BrandingResponse {
  logoUrl?: string;
}

const BrandContext = createContext<BrandContextType>({ logoUrl: null, setLogoUrl: () => {}, isLoading: true });

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const queryKey = ['branding', 'logo'];

  const { data: logoUrl, isLoading } = useQuery<string | null>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await apiClient.get<BrandingResponse>('/branding');
        return data?.logoUrl || null;
      } catch (error) {
        console.error("Greška pri učitavanju logotipa:", error);
        return null;
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // Keep in memory for 24h
  });

  const setLogoUrl = (url: string | null) => {
    queryClient.setQueryData(queryKey, url);
  };

  return (
    <BrandContext.Provider value={{ logoUrl: logoUrl ?? null, setLogoUrl, isLoading }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrandLogo = () => useContext(BrandContext);
