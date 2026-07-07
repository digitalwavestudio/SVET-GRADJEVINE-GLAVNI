import { queryClient } from "./queryClient";

/**
 * Invalidira React Query keš vezan za dashboard (employer statistike,
 * applications lista). Poziva se nakon promene statusa prijave kako bi
 * se osvežili prikazi u dashboard-u.
 */
export const clearDashboardCache = async (uid?: string) => {
  await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  if (uid) {
    await queryClient.invalidateQueries({ queryKey: ["user-session", uid] });
  }
};
