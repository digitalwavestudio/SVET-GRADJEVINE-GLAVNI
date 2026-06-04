import { useQuery } from "@tanstack/react-query";
import { statsService } from "../services/statsService";
import { apiClient } from "@/src/lib/apiClient";

export function useCollectionStats(collectionName: string) {
  return useQuery({
    queryKey: ["stats", collectionName],
    queryFn: () => statsService.getCachedStats(collectionName),
    staleTime: 30 * 60 * 1000, // 30 minutes cache for public counters
  });
}

export function useRoleStats(role: string) {
  return useQuery({
    queryKey: ["stats", "role", role],
    queryFn: () => statsService.getRoleStats(role),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export interface AuthorCounts {
  jobs: number;
  machines: number;
  accommodations: number;
  catering: number;
  realestate: number;
}

export function useAuthorCounts(authorId?: string, companyId?: string) {
  return useQuery({
    queryKey: ["authorCounts", authorId, companyId],
    queryFn: async () => {
      if (!authorId)
        return {
          jobs: 0,
          machines: 0,
          accommodations: 0,
          catering: 0,
          realestate: 0,
        } as AuthorCounts;
      const queryParams = new URLSearchParams();
      if (companyId) queryParams.append("companyId", companyId);

      return apiClient.get<AuthorCounts>(
        `/stats/author-counts/${authorId}?${queryParams.toString()}`,
      );
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCount(collectionName: string) {
  return useQuery({
    queryKey: ["count", collectionName],
    queryFn: () => statsService.getCachedCount(collectionName),
    staleTime: 30 * 60 * 1000, // 30 minutes for public stats
  });
}

export function useFilteredCount(
  collectionName: string,
  filters: Array<{ field: string; op: string; value: unknown }>,
) {
  return useQuery({
    queryKey: ["count", collectionName, filters],
    queryFn: () => statsService.getCachedFilteredCount(collectionName, filters),
    staleTime: 5 * 60 * 1000,
  });
}
