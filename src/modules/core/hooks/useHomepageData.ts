import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

async function enrichLogo(jobs: any[]): Promise<any[]> {
  if (!jobs?.length) return jobs;
  const missingLogo = jobs.filter((j: any) => !j.logo);
  if (!missingLogo.length) return jobs;

  try {
      const searchRes = await apiClient.post<any>("/jobs/search", {
      pageSize: 5,
      filters: { status: "active" },
    });
    const searchJobs: any[] = searchRes?.docs || [];
    if (!searchJobs.length) return jobs;

    const logoMap = new Map<string, string>();
    searchJobs.forEach((sj: any) => {
      if (sj.logo && sj.id) logoMap.set(sj.id, sj.logo);
    });

    return jobs.map((j: any) => {
      if (!j.logo && logoMap.has(j.id)) {
        return { ...j, logo: logoMap.get(j.id) };
      }
      return j;
    });
  } catch {
    return jobs;
  }
}

export function useHomepageData() {
  return useQuery({
    queryKey: ["global", "homepage_data_v3"],
    queryFn: async ({ signal }) => {
      const data = await apiClient.get<any>("/bff/homepage", { signal });
      if (!data) return {};
      if (data?.latestJobs?.length) {
        data.latestJobs = await enrichLogo(data.latestJobs);
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });
}
