import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";

import { DashboardLayout } from "@/src/modules/core";
import { useAuth } from "@/src/context/AuthContext";
import { useDocumentHead } from "@/src/hooks/useDocumentHead";
import { useDashboardStats } from "@/src/modules/dashboard/hooks/useDashboardStats";
import { useDashboardUIStore } from "@/src/modules/dashboard/store/dashboardUIStore";

import { SandboxBanner } from "@/src/modules/dashboard/components/dashboard/SandboxBanner";
import { SyncIndicator } from "@/src/modules/dashboard/components/dashboard/SyncIndicator";
import { HeaderSkeleton } from "@/src/modules/dashboard/components/dashboard/DashboardSkeletons";
import AnalyticsSkeleton from "@/src/modules/dashboard/components/dashboard/AnalyticsSkeleton";
import DashboardSkeleton from "@/src/modules/dashboard/components/dashboard/DashboardSkeleton";
import DashboardGuard from "@/src/modules/dashboard/components/dashboard/DashboardGuard";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";

const DashboardHeader = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/DashboardHeader")
);
const DashboardModals = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/DashboardModals")
);
const PartnerHubUI = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/PartnerHubUI")
);
const StandardDashboardUI = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/StandardDashboardUI")
);
const MasterDashboardUI = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/MasterDashboardUI")
);
const EmployerDashboardUI = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/EmployerDashboardUI")
);
const AnalyticsDashboardUI = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/AnalyticsDashboardUI")
);
const StandardTrendChart = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/StandardTrendChart")
);

function DashboardContent() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [welcomeOpen, setWelcomeOpen] = useState(() => {
    if (location.state?.welcome === true && user?.id) {
      const hasSeen = localStorage.getItem(`hasSeenWelcome_${user.id}`);
      return !hasSeen;
    }
    return false;
  });

  const isUpgradeOpen = useDashboardUIStore((state) => state.isUpgradeOpen);
  const setIsUpgradeOpen = useDashboardUIStore((state) => state.setIsUpgradeOpen);
  const isShareOpen = useDashboardUIStore((state) => state.isShareOpen);
  const setIsShareOpen = useDashboardUIStore((state) => state.setIsShareOpen);
  const isCreditOpen = useDashboardUIStore((state) => state.isCreditOpen);
  const setIsCreditOpen = useDashboardUIStore((state) => state.setIsCreditOpen);

  const { data: dashboardData, isLoading, isFetching } = useDashboardStats();

  const trendData = dashboardData?.trends || [];
  const trendLoading = isLoading;

  useEffect(() => {
    if (!user) navigate("/prijava");
  }, [user, navigate]);

  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: "slobodan" | "zauzet") => {
      // updateUser already performs an optimistic local state update immediately,
      // so we fire it and return the promise so mutation finishes in background
      return updateUser({ availability: newStatus }).then(() => newStatus);
    },
    onSuccess: () => {
      // Silent invalidate BFF without showing loaders
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.bff(user?.role || 'user', user?.id || ''),
        refetchType: 'none', // Prevents active queries from spinning loaders if they shouldn't
      });
      // Optionally we can do a background refetch
      queryClient.fetchQuery({
        queryKey: dashboardKeys.bff(user?.role || 'user', user?.id || ''),
      });
    },
    onError: (err) => {
      console.error("[toggleMasterStatus] Failed to update master status:", err);
    },
  });

  const toggleMasterStatus = () => {
    if (!user) return;
    const currentStatus = user.availability || "slobodan";
    const newStatus = currentStatus === "slobodan" ? "zauzet" : "slobodan";
    // Fire and forget (Zero-Latency UI Toggle)
    toggleStatusMutation.mutate(newStatus);
  };

  const roles = useMemo(
    () => ({
      isSystemAdmin: user?.role === "admin" || (user as { isAdmin?: boolean })?.isAdmin,
      isEmployerRole: user?.role === "poslodavac",
      isMasterRole: user?.role === "majstor",
      isStandard: user?.role === "standard",
      isPartnerRole: user?.role === "partner",
    }),
    [user?.role, (user as { isAdmin?: boolean })?.isAdmin]
  );

  const rawFullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
  const userName = user?.name || (rawFullName.length > 0 ? rawFullName : "Korisnik");

  useDocumentHead({
    title: "Kontrolna Tabla | Svet Građevine",
    description: "Upravljajte Vašim poslovima, pregledajte prijavljene kandidate, analitiku oglasa i status Vašeg biznisa na 'Svet Građevine'.",
    noindex: true,
  });

  if (!user) return null;

  return (
    <DashboardLayout>
      <DashboardModals
        isUpgradeOpen={isUpgradeOpen}
        setIsUpgradeOpen={setIsUpgradeOpen}
        isShareOpen={isShareOpen}
        setIsShareOpen={setIsShareOpen}
        isCreditOpen={isCreditOpen}
        setIsCreditOpen={setIsCreditOpen}
      />

      {/* Welcome Modal */}
      {welcomeOpen && (
        <div className="fixed inset-0 bg-[#0B1219]/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 transition-all duration-500">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] w-full max-w-md p-10 relative shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Apple-like ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="text-center relative z-10">
              <div className="w-24 h-24 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-inner overflow-hidden">
                <img src="/logo-icon.png" alt="Svet Građevine Logo" className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 font-headline leading-tight">
                Dobrodošli na <br/><span className="text-secondary">Svet Građevine!</span>
              </h2>
              <p className="text-on-surface-variant text-sm font-bold mb-8">
                Poklonili smo vam <span className="text-white bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest text-[10px] ml-1">1.500 SG kredita</span> za objavu oglasa.
              </p>
              {!user?.emailVerified && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[16px] p-5 mb-8 text-left backdrop-blur-md">
                  <p className="text-amber-500 text-xs font-bold flex items-start gap-3">
                    <span className="material-symbols-outlined text-lg mt-0.5">warning</span>
                    <span className="leading-relaxed">Poslali smo vam email sa linkom za potvrdu. Proverite inbox (i spam folder) i kliknite na link da biste mogli da postavljate oglase.</span>
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setWelcomeOpen(false);
                    localStorage.setItem(`hasSeenWelcome_${user?.id}`, "true");
                  }}
                  className="w-full bg-gradient-to-r from-secondary via-yellow-400 to-secondary text-black font-black py-4 rounded-[16px] uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(254,191,13,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all duration-300"
                >
                  Razumem, kreni
                </button>
                <Link
                  to="/novcanik"
                  onClick={() => {
                    setWelcomeOpen(false);
                    localStorage.setItem(`hasSeenWelcome_${user?.id}`, "true");
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-[16px] uppercase tracking-widest text-xs hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-center flex items-center justify-center"
                >
                  Pogledaj novčanik
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <SandboxBanner isSandbox={!!(dashboardData as { _sandbox?: boolean })?._sandbox} />

        <DashboardGuard variant="inline" title="Greška u zaglavlju">
          <Suspense fallback={<HeaderSkeleton />}>
            <DashboardHeader
              userName={userName}
              isEmployerRole={roles.isEmployerRole}
              isStandard={roles.isStandard}
              onShareClick={() => setIsShareOpen(true)}
            />
          </Suspense>
        </DashboardGuard>

        <div className={`space-y-12 mt-8 transition-opacity duration-300 relative min-h-[800px]`}>
          <>
            {roles.isStandard && (
              <DashboardGuard variant="inline" title="Greška u podacima korisnika">
                <Suspense fallback={<DashboardSkeleton />}>
                  <StandardDashboardUI />
                </Suspense>
              </DashboardGuard>
            )}


            {roles.isEmployerRole && (
              <>
                <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }}} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 md:p-16 relative overflow-hidden group mb-8">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 blur-3xl -mr-32 -mt-32"></div>
                  <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-7xl font-black text-white uppercase mb-6 leading-none tracking-tighter"><span className="text-secondary">KOMANDNI CENTAR</span></h2>
                    <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-widest mb-4 leading-relaxed">
                      VAŠ DETALJNI PREGLED OGLASA, PRIJAVLJENIH KANDIDATA I STATISTIKE POSLOVANJA NA PLATFORMI.
                    </p>
                  </div>
                </motion.div>

                <DashboardGuard variant="inline" title="Greška u profilu poslodavca">
                  <Suspense fallback={<DashboardSkeleton />}>
                    <EmployerDashboardUI />
                  </Suspense>
                </DashboardGuard>
                {!roles.isStandard && (
                  <DashboardGuard variant="inline" title="Greška u analitici">
                    <Suspense fallback={<AnalyticsSkeleton />}>
                      <AnalyticsDashboardUI userId={user.id} />
                    </Suspense>
                  </DashboardGuard>
                )}
              </>
            )}

            {roles.isPartnerRole && (
              <DashboardGuard variant="inline" title="Greška u partnerskom portalu">
                <Suspense fallback={<DashboardSkeleton />}>
                  <PartnerHubUI user={user} />
                </Suspense>
              </DashboardGuard>
            )}
          </>

          {/* Analytics Section */}
          <div className="space-y-8">
            {!roles.isStandard && !roles.isEmployerRole ? (
              <DashboardGuard variant="inline" title="Greška u analitici">
                <Suspense fallback={<AnalyticsSkeleton />}>
                  <AnalyticsDashboardUI userId={user.id} />
                </Suspense>
              </DashboardGuard>
            ) : null}
          </div>

          <SyncIndicator isFetching={isFetching} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <DashboardGuard variant="full">
      <DashboardContent />
    </DashboardGuard>
  );
}
