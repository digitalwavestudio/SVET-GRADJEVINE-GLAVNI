import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { uploadImage } from "@/src/lib/imageUtils";
import { useAuth } from "@/src/context/AuthContext";
import { useDashboardMetrics } from "@/src/modules/dashboard/hooks/useDashboardStats";
import { Button } from "@/src/components/ui/Button";
import { useDashboardUIStore } from "@/src/modules/dashboard/store/dashboardUIStore";

import { User } from "@/src/modules/core/types/user";
import { generateDailyBriefing, BriefingRoleData } from "@/src/lib/briefingService";
import logoImage from "@/src/assets/images/logo.png";

interface DashboardHeaderProps {
  userName: string;
  isEmployerRole: boolean;
  isStandard: boolean;
  isAccommodationRole: boolean;
  isCateringRole: boolean;
  onShareClick: () => void;
}

export default React.memo(function DashboardHeader({
  userName,
  isEmployerRole,
  isStandard,
  isAccommodationRole,
  isCateringRole,
  onShareClick,
}: DashboardHeaderProps) {
  const { user, updateUser } = useAuth();
  const isSlowConnection = useDashboardUIStore(state => state.isSlowConnection);
  const {
    data: rawData,
    isFetching: isRefreshing,
    refetch,
    error,
  } = useDashboardMetrics();
  const roleData = (rawData as any as {
    walletVerified?: boolean;
    walletBalance?: number;
    pendingApplications?: number;
    totalAds?: number;
    recentApplications?: any[];
    recentAds?: any[];
  }) || {};
  const isOffline = !navigator.onLine;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { greeting, briefing } = React.useMemo(
    () => generateDailyBriefing(user as User, {
      activeMetrics: {
        pendingApplications: roleData.pendingApplications,
        totalAds: roleData.totalAds,
        totalApplications: roleData.recentApplications?.length,
      },
      nicheDetails: rawData as any as BriefingRoleData["nicheDetails"],
      smartMatches: (rawData as { smartMatches?: any[] })?.smartMatches,
    } as BriefingRoleData, new Date().getHours()),
    [user, roleData, rawData],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file, "profiles/avatars", "avatar");

      const updateData: any = {};
      if (user.role === "poslodavac") {
        updateData.businessProfile = {
          ...user.businessProfile,
          logo: url,
        };
      } else {
        updateData.photoURL = url;
      }

      await updateUser(updateData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[140px]">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-6"
      >
        <div className="relative group">
          <input
            aria-label="Unos polja"
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          {user.businessProfile?.logo || user.photoURL ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 md:w-32 md:h-32 rounded-[10px] overflow-hidden relative cursor-pointer bg-white flex items-center justify-center p-2.5 shadow-2xl group/logo"
            >
              <img
                width="800"
                height="600"
                decoding="async"
                src={user.businessProfile?.logo || user.photoURL}
                className="w-full h-full object-contain"
                alt="Logo"
                referrerPolicy="no-referrer"
              />
              
              {/* FB-style transparent overlay u sredini pri prelasku mišem */}
              <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] opacity-0 group-hover/logo:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">PROMENI LOGO</span>
              </div>

              {/* Loader tokom uploada */}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-28 h-28 md:w-32 md:h-32 rounded-[10px] bg-white/[0.02] border-2 border-dashed border-white/10 flex items-center justify-center hover:border-secondary transition-all"
            >
              <span className="material-symbols-outlined text-white/20">
                add_photo_alternate
              </span>
            </button>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              {greeting},{" "}
              {isEmployerRole ? user.company || "KOMANDNI CENTAR" : userName}
            </h1>
            {!isStandard && (
              <Button
                onClick={() => refetch()}
                disabled={isRefreshing}
                variant="ghost"
                className="p-2 bg-white/5 border border-white/10"
              >
                <span
                  className={`material-symbols-outlined text-sm ${isRefreshing ? "animate-spin text-secondary" : "text-white/40"}`}
                >
                  refresh
                </span>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest hidden md:inline">
                  {isRefreshing ? "UČITAVANJE OSVEŽENJA" : "OSVEŽI PODATKE"}
                </span>
              </Button>
            )}
            {isOffline && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-[10px]">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                  OFFLINE RADI SA LOKALNOM KOPIJOM
                </span>
              </div>
            )}
            {isSlowConnection && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-[10px]">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                  ŠTEDLJIVI REŽIM (SLABA VEZA)
                </span>
              </div>
            )}
          </div>
          {error && (
            <div className="text-red-400 font-bold text-xs mb-2">
              {(error as Error).message}
            </div>
          )}
          <div className="text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
            {briefing}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Wallet Balans is enabled for all roles including administrators */}
        {true && (
          <Button
            to="/novcanik"
            variant="ghost"
            className="h-[52px] bg-slate-900 border border-green-500/20 hover:border-green-500/50 px-5 flex items-center justify-center gap-3 relative overflow-hidden group shadow-[0_0_20px_rgba(34,197,94,0.05)] transition-all shrink-0 w-full md:w-auto"
          >
            {roleData.walletVerified && (
              <div className="absolute top-0 right-0 p-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
              </div>
            )}
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-green-400 text-base" style={{ textShadow: "0 0 10px rgba(74,222,128,0.5)" }}>
                {roleData.walletVerified ? "security" : "account_balance_wallet"}
              </span>
            </div>
            <div className="text-left flex flex-col justify-center">
              <div className="text-[9px] font-black text-white/50 uppercase tracking-[0.1em] mb-0.5 flex items-center gap-1 leading-none">
                {roleData.walletVerified ? "Verifikovan" : "Wallet"} Balans
                {roleData.walletVerified && <span className="text-[7px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded-[3px] font-black leading-none ml-1">SECURE</span>}
              </div>
              <div className="text-sm font-black text-white group-hover:text-green-400 transition-colors tracking-tight leading-none flex items-center gap-1.5">
                {((roleData.walletBalance || user?.walletBalance || 0) || (user?.email === "mancoresolution@gmail.com" || user?.email === "sandbox@svetgradjevine.com" || user?.role === "admin" ? 90080 : 0)).toLocaleString("sr-RS")} <span className="text-white/40 text-[10px]">SGK</span>
              </div>
            </div>
          </Button>
        )}

        {!isStandard && (
           isEmployerRole || isAccommodationRole || isCateringRole ? (
             <Button
               to="/postavi-oglas"
               variant="primary"
               className="h-[52px] px-8 text-[11px] font-black tracking-widest flex items-center justify-center shrink-0 w-full md:w-auto"
             >
               NOVI OGLAS
             </Button>
           ) : (
             <Button
               to="/poslovi"
               variant="primary"
               className="h-[52px] px-8 text-[11px] font-black tracking-widest flex items-center justify-center shrink-0 w-full md:w-auto"
             >
               TRAŽI POSAO
             </Button>
           )
        )}
      </div>
    </div>
  );
});
