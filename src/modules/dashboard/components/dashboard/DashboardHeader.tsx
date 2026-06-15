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
  const [imgError, setImgError] = useState(false);

  const logoSrc = user?.businessProfile?.logo || user?.photoURL;
  const isShield = logoSrc === 'shield' || logoSrc === 'stit' || imgError;

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
      setImgError(false); // Reset error state on new upload
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
          {logoSrc && !isShield ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 md:w-32 md:h-32 rounded-[10px] overflow-hidden relative cursor-pointer bg-white flex items-center justify-center p-2.5 shadow-2xl group/logo"
            >
              <img
                width="800"
                height="600"
                decoding="async"
                src={logoSrc}
                className="w-full h-full object-contain"
                alt="Logo"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
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
          ) : isShield ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 md:w-32 md:h-32 rounded-[10px] overflow-hidden relative cursor-pointer bg-[#0A0F14] border border-white/10 flex items-center justify-center shadow-2xl group/logo"
            >
              <span className="material-symbols-outlined text-slate-400 text-5xl group-hover/logo:scale-110 transition-transform">shield</span>
              
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
            <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
              {greeting}, <span className="text-secondary">{userName || user.email}</span>
            </h1>
            {isOffline && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-[10px]">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                  OFFLINE RADI SA LOKALNOM KOPIJOM
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

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
        {/* Wallet Balans is enabled for all roles including administrators */}
        {true && (
          <Button
            to="/novcanik"
            variant="ghost"
            className="h-[120px] w-full md:w-[320px] bg-gradient-to-br from-green-950/20 via-slate-900/95 to-black border border-green-400/30 hover:border-green-400 px-12 flex items-center justify-center gap-6 relative overflow-hidden group shadow-[0_0_40px_rgba(34,197,94,0.15)] hover:shadow-[0_0_50px_rgba(34,197,94,0.25)] transition-all shrink-0 rounded-[14px] transform hover:-translate-y-0.5"
          >
            {roleData.walletVerified && (
              <div className="absolute top-0 right-0 p-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_15px_rgba(74,222,128,0.9)]"></div>
              </div>
            )}
            <div className="w-16 h-16 rounded-[14px] bg-gradient-to-br from-green-500/25 to-green-500/5 border border-green-400/40 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-[0_0_20px_rgba(74,222,128,0.25)]">
              <span className="material-symbols-outlined text-green-400 text-3xl font-light" style={{ textShadow: "0 0 15px rgba(74,222,128,0.6)" }}>
                {roleData.walletVerified ? "security" : "account_balance_wallet"}
              </span>
            </div>
            <div className="text-left flex flex-col justify-center">
              <div className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-1 leading-none">
                {roleData.walletVerified ? "Verifikovan" : "Novčanik"}
                {roleData.walletVerified && <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-[3px] font-black leading-none ml-1">SECURE</span>}
              </div>
              <div className="text-3xl font-black text-green-400 group-hover:text-green-300 transition-colors tracking-tight leading-none flex items-center gap-2">
                {(roleData.walletBalance ?? user?.walletBalance ?? 0).toLocaleString("sr-RS")} <span className="text-white/40 text-sm font-bold">Kredita</span>
              </div>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
});
