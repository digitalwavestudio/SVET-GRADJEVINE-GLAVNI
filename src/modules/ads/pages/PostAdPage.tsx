import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
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
import { AdOverlays } from "@/src/modules/ads/components/post-ad/AdOverlays";
import { jobSchema } from "@svet-gradjevine/shared";
import { getAutoTitle } from "@/src/modules/ads/utils/adUtils";

const getValidationSchema = (category: string | null) => {
  return jobSchema;
};

export default function PostAdPage() {
  const location = useLocation();
  const { logoUrl } = useBrandLogo();
  const { user } = useAuth();
  const { data: settings } = usePlatformSettings();
  const launchMode = settings?.launchMode ?? true;

  const searchParams = new URLSearchParams(location.search);
  const initialPackage = searchParams.get("paket") || "";
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
    submittedPackage,
    cooldown,
    showDepositPrompt,
    setShowDepositPrompt,
    handleImageUpload,
    removeImage,
    handlePortfolioUpload,
    removePortfolioImage,
  } = usePostAdController({ initialPackage, editId, editType, launchMode });

  if (!user) return null;

  const autoTitle = getAutoTitle(formData, selectedCategory || "job", user);

  useEffect(() => {
    if (!selectedCategory) setSelectedCategory("job");
  }, []);

  if (!selectedCategory) return null;

  if (isSubmitted) {
    const currentPackage = getPackageById(
      selectedCategory || "job",
      submittedPackage || formData.paket
    );
    return (
      <SuccessState
        type="paid"
        packageName={currentPackage.name}
        onReset={() => {
          setIsSubmitted(false);
          setStep(1);
          setSelectedCategory("job");
        }}
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

      {/* BACKGROUND BLOBS REMOVED AS REQUESTED */}

      <div className={`mx-auto px-4 md:px-6 relative z-10 mt-16 transition-all duration-500 ${step === 4 ? 'max-w-7xl' : 'max-w-4xl'}`}>
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
              <span className="text-secondary">za posao</span>
            </h1>
          </motion.div>

          <div className="max-w-md mx-auto hidden sm:block">
            <div className="flex items-center justify-between text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-4">
              <span className={step >= 1 ? "text-secondary" : ""}>01. Detalji</span>
              {selectedCategory !== 'job' && (
                <>
                  <span className={step >= 2 ? "text-secondary" : ""}>02. Uslovi</span>
                  <span className={step >= 3 ? "text-secondary" : ""}>03. Opis</span>
                </>
              )}
              <span className={step >= 4 ? "text-secondary" : ""}>0{selectedCategory === 'job' ? '2' : '4'}. Paket</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex gap-1">
              {[1, ...(selectedCategory === 'job' ? [] : [2, 3]), 4].map((s) => (
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
            className={step === 4 ? "relative" : "bg-slate-950/40 backdrop-blur-3xl p-4 sm:p-8 md:p-14 rounded-[24px] md:rounded-[32px] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)] relative"}
          >
            {step !== 4 && (
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent pointer-events-none"></div>
            )}
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
                setStep={setStep}
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
