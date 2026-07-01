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
const AccommodationDashboardUI = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/AccommodationDashboardUI")
);
const NicheDashboardUI = lazy(
  () => import("@/src/modules/dashboard/components/dashboard/NicheDashboardUI")
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
  const [welcomeOpen, setWelcomeOpen] = useState(location.state?.welcome === true);

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
      isAccommodationRole: user?.role === "smestaj",
      isCateringRole: user?.role === "ketering",
      isMasineRole: user?.role === "masine",
      isPlaceviRole: user?.role === "placevi",
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/20 rounded-[16px] w-full max-w-md p-8 relative shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Dobrodošli na Svet Građevine!</h2>
              <p className="text-on-surface-variant text-sm font-medium mb-6">
                Imate <span className="text-primary font-bold text-base">1.500 SG kredita</span> za objavu oglasa.
              </p>
              {!user?.emailVerified && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-4 mb-6 text-left">
                  <p className="text-amber-500 text-xs font-bold flex items-start gap-2">
                    <span className="material-symbols-outlined text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <span>Poslali smo vam email sa linkom za potvrdu. Proverite inbox (i spam folder) i kliknite na link da biste mogli da postavljate oglase.</span>
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setWelcomeOpen(false)}
                  className="flex-1 bg-primary text-black font-black py-4 rounded-[10px] uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                  Razumem, kreni
                </button>
                <Link
                  to="/novcanik"
                  onClick={() => setWelcomeOpen(false)}
                  className="flex-1 bg-outline-variant/20 text-white font-black py-4 rounded-[10px] uppercase tracking-widest text-sm hover:brightness-110 transition-all text-center leading-[1.2] flex items-center justify-center"
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
              isAccommodationRole={roles.isAccommodationRole}
              isCateringRole={roles.isCateringRole}
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

            {roles.isMasterRole && (
              <DashboardGuard variant="inline" title="Greška u profilu majstora">
                <Suspense fallback={<DashboardSkeleton />}>
                  <MasterDashboardUI
                    masterStatus={user.availability || "slobodan"}
                    toggleMasterStatus={toggleMasterStatus}
                    user={user}
                  />
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

            {roles.isAccommodationRole && (
              <DashboardGuard variant="inline" title="Greška u profilu smeštaja">
                <Suspense fallback={<DashboardSkeleton />}>
                  <AccommodationDashboardUI
                    setIsUpgradeOpen={setIsUpgradeOpen}
                  />
                </Suspense>
              </DashboardGuard>
            )}

            {(roles.isCateringRole || roles.isMasineRole || roles.isPlaceviRole) && (
              <DashboardGuard variant="inline" title="Greška u specijalizovanom profilu">
                <Suspense fallback={<DashboardSkeleton />}>
                  <NicheDashboardUI
                    setIsUpgradeOpen={setIsUpgradeOpen}
                    dashboardBff={dashboardData}
                  />
                </Suspense>
              </DashboardGuard>
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
