import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { toast } from "react-hot-toast";

export interface BroadcastCampaign {
  id: string;
  title: string;
  body: string;
  audience: string;
  reach: number;
  opens: string;
  status: string;
  date: string;
}

export function useAdminBroadcast() {
  const queryClient = useQueryClient();
  const queryKey = ["adminBroadcasts"];

  const { data: broadcasts = [], isLoading } = useQuery<BroadcastCampaign[]>({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get<BroadcastCampaign[]>("/admin/broadcasts");
      return res || [];
    },
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (payload: { audience: string; title: string; body: string }) => {
      return apiClient.post("/admin/broadcast", payload);
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || "Broadcast uspešno poslat!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || err.message || "Greška pri slanju broadcasta");
    },
  });

  return {
    broadcasts,
    isLoading,
    sendBroadcastMutation,
  };
}
