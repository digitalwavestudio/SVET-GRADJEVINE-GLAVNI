import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

async function enrichLogo(jobs: any[]): Promise<any[]> {
  if (!jobs?.length) return jobs;
  const missingLogo = jobs.filter((j: any) => !j.logo && j.authorId);
  if (!missingLogo.length) return jobs;

  const authorIds = [...new Set(missingLogo.map((j: any) => j.authorId))];
  try {
    const profiles = await Promise.all(
      authorIds.map((uid: string) =>
        apiClient.get<any>(`/users/${uid}/public`).catch(() => null)
      )
    );
    const logoMap = new Map<string, string>();
    profiles.forEach((p: any) => {
      if (p?.businessProfile?.logo && p?.uid) {
        logoMap.set(p.uid, p.businessProfile.logo);
      } else if (p?.id && p?.businessProfile?.logo) {
        logoMap.set(p.id, p.businessProfile.logo);
      }
    });
    if (!logoMap.size) return jobs;

    return jobs.map((j: any) => {
      if (!j.logo && logoMap.has(j.authorId)) {
        return { ...j, logo: logoMap.get(j.authorId) };
      }
      return j;
    });
  } catch {
    return jobs;
  }
}

export function useHomepageData() {
  return useQuery({
    queryKey: ["global", "homepage_data_v4"],
    queryFn: async ({ signal }) => {
      const data = await apiClient.get<any>("/bff/homepage", { signal });
      if (!data) return {};
      if (data?.latestJobs?.length) {
        data.latestJobs = await enrichLogo(data.latestJobs);
      }
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
  });
}
