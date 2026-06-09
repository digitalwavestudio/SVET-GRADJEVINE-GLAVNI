import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useFormContext } from "react-hook-form";
import { UI_TOKENS } from "@/src/lib/uiTokens";
import {
  ENGAGEMENT_TYPES,
  ACCOMMODATION_AMENITIES,
  BENEFITS,
} from "@/src/constants/taxonomy";
import { getPackagesByCategory } from "@/src/constants/adPackages";
import { useAuth } from "@/src/context/AuthContext";
import { useSystemConfig } from "@/src/hooks/useSystemConfig";

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
  const walletBalance = user?.walletBalance || user?.partnerBalance || 0;

  const packages = useMemo(() => {
    const rawPackages = getPackagesByCategory(selectedCategory || "job");

    // Apply dynamic discounts from system config
    if (systemConfig?.holidayModeActive) {
      return rawPackages.map((pkg) => {
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
    return rawPackages;
  }, [selectedCategory, systemConfig]);

  const currentPackagePrice =
    packages.find((p) => p.id === formData.paket)?.priceNum || 0;
  const isInsufficientFunds =
    formData.paket !== "free" &&
    currentPackagePrice > 0 &&
    walletBalance < currentPackagePrice;

  return (
    <>
      {selectedCategory === "company" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">
                public
              </span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline">
              Oblast pokrivenosti
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-4">
                Područje rada *
              </label>
              {[
                { id: "local", name: "Lokalno (grad/opština)" },
                { id: "regional", name: "Regionalno (ceo region)" },
                { id: "national", name: "Cela Srbija" },
                { id: "international", name: "Inostranstvo" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setValue("companyCoverage", opt.id)}
                  className={`w-full p-5 rounded-[10px] border-2 text-left transition-all flex items-center justify-between ${formData.companyCoverage === opt.id ? "border-secondary bg-secondary/10" : "border-white/5 bg-white/5"}`}
                >
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${formData.companyCoverage === opt.id ? "text-secondary" : "text-white"}`}
                  >
                    {opt.name}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.companyCoverage === opt.id ? "border-secondary" : "border-white/20"}`}
                  >
                    {formData.companyCoverage === opt.id && (
                      <div className="w-2.5 h-2.5 bg-secondary rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-4">
                Unesite detalje lokacije
              </label>
              <textarea
                {...register("companyCoverageValue")}
                placeholder={
                  formData.companyCoverage === "local"
                    ? "Npr. Zemun, Novi Beograd..."
                    : "Npr. Vojvodina, Moravički okrug ili specifične zemlje..."
                }
                rows={8}
                className="w-full bg-white/5 border-2 border-white/5 rounded-[10px] px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-bold resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              className={UI_TOKENS.BTN_SECONDARY}
            >
              Nazad
            </button>
            <button
              type="submit"
              disabled={isUploadingImages || isSubmitting || cooldown > 0}
              className={
                UI_TOKENS.BTN_POST_AD +
                " bg-emerald-600 border-emerald-600 hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50"
              }
            >
              {(isUploadingImages || isSubmitting) && (
                <span className="material-symbols-outlined animate-spin mr-2">
                  progress_activity
                </span>
              )}
              {isUploadingImages
                ? "OTPREMANJE SLIKA..."
                : isSubmitting
                  ? "SLANJE..."
                  : "Objavi profil firme"}{" "}
              {!isUploadingImages && !isSubmitting && (
                <span className="material-symbols-outlined">rocket_launch</span>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4 - Others */}
      {selectedCategory !== "company" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">
                verified
              </span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline">
              Finalni Pregled i Paketi
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Pregled */}
            <div className="space-y-8">
              <div className="bg-white/[0.02] p-8 rounded-[10px] border border-white/5">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                      Vaš oglas ukratko
                    </span>
                    {formData.paket === "premium" && (
                      <span className="bg-secondary/20 text-secondary text-[8px] font-black px-2 py-0.5 rounded flex items-center gap-1 animate-blink">
                        <span
                          className="material-symbols-outlined text-[10px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          auto_awesome
                        </span>{" "}
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-secondary text-[10px] font-black uppercase tracking-widest hover:underline"
                  >
                    Izmeni sve
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block mb-2">
                      Pozicija / Naslov
                    </span>
                    <span className="text-2xl font-black text-white uppercase tracking-tight font-headline">
                      {autoTitle}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block mb-2">
                        {selectedCategory === "accommodation"
                          ? "Cena"
                          : selectedCategory === "catering"
                            ? "Cena po obroku"
                            : selectedCategory === "machines"
                              ? "Tip oglasa"
                              : formData.salaryType === "hourly"
                                ? "Satnica"
                                : "Plata"}
                      </span>
                      <span className="font-black text-secondary text-lg">
                        {selectedCategory === "accommodation"
                          ? `${formData.price} EUR ${formData.priceType === "perPerson" ? "/ osobi" : "/ objekat"}`
                          : selectedCategory === "catering"
                            ? `od ${formData.catPricePerMeal} EUR`
                            : selectedCategory === "machines"
                              ? formData.machAdType === "prodaja"
                                ? "Prodaja"
                                : "Izdavanje"
                              : `${formData.plataMin} - ${formData.plataMax} EUR`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block mb-2">
                        {selectedCategory === "accommodation"
                          ? "Kapacitet"
                          : selectedCategory === "catering"
                            ? "Min. porudžbina"
                            : selectedCategory === "machines"
                              ? "Cena"
                              : "Angažman"}
                      </span>
                      <span className="font-bold text-white uppercase text-xs tracking-widest">
                        {selectedCategory === "accommodation"
                          ? `${formData.totalBeds} ležajeva (${formData.availableBeds || formData.totalBeds} slobodno)`
                          : selectedCategory === "catering"
                            ? `${formData.catMinOrder} obroka`
                            : selectedCategory === "machines"
                              ? formData.machAdType === "prodaja"
                                ? `${formData.machPrice} EUR`
                                : `${formData.machPricePerDay} EUR / dan`
                              : formData.tipAngazmana === "upisi"
                                ? formData.customEngagement
                                : ENGAGEMENT_TYPES.find(
                                    (t) => t.slug === formData.tipAngazmana,
                                  )?.name}
                      </span>
                    </div>
                  </div>
                  {selectedCategory !== "catering" &&
                    selectedCategory !== "machines" && (
                      <div>
                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] block mb-2">
                          {selectedCategory === "accommodation"
                            ? "Pogodnosti"
                            : "Benefiti"}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(selectedCategory === "accommodation"
                            ? formData.amenities
                            : formData.benefiti
                          )?.map((slug: string) => {
                            const list =
                              selectedCategory === "accommodation"
                                ? ACCOMMODATION_AMENITIES
                                : BENEFITS;
                            const name = list.find(
                              (b) => b.slug === slug,
                            )?.name;
                            return (
                              <span
                                key={slug}
                                className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest text-on-surface-variant"
                              >
                                {name}
                              </span>
                            );
                          })}
                          {(selectedCategory === "accommodation"
                            ? formData.amenities
                            : formData.benefiti
                          )?.length === 0 && (
                            <span className="text-on-surface-variant italic text-xs">
                              Nisu navedeni
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="bg-secondary/5 p-6 rounded-[10px] border border-secondary/10 flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary">
                  info
                </span>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Proverite sve podatke pre objave. Nakon objave, oglas će biti
                  poslat na moderaciju i biće aktivan u roku od nekoliko minuta.
                </p>
              </div>
            </div>

            {/* Izbor Paketa */}
            <div className="space-y-6">
              <div className="flex justify-between items-center ml-1 mb-2">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                  Izaberite nivo vidljivosti
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">
                    account_balance_wallet
                  </span>
                  Stanje u Wallet-u: {walletBalance.toLocaleString("sr-RS")} SG Kredita
                </span>
              </div>

              <div className="space-y-4">
                 {packages.map((pkg) => {
                   const isSelected = formData.paket === pkg.id;
                   
                   // Explicit mapping to prevent tree-shaking compile issues
                   let borderBgClass = "border-white/5 bg-white/[0.02] hover:border-white/20";
                   if (isSelected) {
                     if (pkg.color === "secondary") borderBgClass = "border-secondary bg-secondary/5 shadow-xl";
                     else if (pkg.color === "primary") borderBgClass = "border-primary bg-primary/5 shadow-xl";
                     else borderBgClass = "border-white bg-white/5 shadow-xl";
                   }

                   let textClass = "text-white";
                   if (isSelected) {
                     if (pkg.color === "secondary") textClass = "text-secondary";
                     else if (pkg.color === "primary") textClass = "text-primary";
                   }

                   let radioClass = "border-white/20";
                   if (isSelected) {
                     if (pkg.color === "secondary") radioClass = "border-secondary bg-secondary";
                     else if (pkg.color === "primary") radioClass = "border-primary bg-primary";
                     else radioClass = "border-white bg-white";
                   }

                   return (
                     <label
                       key={pkg.id}
                       className={`block relative p-6 rounded-[10px] border-2 cursor-pointer transition-all duration-500 group ${borderBgClass}`}
                     >
                       {pkg.recommended && (
                         <div className="absolute -top-3 right-6 bg-secondary text-slate-950 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg z-10">
                           ★ PREPORUČENO
                         </div>
                       )}
                       <div className="flex items-start gap-5">
                         <div className="pt-1">
                           <div
                             className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${radioClass}`}
                           >
                             {isSelected && (
                               <div className="w-2.5 h-2.5 bg-slate-950 rounded-full"></div>
                             )}
                           </div>
                           <input
                             aria-label="Unos polja"
                             type="radio"
                             value={pkg.id}
                             checked={isSelected}
                             onChange={(e) => setValue("paket", e.target.value)}
                             className="hidden"
                           />
                         </div>
                         <div className="flex-1">
                           <div className="flex justify-between items-center mb-1">
                             <span
                               className={`font-black uppercase tracking-widest text-sm ${textClass} ${pkg.id === "premium" ? "animate-blink" : ""}`}
                             >
                            {pkg.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {pkg.oldPrice && (
                              <span className="text-on-surface-variant line-through text-xs ml-2 opacity-60 font-bold">
                                {pkg.oldPrice}
                              </span>
                            )}
                            <span
                              className={`font-black text-white text-base ${pkg.id !== "free" ? (pkg.isDiscounted ? "text-red-500 text-lg shadow-red-500/50 blink-animation" : "text-green-500 text-lg shadow-green-500/50") : ""}`}
                            >
                              {pkg.price}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mb-4 font-bold uppercase tracking-widest opacity-60">
                          {pkg.desc}
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {pkg.features.map((f: string, i: number) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                check
                              </span>{" "}
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                     </label>
                    );
                 })}
              </div>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-white/5 flex flex-col-reverse md:flex-row justify-between items-center gap-8">
            <button
              type="button"
              onClick={prevStep}
              className="text-on-surface-variant font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
            >
              ← Vrati se na izmene
            </button>
            <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
              <button
                type="submit"
                disabled={
                  isUploadingImages ||
                  isSubmitting ||
                  cooldown > 0 ||
                  isInsufficientFunds
                }
                className={
                  UI_TOKENS.BTN_POST_AD + " px-16 w-full disabled:opacity-50"
                }
              >
                {(isUploadingImages || isSubmitting) && (
                  <span className="material-symbols-outlined animate-spin mr-2">
                    progress_activity
                  </span>
                )}
                {isUploadingImages
                  ? "OTPREMANJE SLIKA..."
                  : isSubmitting
                    ? "SLANJE..."
                    : cooldown > 0
                      ? `SAČEKAJ ${cooldown}s`
                      : formData.paket === "free"
                        ? "Objavi besplatno"
                        : isInsufficientFunds
                          ? "Nedovoljno sredstava"
                          : "Plati i objavi"}
              </button>
              {isInsufficientFunds && (
                <p className="text-error text-xs font-bold uppercase tracking-wider text-center md:text-right mt-2 animate-bounce">
                  Molimo dopunite wallet na profilu
                </p>
              )}
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-[10px]">
              <p className="text-error text-[10px] font-black uppercase tracking-widest text-center">
                Postoje greške u formi. Molimo vas da proverite unos u
                prethodnim koracima:
              </p>
              <ul className="mt-2 text-center">
                {Object.entries(errors).map(([key, err]) => (
                  <li
                    key={key}
                    className="text-error/70 text-[9px] font-bold uppercase tracking-wider"
                  >
                    {key}: {err?.message as string}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
