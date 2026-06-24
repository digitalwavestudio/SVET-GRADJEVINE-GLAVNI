import React, { useState } from "react";
import { motion } from "motion/react";
import { useJobs } from "@/src/modules/jobs";
import { buildJobUrl } from "@/src/lib/seo";
import { APP_CONFIG } from "@/src/constants/config";
import { useSystemConfig } from "@/src/hooks/useSystemConfig";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { toast } from "react-hot-toast";
import { queryKeys } from "@/src/lib/queryKeysFactory";

export function MarketingTab() {
  const { data: jobsData } = useJobs({});
  const jobs = jobsData?.pages.flatMap((page) => page.items) || [];
  const queryClient = useQueryClient();

  const { data: systemConfig, isLoading: configLoading } = useSystemConfig();

  const [promoForm, setPromoForm] = useState({
    holidayModeActive: false,
    discountPercentage: 100,
    applicablePackages: "all", // 'all', 'premium', 'urgent'
  });

  // Sync state when config loads
  React.useEffect(() => {
    if (systemConfig) {
      setPromoForm({
        holidayModeActive: systemConfig.holidayModeActive || false,
        discountPercentage: systemConfig.discountPercentage || 0,
        applicablePackages: systemConfig.applicablePackages?.[0] || "all",
      });
    }
  }, [systemConfig]);

  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: any) => apiClient.post("/system/config", newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig });
      toast.success("Praznična akcija je uspešno ažurirana!");
    },
    onError: () => {
      toast.error("Greska pri ažuriranju akcije");
    },
  });

  const handleUpdatePromo = () => {
    updateConfigMutation.mutate({
      holidayModeActive: promoForm.holidayModeActive,
      discountPercentage: Number(promoForm.discountPercentage),
      applicablePackages: [promoForm.applicablePackages],
    });
  };

  const generateSitemap = () => {
    const activeJobs = jobs.filter((j: any) => j.status === "active");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${APP_CONFIG.BASE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${APP_CONFIG.BASE_URL}/poslovi</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    activeJobs.forEach((job: any) => {
      xml += `  <url>
    <loc>${APP_CONFIG.BASE_URL}${buildJobUrl(job)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitemap.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      key="marketing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SEO Sitemap Generator Module */}
        <div className="bg-[#0A0F14] border border-blue-500/20 rounded-[10px] p-10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none"></div>
          <div className="relative z-10 flex-1">
            <h3 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">network_node</span>
              SITEMAP KONTROLA
            </h3>
            <p className="text-sm font-bold text-white/50 mb-8 leading-relaxed">
              Ažurirajte indeksiranje platforme za Google. Generišite sitemap
              XML sa aktivnim oglasima i najnovijim firmama radi bržeg
              rangiranja.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-[10px] border border-white/10">
                <div>
                  <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                    Status Sitemap-e
                  </div>
                  <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    Aktivnih linkova:{" "}
                    {jobs.filter((j: any) => j.status === "active").length + 5}
                  </div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-[10px] text-[9px] font-black tracking-widest uppercase">
                  SPREMAN
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={generateSitemap}
            className="mt-8 w-full bg-blue-500 hover:bg-blue-400 !text-black font-black py-5 rounded-[10px] transition-all text-xs tracking-widest uppercase flex flex-col items-center gap-1 shadow-lg shadow-blue-500/20"
          >
            <span>PREUZMI SITEMAP.XML</span>
            <span className="text-[9px] !text-black/60 font-bold tracking-widest">
              ZA GOOGLE SEARCH CONSOLE
            </span>
          </button>
        </div>

        {/* Promo Code Generator */}
        <div className="bg-[#0A0F14] border border-secondary/20 rounded-[10px] p-10 flex flex-col relative overflow-hidden lg:col-span-2 text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 blur-[80px] pointer-events-none"></div>
          <div className="relative z-10 flex-1">
            <div
              className="flex items-center justify-between mb-8 cursor-pointer"
              onClick={() =>
                setPromoForm((prev) => ({
                  ...prev,
                  holidayModeActive: !prev.holidayModeActive,
                }))
              }
            >
              <h3 className="text-[12px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="material-symbols-outlined">celebration</span>
                GLOBALNA PRAZNIČNA AKCIJA
              </h3>
              <div
                className={`w-12 h-6 rounded-full relative transition-all ${promoForm.holidayModeActive ? "bg-secondary" : "bg-white/10"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-slate-950 transition-all ${promoForm.holidayModeActive ? "right-1" : "left-1"}`}
                />
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-sm font-bold text-white/50 leading-relaxed uppercase tracking-widest text-[9px]">
                Aktiviranjem globalne akcije, korisnici ne moraju da koriste
                promo kodove. Popust se direktno primenjuje na njihovu prijavu
                oglasa i jasno komunicira u interfejsu.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">
                    Popust (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={promoForm.discountPercentage}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        discountPercentage: Number(e.target.value),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-4 px-5 text-sm font-black focus:border-secondary focus:outline-none transition-all text-white disabled:opacity-50"
                    disabled={!promoForm.holidayModeActive}
                  />
                  <p className="text-[8px] text-white/30 uppercase tracking-widest mt-1">
                    100% = Potpuno besplatno
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">
                    Važi za Pakete
                  </label>
                  <select
                    value={promoForm.applicablePackages}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        applicablePackages: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] py-4 px-5 text-xs font-black uppercase tracking-widest focus:border-secondary focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 text-white"
                    disabled={!promoForm.holidayModeActive}
                  >
                    <option value="all" className="bg-slate-900">
                      Sve Pakete
                    </option>
                    <option value="premium" className="bg-slate-900">
                      Samo Premium
                    </option>
                    <option value="urgent" className="bg-slate-900">
                      Samo Hitno
                    </option>
                    <option value="premium_partner" className="bg-slate-900">
                      Premium Partner
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleUpdatePromo}
            disabled={updateConfigMutation.isPending || configLoading}
            className="w-full mt-8 bg-secondary !text-black font-black py-5 rounded-[10px] text-[10px] tracking-widest uppercase hover:bg-yellow-400 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(254,191,13,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {updateConfigMutation.isPending
              ? "ČUVANJE..."
              : "SAČUVAJ KONFIGURACIJU"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
