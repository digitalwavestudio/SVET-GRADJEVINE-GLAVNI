import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Step1 } from "@/src/modules/ads/components/post-ad/Step1";
import { Step2 } from "@/src/modules/ads/components/post-ad/Step2";
import { Step3 } from "@/src/modules/ads/components/post-ad/Step3";
import { Step4 } from "@/src/modules/ads/components/post-ad/Step4";
import { useAuth } from "@/src/context/AuthContext";
import { useBrandLogo } from "@/src/context/BrandContext";
import { getPackageById } from "@/src/constants/adPackages";
import { FormProvider } from "react-hook-form";
import { usePostAdController } from "@/src/modules/ads/hooks/usePostAdController";
import { usePlatformSettings } from "@/src/modules/dashboard/hooks/useMyAds";
import { SuccessState } from "@/src/modules/ads/components/post-ad/SuccessState";
import { CategorySelector } from "@/src/modules/ads/components/post-ad/CategorySelector";
import { AdOverlays } from "@/src/modules/ads/components/post-ad/AdOverlays";
import { AccessRestricted } from "@/src/modules/ads/components/post-ad/AccessRestricted";
import {
  jobSchema as jobSchema,
  machineSchema as machineSchema,
  accommodationSchema as accommodationSchema,
  cateringSchema as cateringSchema,
  realEstateSchema as realEstateSchema,
  marketplaceSchema as marketplaceSchema,
  businessProfileSchema as companySchema,
} from "@svet-gradjevine/shared";
import { getAutoTitle, ROLE_PERMISSIONS } from "@/src/modules/ads/utils/adUtils";

const getValidationSchema = (category: string | null) => {
  switch (category) {
    case "job":
      return jobSchema;
    case "machines":
      return machineSchema;
    case "accommodation":
      return accommodationSchema;
    case "catering":
      return cateringSchema;
    case "plot":
      return realEstateSchema;
    case "marketplace":
      return marketplaceSchema;
    case "company":
      return companySchema;
    default:
      return null;
  }
};

import { RoleGuard } from "@/src/components/auth/RoleGuard";

// ... previous helper code ...

export default function PostAdPage() {
  const allowedRoles = Object.keys(ROLE_PERMISSIONS).filter(role => ROLE_PERMISSIONS[role].length > 0);
  
  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <PostAdContent />
    </RoleGuard>
  );
}

function PostAdContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoUrl } = useBrandLogo();
  const { user } = useAuth();
  const { data: settings } = usePlatformSettings();
  const launchMode = settings?.launchMode ?? true;

  const searchParams = new URLSearchParams(location.search);
  const initialPackage = searchParams.get("paket") || "free";
  const editType = searchParams.get("type");
  const editId = searchParams.get("id");

  const {
    methods,
    formData,
    onFormSubmit,
    selectedCategory,
    setSelectedCategory,
    step,
    setStep,
    nextStep,
    prevStep,
    isUploadingImages,
    isSubmitting,
    setIsSubmitted,
    isSubmitted,
    cooldown,
    showDepositPrompt,
    setShowDepositPrompt,
    handleImageUpload,
    removeImage,
    handlePortfolioUpload,
    removePortfolioImage,
  } = usePostAdController({ initialPackage, editId, editType, launchMode });

  if (!user) return null;

  const allowedCategories = ROLE_PERMISSIONS[user.role] || [];
  const autoTitle = getAutoTitle(formData, selectedCategory, user);

  if (isSubmitted) {
    if (formData.paket === "free") {
      return (
        <SuccessState
          type="free"
          onReset={() => {
            setIsSubmitted(false);
            setStep(1);
            setSelectedCategory(null);
          }}
        />
      );
    }
    const currentPackage = getPackageById(
      selectedCategory || "job",
      formData.paket
    );
    return (
      <SuccessState
        type="paid"
        packageName={currentPackage.name}
        onReset={() => {
          setIsSubmitted(false);
          setStep(1);
          setSelectedCategory(null);
        }}
      />
    );
  }

  if (!selectedCategory) {
    const allOptions = [
      { id: "job", title: "Postavljam oglas za posao", subtitle: "ZA FIRME I POSLODAVCE", icon: "work" },
      { id: "company", title: "Reklamiram svoju građevinsku kompaniju", subtitle: "ZA GRAĐEVINSKE FIRME", icon: "business" },
      { id: "accommodation", title: "Reklamiram smeštaj za radnike", subtitle: "ZA VLASNIKE SMEŠTAJA", icon: "home_work" },
      { id: "catering", title: "Oglašavam svoje ketering usluge", subtitle: "ZA KETERING SLUŽBE", icon: "restaurant" },
      { id: "machines", title: "Prodajem ili izdajem mašinu", subtitle: "ZA VLASNIKE MAŠINA", icon: "precision_manufacturing" },
      { id: "plot", title: "Prodajem ili izdajem plac", subtitle: "ZA VLASNIKE PLACA", icon: "landscape" },
      { id: "marketplace", title: "Alat i oprema (Polovno)", subtitle: "POLOVAN ALAT I OPREMA", icon: "build" },
    ];

    const options = allOptions.filter((opt) =>
      allowedCategories.includes(opt.id)
    );

    if (options.length === 0) {
      return <AccessRestricted userRole={user.role} />;
    }

    return (
      <CategorySelector
        options={options}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
        logoUrl={logoUrl || undefined}
        userRole={user.role}
      />
    );
  }

  return (
    <div className="bg-[#0B1219] text-white min-h-screen pt-12 pb-32 relative overflow-hidden font-body">
      <AdOverlays
        showDepositPrompt={showDepositPrompt}
        setShowDepositPrompt={setShowDepositPrompt}
        isUploadingImages={isUploadingImages}
      />

      <div className="absolute inset-0 futuristic-grid opacity-10 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 mt-16">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px] mb-4 block">
              Proces objave oglasa
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 font-headline leading-none">
              Postavi oglas{" "}
              <span className="text-secondary">
                {selectedCategory === "job"
                  ? "za posao"
                  : selectedCategory === "company"
                    ? "za firmu"
                    : selectedCategory === "accommodation"
                      ? "za smeštaj"
                      : "za uslugu"}
              </span>
            </h1>
          </motion.div>

          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-4">
              <span className={step >= 1 ? "text-secondary" : ""}>
                01. Detalji
              </span>
              <span className={step >= 2 ? "text-secondary" : ""}>
                02. Uslovi
              </span>
              <span className={step >= 3 ? "text-secondary" : ""}>
                03. Opis
              </span>
              <span className={step >= 4 ? "text-secondary" : ""}>
                04. Paket
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-full flex-1 transition-all duration-500 rounded-full ${step >= s ? "bg-secondary shadow-[0_0_10px_rgba(254,191,13,0.5)]" : "bg-white/10"}`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onFormSubmit as any)}
            className="bg-white/[0.03] backdrop-blur-xl p-8 md:p-12 rounded-[10px] border border-white/10 shadow-2xl relative overflow-hidden"
          >
            <input
              type="text"
              id="website_url_trap"
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
              {...methods.register("_honeypot")}
            />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/10 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>

            {step === 1 && (
              <Step1
                selectedCategory={selectedCategory!}
                setSelectedCategory={setSelectedCategory}
                nextStep={nextStep}
              />
            )}
            {step === 2 && (
              <Step2
                selectedCategory={selectedCategory!}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            )}
            {step === 3 && (
              <Step3
                selectedCategory={selectedCategory!}
                nextStep={nextStep}
                prevStep={prevStep}
                handleImageUpload={handleImageUpload}
                removeImage={removeImage}
                handlePortfolioUpload={handlePortfolioUpload}
                removePortfolioImage={removePortfolioImage}
              />
            )}
            {step === 4 && (
              <Step4
                selectedCategory={selectedCategory}
                prevStep={prevStep}
                autoTitle={autoTitle}
                launchMode={launchMode}
                isUploadingImages={isUploadingImages}
                isSubmitting={isSubmitting}
                cooldown={cooldown}
                setStep={setStep}
              />
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
