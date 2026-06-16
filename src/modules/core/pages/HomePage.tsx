import { motion } from 'motion/react';
import { useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CtaSection from '@/src/components/CtaSection';
import SeoHead from '@/src/components/SeoHead';
import { SEO } from '@/src/components/SEO';
import { APP_CONFIG } from '@/src/constants/config';
import { buildJobUrl } from '@/src/lib/seo';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import CustomSelect from '@/src/modules/core/components/home/CustomSelect';
import HeroSection from '@/src/modules/core/components/home/HeroSection';
import CalculatorBanner from '@/src/modules/core/components/home/CalculatorBanner';
import UrgentJobs from '@/src/modules/core/components/home/UrgentJobs';
import PremiumJobs from '@/src/modules/core/components/home/PremiumJobs';
import EquipmentSection from '@/src/modules/core/components/home/EquipmentSection';
import CateringSection from '@/src/modules/core/components/home/CateringSection';
import AboutSection from '@/src/modules/core/components/home/AboutSection';
import AnimatedCounter from '@/src/modules/core/components/home/AnimatedCounter';
import { useHomepageData } from '@/src/modules/core/hooks/useHomepageData';
import { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '@/src/lib/seo/schemas';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Background preloading of critical dashboard routes immediately on home page idle
  useEffect(() => {
    import('@/src/modules/dashboard/routes')
      .then(({ prefetchDashboard }) => {
        prefetchDashboard();
      })
      .catch((err) => {
        console.warn('Dashboard prefetch failed:', err);
      });
  }, []);
  
  // Ovdje umesto skidanja CELIH KOLEKCIJA samo vučemo kompresovan BFF endpoint
  const { data: bffData, isLoading: isLoadingBff } = useHomepageData();
  const stats = bffData?.stats;
  const premiumJobs = bffData?.premiumJobs || [];
  const urgentJobs = bffData?.urgentJobs || [];
  const latestMachines = bffData?.latestMachines || [];
  const latestRealEstate = bffData?.latestRealEstate || [];
  const latestAccommodations = bffData?.latestAccommodations || [];
  const latestCaterings = bffData?.latestCaterings || [];

  // Dynamic Statistics from BFF Aggregated Data
  const statsValues = useMemo(() => ({
    totalAdsCount: stats?.totalAdsCount ?? 15000,
    dynamicFirmsCount: stats?.dynamicFirmsCount ?? 9500,
    dynamicWorkersCount: stats?.dynamicWorkersCount ?? 350000,
    dynamicMachineryCount: stats?.dynamicMachineryCount ?? 1600,
    dynamicRealEstateCount: stats?.dynamicRealEstateCount ?? 550,
    dynamicViewsCount: stats?.dynamicViewsCount ?? 954000,
  }), [stats]);

  const {
    totalAdsCount,
    dynamicFirmsCount,
    dynamicWorkersCount,
    dynamicMachineryCount,
    dynamicRealEstateCount,
    dynamicViewsCount
  } = statsValues;

  const handleCardClick = (to: string, state: any) => {
    navigate(to, { state });
  };

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary">
      <SeoHead 
        title="Početna | Svet Građevine"
        description="Najveća platforma za građevinsku industriju u Srbiji. Poslovi, firme, majstori, mašine, smeštaj i ketering — sve na jednom mestu."
        type="website"
        jsonLd={[WEBSITE_SCHEMA, ORGANIZATION_SCHEMA]}
      />
      <HeroSection />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
      >
        <CalculatorBanner />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <UrgentJobs urgentJobs={urgentJobs} isLoading={isLoadingBff} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <PremiumJobs premiumJobs={premiumJobs} handleCardClick={handleCardClick} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <EquipmentSection latestMachines={latestMachines} latestRealEstate={latestRealEstate} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <CateringSection latestAccommodations={latestAccommodations} latestCaterings={latestCaterings} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <AboutSection 
          totalAdsCount={totalAdsCount}
          dynamicFirmsCount={dynamicFirmsCount}
          dynamicWorkersCount={dynamicWorkersCount}
          dynamicMachineryCount={dynamicMachineryCount}
          dynamicRealEstateCount={dynamicRealEstateCount}
          dynamicViewsCount={dynamicViewsCount}
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="h-px w-full bg-white/10"></div>
      </div>

      {/* New CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <CtaSection />
      </motion.div>
    </div>
  );
}
