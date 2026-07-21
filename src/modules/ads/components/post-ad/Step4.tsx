import { useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useFormContext } from "react-hook-form";
import { UI_TOKENS } from "@/src/lib/uiTokens";
import {
  ACCOMMODATION_AMENITIES,
  BENEFITS,
} from "@/src/constants/taxonomy";
import { getPackagesByCategory } from "@/src/constants/adPackages";
import { useAuth } from "@/src/context/AuthContext";
import { useSystemConfig } from "@/src/hooks/useSystemConfig";
import { useGlobalSettings } from "@/src/modules/admin/hooks/useGlobalSettings";

export function Step4({
  selectedCategory,
  prevStep,
  autoTitle,
  launchMode,
  isUploadingImages,
  isSubmitting,
  cooldown,
  setStep,
}: {
  selectedCategory: string | null;
  prevStep?: () => void;
  autoTitle: string;
  launchMode: boolean;
  isUploadingImages: boolean;
  isSubmitting: boolean;
  cooldown: number;
  setStep: (num: number) => void;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const formData = watch();
  const { user } = useAuth();
  const { data: systemConfig } = useSystemConfig();
  const { data: globalSettings } = useGlobalSettings();
  const walletBalance = user?.walletBalance || user?.partnerBalance || 0;

  // Set default payment method if not set
  useEffect(() => {
    if (!formData.paymentMethod) {
      setValue("paymentMethod", "wallet");
    }
  }, [formData.paymentMethod, setValue]);

  const currentPaymentMethod = formData.paymentMethod || "wallet";

  const packages = useMemo(() => {
    const rawPackages = getPackagesByCategory(selectedCategory || "job");

    // Override package prices dynamically with custom prices from globalSettings
    const updatedPackages = rawPackages.map((pkg) => {
      if (!globalSettings?.pricing) return pkg;

      let catKey = selectedCategory || 'jobs';
      if (catKey === 'job') catKey = 'jobs';
      if (catKey === 'accommodation') catKey = 'accommodations';
      if (catKey === 'catering') catKey = 'caterings';
      if (catKey === 'real-estate' || catKey === 'plot') catKey = 'plots';

      const pricingCategory = globalSettings.pricing[catKey as keyof typeof globalSettings.pricing];
      if (pricingCategory && typeof pricingCategory === 'object') {
        const customPrice = (pricingCategory as any)[pkg.id];
        if (customPrice !== undefined) {
          return {
            ...pkg,
            priceNum: customPrice,
            price: customPrice === 0 ? "BESPLATNO" : `${customPrice.toLocaleString("sr-RS")} SG Kredita`
          };
        }
      }
      return pkg;
    });

    if (systemConfig?.holidayModeActive) {
      return updatedPackages.map((pkg) => {
        const applicable = systemConfig.applicablePackages || [];
        if (
          pkg.id !== "free" &&
          (applicable.includes("all") || applicable.includes(pkg.id))
        ) {
          const discountAmount = Math.floor(
            pkg.priceNum * ((systemConfig.discountPercentage || 0) / 100),
          );
          const newPriceNum = Math.max(0, pkg.priceNum - discountAmount);

          return {
            ...pkg,
            oldPrice: `${pkg.priceNum.toLocaleString("sr-RS")} SG Kredita`,
            priceNum: newPriceNum,
            price:
              newPriceNum === 0
                ? "BESPLATNO - Praznična Akcija!"
                : `${newPriceNum.toLocaleString("sr-RS")} SG Kredita`,
            isDiscounted: true,
          };
        }
        return pkg;
      });
    }
    return updatedPackages;
  }, [selectedCategory, systemConfig, globalSettings]);

  const selectedPkg = useMemo(() => {
    return packages.find((p) => p.id === formData.paket);
  }, [packages, formData.paket]);

  const currentPackagePrice = selectedPkg?.priceNum || 0;
  const isInsufficientFunds =
    !!formData.paket &&
    currentPackagePrice > 0 &&
    walletBalance < currentPackagePrice;

  // Safe fallback display function for job salaries / prices
  const getFormattedPrice = () => {
    if (selectedCategory === "accommodation") {
      return `${formData.price || 0} EUR ${formData.priceType === "perPerson" ? "/ osobi" : "/ objekat"}`;
    }
    if (selectedCategory === "catering") {
      return `od ${formData.catPricePerMeal || 0} EUR`;
    }
    if (selectedCategory === "machines") {
      return formData.machAdType === "prodaja"
        ? `${formData.machPrice || 0} EUR`
        : `${formData.machPricePerDay || 0} EUR / dan`;
    }
    
    // For job categories
    if (formData.isNegotiable) {
      return "Po dogovoru / Pozvati";
    }
    if (formData.plataMin || formData.plataMax) {
      const min = formData.plataMin ? Number(formData.plataMin).toLocaleString("sr-RS") : "0";
      const max = formData.plataMax ? Number(formData.plataMax).toLocaleString("sr-RS") : "0";
      const dynSlug = formData.dinamikaIsplate || "";
      const typeLabel = dynSlug === "satnica" ? "sat" : dynSlug === "po-satu" ? "sat" : dynSlug === "mesecna" ? "mesec" : dynSlug === "dnevna" ? "dan" : dynSlug === "nedeljna" ? "nedelja" : dynSlug === "po-m2" ? "m2" : "";
      
      if (formData.plataMin && formData.plataMax) {
        return `${min} - ${max} EUR${typeLabel ? ` / ${typeLabel}` : ''}`;
      } else if (formData.plataMin) {
        return `${min} EUR${typeLabel ? ` / ${typeLabel}` : ''}`;
      } else {
        return `do ${max} EUR${typeLabel ? ` / ${typeLabel}` : ''}`;
      }
    }

    return "Detalji u opisu";
  };

  // Find standard, premium, and urgent packages specifically
  const standardPkg = packages.find(p => p.id === "standard");
  const premiumPkg = packages.find(p => p.id === "premium" || p.id === "premium_partner");
  const urgentPkg = packages.find(p => p.id === "urgent");

  const isStandardSelected = formData.paket === "standard";
  const isPremiumSelected = premiumPkg ? formData.paket === premiumPkg.id : false;
  const isUrgentSelected = formData.paket === "urgent";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full mx-auto"
      >
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 mb-12">
          <div className="flex items-center justify-center md:justify-start gap-4 text-center md:text-left w-full md:w-auto">
            <div className="hidden md:flex w-12 h-12 bg-secondary/10 rounded-[10px] items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">
                {selectedCategory === "company" ? "public" : "verified"}
              </span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline">
              {selectedCategory === "company" ? (
                <>Oblast i Paket</>
              ) : (
                <>
                  <span className="md:hidden">Pregled<br/>i Naplata</span>
                  <span className="hidden md:inline">Pregled i Naplata</span>
                </>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={prevStep}
            className="hidden md:flex bg-gradient-to-r from-secondary via-yellow-400 to-secondary text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(254,191,13,0.3)] hover:scale-[1.02] items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
            Vrati se na izmene
          </button>
        </div>

        {/* Company coverage section */}
        {selectedCategory === "company" && (
           <div className="mb-12 space-y-6 bg-slate-900/30 backdrop-blur-xl p-8 rounded-[24px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-4">
                Područje rada firme
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: "local", name: "Lokalno" },
                { id: "regional", name: "Regionalno" },
                { id: "national", name: "Cela Srbija" },
                { id: "international", name: "Inostranstvo" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setValue("companyCoverage", opt.id)}
                  className={`w-full p-4 rounded-[12px] border-2 text-left transition-all flex items-center justify-between ${formData.companyCoverage === opt.id ? "border-secondary bg-secondary/10" : "border-white/5 bg-white/5 hover:border-white/20"}`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider ${formData.companyCoverage === opt.id ? "text-secondary" : "text-white"}`}>
                    {opt.name}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.companyCoverage === opt.id ? "border-secondary" : "border-white/20"}`}>
                    {formData.companyCoverage === opt.id && <div className="w-2.5 h-2.5 bg-secondary rounded-full"></div>}
                  </div>
                </button>
              ))}
              </div>

              <div className="space-y-4 mt-6">
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
                  Detalji lokacije (Grad, Opština, Država)
                </label>
                <textarea
                  {...register("companyCoverageValue")}
                  placeholder={
                    formData.companyCoverage === "local"
                      ? "Npr. Zemun, Novi Beograd..."
                      : "Npr. Vojvodina, Moravički okrug ili specifične zemlje..."
                  }
                  rows={3}
                  className="w-full bg-slate-950/40 border-2 border-white/5 rounded-[12px] px-6 py-4 text-white focus:border-secondary/50 outline-none transition-all font-bold resize-none"
                />
              </div>
           </div>
        )}

        {/* Regular Ad Preview Section */}
        {selectedCategory !== "company" && (
           <div className="mb-12 bg-slate-950/40 backdrop-blur-3xl p-8 md:p-10 rounded-[32px] border border-white/10 relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
             <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
             
             <div className="relative z-10">
               <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                 <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
                   <span className="material-symbols-outlined text-[16px]">visibility</span>
                   Izgled vašeg oglasa
                 </span>
                 <button
                   type="button"
                   onClick={() => setStep(1)}
                   className="text-secondary text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                 >
                   Izmeni detalje <span className="material-symbols-outlined text-[12px]">edit</span>
                 </button>
               </div>

               <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex-1 space-y-2">
                    {formData.companyName && (
                      <div className="inline-flex items-center gap-2 mb-2 bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_2px_10px_rgba(254,191,13,0.1)]">
                        <span className="material-symbols-outlined text-[14px]">apartment</span>
                        {formData.companyName}
                      </div>
                    )}
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] block mt-2">
                      Naslov oglasa
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight font-headline leading-tight">
                      {autoTitle}
                    </h3>
                    
                    {formData.opis && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest font-headline block mb-2">
                          Detaljan opis posla
                        </span>
                        <p className="text-base font-medium text-white/90 leading-relaxed whitespace-pre-wrap">
                          {formData.opis}
                        </p>
                      </div>
                    )}
                    {(formData.phone || formData.viber || formData.whatsapp) && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block">
                          Kontakt podaci
                        </span>
                        <div className="flex flex-wrap gap-5 text-base font-black">
                          {formData.phone && (
                            <div className="flex items-center gap-2 text-white">
                              <span className="material-symbols-outlined text-xl text-secondary">phone</span>
                              {formData.phone}
                            </div>
                          )}
                          {formData.viber && (
                            <div className="flex items-center gap-2 text-[#7360f2]">
                              <span className="material-symbols-outlined text-xl">call</span>
                              Viber
                            </div>
                          )}
                          {formData.whatsapp && (
                            <div className="flex items-center gap-2 text-[#25D366]">
                              <span className="material-symbols-outlined text-xl">chat</span>
                              WhatsApp
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                 
                 <div className="flex flex-col md:items-end gap-6 min-w-[200px]">
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block md:text-right mb-1">
                        {selectedCategory === "accommodation"
                          ? "Cena"
                          : selectedCategory === "catering"
                            ? "Cena po obroku"
                            : selectedCategory === "machines"
                              ? "Tip oglasa"
                              : "Satnica"}
                      </span>
                      <span className="font-black text-2xl md:text-3xl md:text-right block bg-clip-text text-transparent bg-gradient-to-r from-secondary via-yellow-400 to-secondary">
                        {getFormattedPrice()}
                      </span>
                    </div>

                    {selectedCategory === "accommodation" ? (
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block md:text-right mb-1">Kapacitet</span>
                      <span className="font-bold text-white uppercase text-xs tracking-widest block md:text-right">
                        {formData.totalBeds} ležajeva ({formData.availableBeds || formData.totalBeds} slobodno)
                      </span>
                    </div>
                    ) : selectedCategory === "catering" ? (
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block md:text-right mb-1">Min. porudžbina</span>
                      <span className="font-bold text-white uppercase text-xs tracking-widest block md:text-right">{formData.catMinOrder} obroka</span>
                    </div>
                    ) : selectedCategory === "machines" ? (
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block md:text-right mb-1">Cena</span>
                      <span className="font-bold text-white uppercase text-xs tracking-widest block md:text-right">
                        {formData.machAdType === "prodaja"
                          ? `${formData.machPrice} EUR`
                          : `${formData.machPricePerDay} EUR / dan`}
                      </span>
                    </div>
                    ) : null}
                 </div>
               </div>

               {selectedCategory !== "catering" && selectedCategory !== "machines" && selectedCategory !== "job" && (
                 <div className="mt-8 pt-6 border-t border-white/5">
                   <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block mb-4">
                     {selectedCategory === "accommodation" ? "Pogodnosti" : "Benefiti za kandidate"}
                   </span>
                   <div className="flex flex-wrap gap-3">
                     {(selectedCategory === "accommodation" ? formData.amenities : formData.benefits)?.map((slug: string) => {
                       const list = selectedCategory === "accommodation" ? ACCOMMODATION_AMENITIES : BENEFITS;
                       const name = list.find((b) => b.slug === slug)?.name;
                       return (
                         <span key={slug} className="bg-secondary/10 border border-secondary/20 text-secondary px-4 py-2 rounded-[12px] text-[11px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(254,191,13,0.15)] flex items-center gap-2">
                           <span className="material-symbols-outlined text-[14px]">check</span>
                           {name}
                         </span>
                       );
                     })}
                     {(selectedCategory === "accommodation" ? formData.amenities : formData.benefits)?.length === 0 && (
                       <span className="text-on-surface-variant italic text-xs">Nisu navedeni dodatni benefiti</span>
                     )}
                   </div>
                 </div>
               )}
             </div>
           </div>
        )}

        {/* SaaS Packages Grid Header */}
        <div className="text-center my-16">
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight font-headline">
            Odaberite Paket Vidljivosti
          </h3>
          <p className="text-on-surface-variant font-medium mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Želite li da vaš oglas vidi maksimalan broj korisnika? Odaberite Premium ili Hitno paket za vrhunske pozicije na portalu.
          </p>
        </div>

        {/* THREE SEPARATE, HARDCODED CARDS IN THE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch justify-center">
          
          {/* CARD 1: STANDARD PACKAGE */}
          {standardPkg && (
            <div
              onClick={() => setValue("paket", "standard")}
              className={`relative p-6 rounded-[24px] text-center border backdrop-blur-xl transition-all duration-500 flex flex-col justify-between cursor-pointer 
                ${isStandardSelected 
                  ? "border-blue-500/80 bg-gradient-to-b from-[#0c1835]/70 to-[#050814]/70 shadow-[0_0_40px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/30 scale-[1.02] -translate-y-2 z-10" 
                  : "border-white/5 bg-slate-900/30 hover:border-blue-500/30 hover:bg-slate-900/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:-translate-y-2"
                }`}
            >
              <div className="space-y-4 relative z-10">
                <div>
                  <h4 className={`font-black uppercase tracking-widest text-lg md:text-xl mb-1 ${isStandardSelected ? "text-blue-400" : "text-white"}`}>
                    STANDARD
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider opacity-65">
                    Standardno prikazivanje
                  </p>
                </div>

                <div className="py-2 border-y border-white/5 flex flex-col items-center justify-center gap-1">
                  <span className={`font-black text-3xl tracking-tight ${standardPkg.isDiscounted ? "text-red-500" : "text-white"}`}>
                    1.000
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
                    SG KREDITA (RSD)
                  </span>
                </div>

                <ul className="space-y-3 py-2">
                  {[
                    "Osnovna pozicija u oglasniku",
                    "30 dana trajanje oglasa"
                  ].map((f: string, i: number) => (
                    <li key={i} className="flex flex-row items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80 text-left">
                      <span className="material-symbols-outlined text-[16px] text-green-500 shrink-0">
                        check_circle
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 mt-6 relative z-10 
                  ${isStandardSelected 
                    ? "bg-white text-black font-black hover:bg-slate-100" 
                    : "border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {isStandardSelected ? "Izabran" : "Izaberi ovaj paket"}
              </button>
            </div>
          )}

          {/* CARD 2: PREMIUM PACKAGE */}
          {premiumPkg && (
            <div
              onClick={() => setValue("paket", premiumPkg.id)}
              className={`relative p-6 md:py-8 rounded-[24px] text-center border backdrop-blur-xl transition-all duration-500 flex flex-col justify-between cursor-pointer md:scale-[1.08] z-20
                ${isPremiumSelected 
                  ? "border-secondary bg-gradient-to-b from-[#1c140a]/80 to-[#070502]/80 shadow-[0_0_55px_rgba(254,191,13,0.3)] ring-1 ring-secondary/50 -translate-y-2" 
                  : "border-secondary/20 bg-slate-900/30 hover:border-secondary/50 hover:bg-[#1a150c]/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:-translate-y-2"
                }`}
            >
              {/* Premium Glow effect */}
              {isPremiumSelected && (
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none transition-transform duration-700 bg-secondary/10 blur-[40px]"></div>
              )}

              {premiumPkg.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] px-6 py-1.5 rounded-full shadow-[0_0_25px_rgba(254,191,13,0.6)] whitespace-nowrap z-30 flex items-center gap-1.5 border border-white/30">
                  <span className="material-symbols-outlined text-[14px] animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  PREPORUČENO
                </div>
              )}

              <div className="space-y-4 relative z-10">
                <div>
                  <h4 className={`font-black uppercase tracking-widest text-lg md:text-xl mb-1 ${isPremiumSelected ? "text-secondary font-black drop-shadow-[0_0_15px_rgba(254,191,13,0.3)]" : "text-secondary/90"} flex justify-center items-center gap-2`}>
                    PREMIUM OGLAS
                    <span className="material-symbols-outlined text-lg animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider opacity-65">
                    Za ozbiljnije oglašivače
                  </p>
                </div>

                <div className="py-2 border-y border-white/5 flex flex-col items-center justify-center gap-1">
                  <span className={`font-black text-3xl tracking-tight ${premiumPkg.isDiscounted ? "text-red-500" : "text-white"}`}>
                    2.000
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
                    SG KREDITA (RSD)
                  </span>
                </div>

                <ul className="space-y-3 py-2">
                  {[
                    "Naslovna strana",
                    "Uvek na vrhu pretrage",
                    "Poseban dizajn i boja",
                    "Bedž PREMIUM",
                    "30 dana trajanje oglasa"
                  ].map((f: string, i: number) => (
                    <li key={i} className="flex flex-row items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80 text-left">
                      <span className="material-symbols-outlined text-[16px] text-green-500 shrink-0">
                        check_circle
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 mt-6 relative z-10 
                  ${isPremiumSelected 
                    ? "bg-gradient-to-r from-secondary via-yellow-400 to-secondary text-black font-black hover:brightness-110 shadow-[0_0_20px_rgba(254,191,13,0.3)]" 
                    : "border border-secondary/20 text-secondary/80 hover:bg-secondary/5"
                  }`}
              >
                {isPremiumSelected ? "Izabran" : "Izaberi Premium"}
              </button>
            </div>
          )}

          {/* CARD 3: URGENT / HITNO PACKAGE */}
          {urgentPkg && (
            <div
              onClick={() => setValue("paket", "urgent")}
              className={`relative p-6 rounded-[24px] text-center border backdrop-blur-xl transition-all duration-500 flex flex-col justify-between cursor-pointer 
                ${isUrgentSelected 
                  ? "border-blue-500 bg-gradient-to-b from-[#0b1b3f]/80 to-[#040915]/80 shadow-[0_0_45px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50 scale-[1.02] -translate-y-2 z-10" 
                  : "border-blue-500/10 bg-slate-900/30 hover:border-blue-500/40 hover:bg-slate-900/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:-translate-y-2"
                }`}
            >
              {/* Blue Glow effect */}
              {isUrgentSelected && (
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none transition-transform duration-700 bg-blue-500/10 blur-[40px]"></div>
              )}

              <div className="space-y-4 relative z-10">
                <div>
                  <h4 className={`font-black uppercase tracking-widest text-lg md:text-xl mb-1 ${isUrgentSelected ? "text-blue-400 font-black drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "text-white"}`}>
                    HITNO (URGENT)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider opacity-65">
                    Najviši prioritet
                  </p>
                </div>

                <div className="py-2 border-y border-white/5 flex flex-col items-center justify-center gap-1">
                  <span className={`font-black text-3xl tracking-tight ${urgentPkg.isDiscounted ? "text-red-500" : "text-white"}`}>
                    4.000
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
                    SG KREDITA (RSD)
                  </span>
                </div>

                <ul className="space-y-3 py-2">
                  {[
                    "Naslovna strana",
                    "Uvek na vrhu pretrage",
                    "Poseban dizajn i boja",
                    "Bedž Hitno",
                    "7 dana trajanje oglasa"
                  ].map((f: string, i: number) => (
                    <li key={i} className="flex flex-row items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80 text-left">
                      <span className="material-symbols-outlined text-[16px] text-green-500 shrink-0">
                        check_circle
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 mt-6 relative z-10 
                  ${isUrgentSelected 
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white font-black hover:brightness-110 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                    : "border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {isUrgentSelected ? "Izabran" : "Izaberi ovaj paket"}
              </button>
            </div>
          )}

        </div>

        {/* SaaS Checkout / Kasa (Screenshot 2 layout style with high glassmorphism) */}
        {formData.paket && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          >
            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-8 border-b border-white/5 pb-4">
              Kasa / Plaćanje
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Side: Payment Method Selection */}
              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4">
                  Izaberite način plaćanja
                </h4>
                
                {/* SG Wallet (Active) */}
                <div 
                  onClick={() => setValue("paymentMethod", "wallet")}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-center justify-between bg-[#0b132b]/60 backdrop-blur-xl ${currentPaymentMethod === "wallet" ? "border-blue-500 bg-[#0d1e3d]/80 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "border-white/5 hover:border-slate-800"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider">SG Krediti (Novčanik)</p>
                      <p className="text-xs text-on-surface-variant/80 font-bold font-sans">Stanje na računu: {walletBalance.toLocaleString("sr-RS")} SG</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${currentPaymentMethod === "wallet" ? "border-blue-500 bg-blue-500/10" : "border-white/20"}`}>
                    {currentPaymentMethod === "wallet" && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                  </div>
                </div>

                {/* Faktura Option (Disabled / Soon) */}
                <div className="p-5 rounded-2xl border border-white/5 opacity-40 bg-[#0b132b]/40 flex items-center justify-between cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-on-surface-variant">
                      <span className="material-symbols-outlined">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        Faktura
                        <span className="text-[9px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-black uppercase tracking-widest">USKORO!</span>
                      </p>
                      <p className="text-xs text-on-surface-variant font-bold font-sans">Plaćanje za pravna lica</p>
                    </div>
                  </div>
                </div>

                {/* Credit Card Option (Disabled / Soon) */}
                <div className="p-5 rounded-2xl border border-white/5 opacity-40 bg-[#0b132b]/40 flex items-center justify-between cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-on-surface-variant">
                      <span className="material-symbols-outlined">credit_card</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        Platna kartica
                        <span className="text-[9px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-black uppercase tracking-widest">USKORO!</span>
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded font-bold uppercase">VISA</span>
                        <span className="text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded font-bold uppercase">Mastercard</span>
                        <span className="text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded font-bold uppercase">Dina</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* E-Banking Option (Disabled / Soon) */}
                <div className="p-5 rounded-2xl border border-white/5 opacity-40 bg-[#0b132b]/40 flex items-center justify-between cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-on-surface-variant">
                      <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        E-Banking / Uplatnica
                        <span className="text-[9px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-black uppercase tracking-widest">USKORO!</span>
                      </p>
                      <p className="text-xs text-on-surface-variant font-bold font-sans">Plaćanje preko web bankarstva</p>
                    </div>
                  </div>
                </div>

                {/* mBanking Option (Disabled / Soon) */}
                <div className="p-5 rounded-2xl border border-white/5 opacity-40 bg-[#0b132b]/40 flex items-center justify-between cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-on-surface-variant">
                      <span className="material-symbols-outlined">qr_code_scanner</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        mBanking (IPS QR)
                        <span className="text-[9px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-black uppercase tracking-widest">USKORO!</span>
                      </p>
                      <p className="text-xs text-on-surface-variant font-bold font-sans">Plaćanje skeniranjem koda</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Order Summary Card */}
              <div className="space-y-6">
                {/* Wallet Balance Card */}
                <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black">
                      <span className="material-symbols-outlined text-[16px] font-black">account_balance_wallet</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Dostupna sredstva</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Trenutni saldo</p>
                    <p className="text-3xl font-black text-white flex items-baseline gap-2">
                      {walletBalance.toLocaleString("sr-RS")} <span className="text-green-500 text-sm tracking-widest uppercase">Kredita</span>
                    </p>
                  </div>
                </div>

                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 mt-6">
                  Pregled porudžbine
                </h4>
                
                {/* Plan Receipt Box */}
                <div className="bg-[#0b132b]/80 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[50px] pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Izabrani paket</p>
                      <h5 className="text-xl font-black text-white uppercase tracking-wider">
                        {selectedPkg?.name}
                      </h5>
                    </div>
                    <span className="text-2xl font-black text-white">
                      {selectedPkg && selectedPkg.priceNum > 0 ? `${selectedPkg.priceNum.toLocaleString("sr-RS")} SG` : "BESPLATNO"}
                    </span>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3 text-xs">
                    <div className="flex justify-between text-on-surface-variant font-bold">
                      <span>Osnovna cena paketa:</span>
                      <span className="text-white">{selectedPkg ? selectedPkg.priceNum.toLocaleString("sr-RS") : "0"} SG</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant font-bold">
                      <span>PDV (0% - Oslobođeno):</span>
                      <span className="text-white">0 SG</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant font-bold">
                      <span>Trajanje objave oglasa:</span>
                      <span className="text-white">{selectedPkg?.id === 'urgent' ? '7 dana' : '30 dana'}</span>
                    </div>
                    {systemConfig?.holidayModeActive && selectedPkg?.isDiscounted && (
                      <div className="flex justify-between text-red-400 font-bold">
                        <span>Praznični popust:</span>
                        <span>-{systemConfig.discountPercentage || 0}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-on-surface-variant font-bold border-t border-white/5 pt-3">
                      <span className="text-sm font-black text-white uppercase">Ukupno za naplatu:</span>
                      <span className="text-sm font-black text-white">{selectedPkg ? selectedPkg.priceNum.toLocaleString("sr-RS") : "0"} SG</span>
                    </div>
                  </div>
                </div>

                {/* Balance Status & Pay Button */}
                <div className="space-y-4 pt-4">
                  {isInsufficientFunds && (
                    <div className="bg-error/10 border border-error/20 p-3 rounded-xl text-center">
                      <p className="text-error text-[10px] font-black uppercase tracking-wider">
                        Nedostaje još: {(currentPackagePrice - walletBalance).toLocaleString("sr-RS")} SG kredita za objavu
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isUploadingImages ||
                      isSubmitting ||
                      cooldown > 0 ||
                      isInsufficientFunds ||
                      currentPaymentMethod !== "wallet"
                    }
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center text-sm
                      ${isInsufficientFunds 
                        ? "bg-error/10 text-error border border-error/20 cursor-not-allowed" 
                        : selectedPkg?.id === "premium"
                          ? "bg-gradient-to-r from-secondary via-yellow-400 to-secondary text-black hover:brightness-110 shadow-[0_0_30px_rgba(254,191,13,0.4)] hover:scale-[1.01]"
                          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white hover:brightness-110 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-[1.01]"
                      } disabled:opacity-50`}
                  >
                    {(isUploadingImages || isSubmitting) && (
                      <span className="material-symbols-outlined animate-spin mr-2">
                        progress_activity
                      </span>
                    )}
                    {isUploadingImages
                      ? "OTPREMANJE MEDIJA..."
                      : isSubmitting
                        ? "OBRAĐUJEM TRANSAKCIJU..."
                        : cooldown > 0
                          ? `SAČEKAJ ${cooldown}s`
                          : isInsufficientFunds
                            ? "Dopunite novčanik"
                            : "Potvrdi i Plati"}
                  </button>

                  {isInsufficientFunds && (
                    <p className="text-error/60 text-[9px] font-bold uppercase tracking-wider text-center">
                      Posetite Vaš Profil za dopunu SG Kredita
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Safety guarantees (Full width footer) */}
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-3 md:gap-4 max-w-sm">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                </div>
                <div>
                  <p className="text-white text-[11px] font-black uppercase tracking-widest mb-1">100% Sigurna Platforma</p>
                  <p className="text-on-surface-variant text-[10px] font-medium leading-relaxed">Svi vaši podaci su zaštićeni vrhunskom SSL enkripcijom.</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                {/* Fallback to text if image isn't available yet */}
                <img 
                  src="/visa-mastercard.png" 
                  alt="Visa Mastercard" 
                  className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity" 
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    const nextEl = e.currentTarget.nextElementSibling;
                    if (nextEl) (nextEl as HTMLElement).style.display = 'flex';
                  }} 
                />
                <div style={{ display: 'none' }} className="flex gap-4">
                  <span className="text-white font-black text-xl italic">VISA</span>
                  <span className="text-white font-black text-xl italic">Mastercard</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-3 md:gap-4 max-w-sm">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div>
                  <p className="text-white text-[11px] font-black uppercase tracking-widest mb-1">Garantovana isporuka</p>
                  <p className="text-on-surface-variant text-[10px] font-medium leading-relaxed">Oglas se aktivira momentalno po uspešnoj uplati.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error States */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-8 p-4 bg-error/10 border border-error/20 rounded-[12px]">
            <p className="text-error text-[10px] font-black uppercase tracking-widest text-center mb-2">
              Postoje greške u formi. Proverite unos u prethodnim koracima:
            </p>
            <ul className="text-center flex flex-wrap justify-center gap-4">
              {Object.entries(errors).map(([key, err]) => (
                <li key={key} className="text-error/80 text-[10px] font-bold uppercase tracking-wider bg-error/5 px-3 py-1 rounded">
                  {key}: {err?.message as string}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </>
  );
}
