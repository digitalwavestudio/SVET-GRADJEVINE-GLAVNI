import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/apiClient';
import { queryKeys } from '@/src/lib/queryKeysFactory';

export interface PublicUserProfile {
  id: string;
  status?: string;
  isPremiumProfile?: boolean;
  role?: string;
  companyId?: string;
  type?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  photoURL?: string;
  businessProfile?: {
    logo?: string;
    [key: string]: unknown;
  };
  cvData?: {
    about?: string;
    title?: string;
    skills?: string[];
    location?: string;
    experience?: {
      id?: string;
      title?: string;
      company?: string;
      startDate?: string;
      endDate?: string;
      current?: boolean;
      description?: string;
      [key: string]: unknown;
    }[];
    education?: {
      id?: string;
      degree?: string;
      institution?: string;
      year?: string | number;
      [key: string]: unknown;
    }[];
    portfolioTitle?: string;
    portfolioDescription?: string;
    portfolioImages?: string[];
    [key: string]: unknown;
  };
  description?: string;
  profession?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  _aggregatedAds?: {
    machines?: Record<string, unknown>[];
    accommodations?: Record<string, unknown>[];
    caterings?: Record<string, unknown>[];
    plots?: Record<string, unknown>[];
  };
  [key: string]: unknown;
}

export function usePublicProfileNode(id: string | undefined, isAdmin: boolean) {
  const queryClient = useQueryClient();

  const queryKey = queryKeys.user.profile(id || '');

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!id) throw new Error("ID korisnika nije definisan");
      const userData = await apiClient.get<PublicUserProfile>(`/users/${id}/public`);

      if (!userData) throw new Error("Korisnik ne postoji ili profil nije javan.");

      if (userData.status === 'deleted' || (userData.status === 'pending' && !isAdmin)) {
        return null;
      }
      return userData;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // TTL of 5 minutes
    gcTime: 10 * 60 * 1000, // Clean up unused entries after 10 minutes
  });

  const mutation = useMutation({
    mutationFn: async (action: 'approve' | 'premium' | 'delete') => {
      if (!isAdmin || !id) {
        throw new Error("Akcija dozvoljena samo administratorima.");
      }
      await apiClient.post(`/users/${id}/admin-action`, { action });
      return action;
    },
    onSuccess: (action) => {
      // Direct, clean enterprise cache update mapping the admin action
      queryClient.setQueryData(queryKey, (oldProfile: PublicUserProfile | undefined) => {
        if (!oldProfile) return oldProfile;
        const updates: { status?: string; isPremiumProfile?: boolean } = {};
        if (action === 'approve') updates.status = 'active';
        if (action === 'premium') updates.isPremiumProfile = !oldProfile.isPremiumProfile;
        if (action === 'delete') updates.status = 'deleted';
        return {
          ...oldProfile,
          ...updates
        };
      });
    },
    onError: (error) => {
      console.error("[usePublicProfileNode] Admin action failed", error);
    }
  });

  const handleAdminAction = async (action: 'approve' | 'premium' | 'delete') => {
    try {
      await mutation.mutateAsync(action);
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const profile = query.data || null;
  const companyId = null; // Stays null as per standard system specification
  const loading = query.isLoading; // Use isLoading instead of isPending for visual spinner
  const loadingAds = false;

  const userAds = profile?._aggregatedAds || {
    machines: [],
    accommodations: [],
    caterings: [],
    plots: []
  };

  const isUpdating = mutation.isPending;

  return {
    profile,
    companyId,
    loading,
    loadingAds,
    userAds,
    isUpdating,
    handleAdminAction
  };
}

