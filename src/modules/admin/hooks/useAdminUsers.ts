import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";
import { toast } from "react-hot-toast";

export function useAdminUsers(searchQ: string = "") {
  const LIMIT = 20;
  const queryClient = useQueryClient();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: dashboardKeys.adminUsers(searchQ),
      queryFn: async ({ pageParam = null, signal }) => {
        let url = `/admin/users?limit=${LIMIT}`;
        if (searchQ) url += `&searchQ=${encodeURIComponent(searchQ)}`;
        if (pageParam) url += `&lastDocId=${pageParam}`;

        const fetchedData = await apiClient.get<any>(url, { signal });
        const usersList = fetchedData?.users || [];

        return {
          users: usersList,
          nextPageParam: fetchedData?.hasMore ? fetchedData.lastVisibleId : null,
        };
      },
      getNextPageParam: (lastPage) => lastPage?.nextPageParam,
      initialPageParam: null as string | null,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    });

  const allUsers = data ? data.pages.flatMap((page) => page.users) : [];

  const toggleUserSuspensionMutation = useMutation({
    mutationFn: async ({ userId, newStatus, reason }: { userId: string; newStatus: 'suspended' | 'active'; reason: string }) => {
      return apiClient.post(`/admin/users/${userId}/suspend`, { status: newStatus, reason });
    },
    onMutate: async ({ userId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.adminUsers(searchQ) });
      const previousUsers = queryClient.getQueryData(dashboardKeys.adminUsers(searchQ));

      queryClient.setQueryData(
        dashboardKeys.adminUsers(searchQ),
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              users: page.users.map((u: any) =>
                u.id === userId ? { ...u, status: newStatus } : u
              ),
            })),
          };
        }
      );

      return { previousUsers };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(dashboardKeys.adminUsers(searchQ), context.previousUsers);
      }
      toast.error(err?.response?.data?.error || err.message || "Greška pri operaciji");
    },
    onSuccess: () => {
      toast.success("Status korisnika uspešno promenjen!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminUsers(searchQ) });
    }
  });

  const updateLocalUserVerification = (
    targetUserId: string,
    isVerified: boolean,
  ) => {
    queryClient.setQueryData(
      dashboardKeys.adminUsers(searchQ),
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            users: page.users.map((u: any) =>
              u.id === targetUserId ? { ...u, isVerified } : u,
            ),
          })),
        };
      },
    );
  };

  return {
    allUsers,
    isLoading,
    hasMore: hasNextPage,
    isFetchingNextPage,
    fetchUsers: fetchNextPage,
    updateLocalUserVerification,
    toggleUserSuspensionMutation,
  };
}
