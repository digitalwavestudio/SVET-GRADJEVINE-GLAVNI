import React from "react";
import { motion } from "motion/react";
import { useAdminStats } from "@/src/modules/admin/hooks/useAdminStats";

const container: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item: any = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};

export function AdminStatsGrid() {
  const { data } = useAdminStats();
  const activeAds = data?.activeAds || 0;
  const premiumPartners = data?.premiumPartners || 0;
  const verifiedCompanies = data?.verifiedCompanies || 0;

  const statCards = [
    {
      label: "UKUPNO AKTIVNIH",
      value: activeAds,
      icon: "campaign",
      color: "blue",
      growth: data?.growthActiveAds || "+0% ove nedelje",
    },
    {
      label: "PREMIUM PARTNERA",
      value: premiumPartners,
      icon: "star",
      color: "secondary",
      growth: data?.growthPremiumPartners || "Stabilno",
    },
    {
      label: "REGISTROVANIH B2B",
      value: verifiedCompanies,
      icon: "group",
      color: "purple",
      growth: data?.growthCompanies || "Spremni",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {statCards.map((stat, idx) => (
        <motion.div
          key={idx}
          variants={item}
          className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 md:p-8 flex flex-col justify-between hover:border-secondary/30 transition-all group"
        >
          <div>
            <div
              className={`w-12 h-12 bg-${stat.color === "secondary" ? "secondary" : stat.color + "-500"}/10 rounded-[10px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-${stat.color === "secondary" ? "secondary" : stat.color + "-500"}/20`}
            >
              <span
                className={`material-symbols-outlined text-${stat.color === "secondary" ? "secondary" : stat.color + "-500"}`}
              >
                {stat.icon}
              </span>
            </div>
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">
              {stat.label}
            </h4>
            <div className="text-4xl font-black text-white tracking-tighter">
              {stat.value}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              {stat.growth}
            </span>
            <span
              className={`material-symbols-outlined text-${stat.color === "secondary" ? "secondary" : stat.color + "-500"} text-sm`}
            >
              {idx === 2 ? "verified" : "trending_up"}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
