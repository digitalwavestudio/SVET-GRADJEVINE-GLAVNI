import React, { useEffect } from "react";
import { motion } from "motion/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { apiClient } from "@/src/lib/apiClient";
import { queryKeys } from "@/src/lib/queryKeysFactory";

interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: any;
  timestamp: string;
}

export function AuditTab() {
  const { ref, inView } = useInView({ threshold: 0 });

  const {
    data,
    isLoading: loading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: fetchLogs,
  } = useInfiniteQuery({
    queryKey: queryKeys.admin.auditLogs,
    queryFn: async ({ pageParam = null }) => {
      let url = "/admin/audit-logs?limit=50";
      if (pageParam) url += `&lastDocId=${pageParam}`;
      const response = await apiClient.get<any>(url);
      return {
        items: response.items as AuditLog[],
        nextPageParam: response.lastVisibleId,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextPageParam,
    initialPageParam: null as string | null,
    staleTime: 5 * 60 * 1000, // 5 minuta
  });

  const logs = data ? data.pages.flatMap((p) => p.items) : [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getActionColor = (action: string) => {
    if (action.includes("APPROVED")) return "text-green-500";
    if (
      action.includes("REJECTED") ||
      action.includes("SUSPENDED") ||
      action.includes("DELETED")
    )
      return "text-red-500";
    if (action.includes("CONFIG")) return "text-amber-500";
    return "text-blue-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">
            AUDIT LOGOVI
          </h3>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            BELEŽENJE SVIH ADMINISTRATORSKIH AKTIVNOSTI
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
        >
          OSVEŽI
        </button>
      </div>

      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                  ADMIN
                </th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                  AKCIJA
                </th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                  CILJ
                </th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                  DETALJI
                </th>
                <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                  VREME
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-20 text-center text-white/20 font-black animate-pulse uppercase"
                  >
                    Učitavanje aktivnosti...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="text-xs font-black text-white uppercase">
                        {log.adminEmail.split("@")[0]}
                      </div>
                      <div className="text-[8px] font-bold text-white/20">
                        {log.adminEmail}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-black text-white uppercase">
                        {log.targetType}
                      </div>
                      <div className="text-[8px] font-bold text-white/20 truncate max-w-[150px]">
                        ID: {log.targetId}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[9px] font-bold text-white/50 max-w-[250px] truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-black text-white">
                        {new Date(log.timestamp).toLocaleDateString("sr-RS")}
                      </div>
                      <div className="text-[8px] font-bold text-white/20">
                        {new Date(log.timestamp).toLocaleTimeString("sr-RS", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-20 text-center text-white/20 font-black uppercase"
                  >
                    Nema zabeleženih logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {hasNextPage && (
            <div
              ref={ref}
              className="flex justify-center p-8 border-t border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce"></div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">
                  Još logova...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
