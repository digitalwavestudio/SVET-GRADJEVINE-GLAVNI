import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { useAdminFinances } from "@/src/modules/admin/hooks/useAdminFinances";
import { useDebounce } from "@/src/hooks/useDebounce";
import { useAdminStats } from "@/src/modules/admin/hooks/useAdminStats";
import { walletService, PendingDeposit } from "@/src/modules/checkout/services/walletService";
import { apiClient } from "@/src/lib/apiClient";
import { ServerStats, ChartItem } from "@/src/modules/dashboard/services/dashboardService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { AdminTransactionsSkeleton } from "@/src/modules/admin/components/admin/AdminSkeletons";
import { queryKeys } from "@/src/lib/queryKeysFactory";
import DashboardGuard from "@/src/modules/dashboard/components/dashboard/DashboardGuard";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface FinancesTabProps {
  stats: ServerStats;
}

export function FinancesTab({ stats }: FinancesTabProps) {
  const queryClient = useQueryClient();
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);

  const {
    checkouts,
    isCheckoutsLoading,
    hasMore,
    isFetchingNextPage,
    fetchCheckouts,
    confirmPayment,
  } = useAdminFinances(debouncedQuery);

  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasMore && !isFetchingNextPage && !isCheckoutsLoading) {
      fetchCheckouts();
    }
  }, [inView, hasMore, isFetchingNextPage, isCheckoutsLoading, fetchCheckouts]);

  const { data: adminData } = useAdminStats();
  const rawChartData = adminData?.chartData?.registrationData || [];

  const sanitizedChartData = React.useMemo(() => {
    return rawChartData.map((item: ChartItem) => ({
      name: String(item?.name || ""),
      prihodi: typeof item?.prihodi === "number" && !isNaN(item.prihodi) ? item.prihodi : 0,
    }));
  }, [rawChartData]);

  const { data: pendingDeposits = [], isLoading: isDepositsLoading } = useQuery<PendingDeposit[], Error>(
    {
      queryKey: queryKeys.admin.pendingDeposits,
      queryFn: () => walletService.fetchPendingDeposits(),
    },
  );

  const approveDepositMutation = useMutation<
    void,
    Error,
    { id: string; action: "approve" | "reject" },
    { previousDeposits?: PendingDeposit[] }
  >({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "reject";
    }) => walletService.approveDeposit(id, action),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.pendingDeposits });
      const previousDeposits = queryClient.getQueryData<PendingDeposit[]>(queryKeys.admin.pendingDeposits);

      // Deep clone to prevent unintended reference mutation effects
      const cloned = previousDeposits ? JSON.parse(JSON.stringify(previousDeposits)) : [];
      const updated = cloned.filter((dep: PendingDeposit) => dep.id !== id);

      queryClient.setQueryData<PendingDeposit[]>(queryKeys.admin.pendingDeposits, updated);

      return { previousDeposits };
    },
    onError: (err, _variables, context) => {
      if (context?.previousDeposits) {
        queryClient.setQueryData<PendingDeposit[]>(queryKeys.admin.pendingDeposits, context.previousDeposits);
      }
      toast.error(err.message || "Došlo je do greške");
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Uplata odobrena!"
          : "Uplata odbijena!",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingDeposits });
    },
  });

  const handleLoadMore = () => {
    if (!isCheckoutsLoading && hasMore) {
      fetchCheckouts();
    }
  };

  const handleConfirm = async (id: string) => {
    if (
      window.confirm(
        "Da li ste sigurni da želite da potvrdite ovu uplatu i aktivirate oglasni paket?",
      )
    ) {
      confirmPayment.mutate(id);
    }
  };

  const [topupEmail, setTopupEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState<any | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [topupAmount, setTopupAmount] = useState(1000);
  const [topupDesc, setTopupDesc] = useState("Ručna uplata od strane admina");
  const [topupLoading, setTopupLoading] = useState(false);

  const searchUser = async () => {
    if (!topupEmail.trim()) return;
    setSearchError("");
    setSearchedUser(null);
    setSearching(true);
    try {
      const q = topupEmail.trim().toLowerCase();
      const data = await apiClient.get<any>(`/admin/users?searchQ=${encodeURIComponent(q)}&limit=5`);
      const users = data?.users || [];
      const found = users.find((u: any) => u.email?.toLowerCase() === q);
      if (found) {
        setSearchedUser(found);
      } else if (users.length === 1 && users[0].email?.toLowerCase().includes(q)) {
        setSearchedUser(users[0]);
      } else {
        setSearchError("Korisnik nije pronađen. Proverite email.");
      }
    } catch (e: any) {
      setSearchError(e?.response?.data?.error || e.message || "Greška pri pretrazi.");
    } finally {
      setSearching(false);
    }
  };

  const handleTopup = async () => {
    if (!searchedUser || topupAmount <= 0) return;
    if (!window.confirm(`Da li ste sigurni da želite da dodate ${topupAmount} RSD korisniku ${searchedUser.email}?`)) return;
    setTopupLoading(true);
    try {
      await walletService.adminAddFunds(searchedUser.id, topupAmount, topupDesc);
      toast.success(`Uspešno dodato ${topupAmount} RSD korisniku ${searchedUser.email}`);
      setSearchedUser(null);
      setTopupEmail("");
      setTopupAmount(1000);
      setTopupDesc("Ručna uplata od strane admina");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingDeposits });
    } catch (e: any) {
      toast.error(e.message || "Greška pri dodavanju sredstava");
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <motion.div
      key="finances"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#0A0F14] to-[#111820] border border-secondary/20 rounded-[10px] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[100px] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-12">
                <div className="w-16 h-16 bg-secondary/10 border border-secondary/20 rounded-[10px] flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-3xl">
                    account_balance_wallet
                  </span>
                </div>
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-4 py-2 rounded-[10px] border border-green-500/20 mr-4">
                  STABILNO
                </span>
              </div>
              <h3 className="text-[12px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">
                PROJEKTOVANI MESEČNI PRIHOD
              </h3>
              <div className="text-6xl font-black text-white tracking-tighter">
                €{stats.estimatedRevenue?.toLocaleString() || 0}{" "}
                <span className="text-lg text-white/30">.00</span>
              </div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">
                  trending_up
                </span>
                +18% U ODNOSU NA PROŠLI MESEC
              </p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 blur-[120px] pointer-events-none"></div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-10">
              ZARADA (Zadnjih 14 dana)
            </h3>
            <div className="w-full h-48 -ml-4">
              <DashboardGuard variant="inline" title="Greška pri učitavanju grafikona prihoda">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sanitizedChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorPrihodi"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#ffffff",
                        opacity: 0.3,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#ffffff",
                        opacity: 0.3,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A0F14",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                      itemStyle={{
                        color: "#fff",
                        fontWeight: "black",
                        textTransform: "uppercase",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="prihodi"
                      stroke="#22c55e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPrihodi)"
                      name="PRIHODI (€)"
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </DashboardGuard>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Manual Top-up */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">currency_exchange</span>
              MANUALNA UPLATA
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                  Email korisnika
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={topupEmail}
                    onChange={(e) => { setTopupEmail(e.target.value); setSearchedUser(null); }}
                    placeholder="pera@email.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-xs font-bold text-white placeholder-white/20 focus:outline-none focus:border-secondary transition-all"
                  />
                  <button
                    onClick={searchUser}
                    disabled={searching || !topupEmail.trim()}
                    className="bg-secondary text-slate-950 px-4 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-wider hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {searching ? (
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-sm">search</span>
                    )}
                  </button>
                </div>
              </div>

              {searchedUser && (
                <div className="bg-white/[0.03] border border-white/10 rounded-[10px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-sm font-black uppercase">
                        {(searchedUser.firstName?.[0] || '?')}{(searchedUser.lastName?.[0] || '')}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-tight">
                          {searchedUser.firstName || ''} {searchedUser.lastName || ''}
                        </div>
                        <div className="text-[9px] font-bold text-white/40">{searchedUser.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-green-400">
                        {searchedUser.walletBalance?.toLocaleString('sr-RS') || 0} RSD
                      </div>
                      <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">Balans</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                        Iznos (RSD)
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:border-secondary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                      Opis
                    </label>
                    <input
                      type="text"
                      value={topupDesc}
                      onChange={(e) => setTopupDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-secondary transition-all"
                    />
                  </div>

                  <button
                    onClick={handleTopup}
                    disabled={topupLoading || topupAmount <= 0}
                    className="w-full bg-secondary text-slate-950 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-wider hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {topupLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        OBRADA...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">paid</span>
                        DODAJ {topupAmount.toLocaleString('sr-RS')} RSD
                      </>
                    )}
                  </button>
                </div>
              )}

              {searchError && (
                <div className="text-[10px] font-black text-red-500 bg-red-500/10 border border-red-500/20 rounded-[8px] px-4 py-2">
                  {searchError}
                </div>
              )}
            </div>
          </div>

          {/* Pending Wallet Deposits List */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center justify-between">
              ZAHTEVI ZA DOPUNU WALLET-A
              {pendingDeposits.length > 0 && (
                <span className="bg-secondary text-slate-950 text-[10px] px-2 py-1 rounded-full">
                  {pendingDeposits.length} na čekanju
                </span>
              )}
            </h3>
            <div className="space-y-4">
              {pendingDeposits.length > 0 ? (
                pendingDeposits.map((dep: PendingDeposit) => (
                  <div
                    key={dep.id}
                    className="flex flex-col gap-3 p-4 bg-white/[0.02] border border-secondary/20 rounded-[10px] hover:bg-white/[0.04] transition-colors relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-secondary/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-sm">
                            receipt_long
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-black text-white uppercase tracking-tight">
                            Korisnik:{" "}
                            {dep.userName || dep.userId.substring(0, 8)}
                          </div>
                          <div className="text-[9px] font-bold text-white/40">
                            {dep.userEmail}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-green-400">
                          +{dep.amount.toLocaleString("sr-RS")} RSD
                        </div>
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                          {new Date(dep.createdAt).toLocaleDateString("sr-RS")}
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 p-2 rounded flex justify-between items-center mt-2 border border-white/5">
                      <div className="text-[10px] font-mono text-white/50">
                        POZIV NA BROJ:{" "}
                        <span className="text-white font-bold">
                          {dep.referenceNumber}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Da li ste sigurni da želite ODBITI ovu uplatu?",
                              )
                            ) {
                              approveDepositMutation.mutate({
                                id: dep.id,
                                action: "reject",
                              });
                            }
                          }}
                          disabled={approveDepositMutation.isPending}
                          className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-[5px] text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                        >
                          Odbij
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Da li ste evidentirali uplatu na računu i želite da odobrite sredstva?",
                              )
                            ) {
                              approveDepositMutation.mutate({
                                id: dep.id,
                                action: "approve",
                              });
                            }
                          }}
                          disabled={approveDepositMutation.isPending}
                          className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-[5px] text-[9px] font-black uppercase hover:bg-green-500 hover:text-white transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            check
                          </span>{" "}
                          Odobri Uplatu
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : isDepositsLoading ? (
                <AdminTransactionsSkeleton />
              ) : (
                <div className="py-6 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">
                  NEMA ZAHTEVA NA ČEKANJU
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                EVIDENCIJA PLAĆANJA
              </h3>
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-lg">search</span>
                <input 
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  type="text" 
                  placeholder="Pretraži fakture..." 
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-[10px] font-black text-white uppercase tracking-widest placeholder:text-white/20 focus:outline-none focus:border-secondary transition-all" 
                />
              </div>
            </div>
            <div className="space-y-4">
              {checkouts.length > 0 ? (
                <>
                  {checkouts.map((ctx, idx) => (
                    <div
                      key={ctx.id || idx}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-[10px] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div
                          className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${
                            ctx.status === "confirmed"
                              ? "bg-green-500/10 text-green-500"
                              : ctx.status === "failed"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {ctx.status === "confirmed"
                              ? "check"
                              : ctx.status === "failed"
                                ? "close"
                                : "hourglass_empty"}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-black text-white uppercase tracking-tight">
                            {ctx.packageName}
                            {ctx.partnerId && (
                              <span className="ml-2 text-[8px] text-secondary border border-secondary/20 px-1 rounded">
                                PARTNER
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                            {ctx.userId.slice(0, 8)}... | {ctx.paymentMethod}
                          </div>
                        </div>
                      </div>
                      <div className="text-left md:text-right flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t border-white/5 md:border-0 pt-3 md:pt-0">
                        <div>
                          <div className="text-sm font-black text-white">
                            €{ctx.amount.toFixed(2)}
                          </div>
                          <div
                            className={`text-[8px] font-black uppercase tracking-widest ${
                              ctx.status === "confirmed"
                                ? "text-green-500"
                                : ctx.status === "failed"
                                  ? "text-red-500"
                                  : "text-secondary"
                            }`}
                          >
                            {ctx.status}
                          </div>
                        </div>

                        {ctx.status !== "confirmed" && (
                          <button
                            onClick={() => ctx.id && handleConfirm(ctx.id)}
                            disabled={confirmPayment.isPending}
                            className="bg-secondary text-slate-950 text-[9px] font-black px-3 py-2 rounded-[5px] uppercase tracking-tighter hover:bg-yellow-400 transition-all disabled:opacity-50"
                          >
                            {confirmPayment.isPending ? "..." : "Aktiviraj"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <div ref={ref} className="flex justify-center p-8 border-t border-white/5 bg-white/[0.01]">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce"></div>
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Još transakcija...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : isCheckoutsLoading ? (
                <AdminTransactionsSkeleton />
              ) : (
                <div className="py-10 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">
                  NEMA ZABELEŽENIH TRANSAKCIJA
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
