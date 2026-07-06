import React, { ReactNode } from 'react';
import DynamicSEO from '@/src/components/DynamicSEO';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { UnifiedFilterBar, UnifiedFilterBarProps } from './UnifiedFilterBar';

interface BaseNichePageProps {
  seoType: "poslovi" | "masine" | "smestaj" | "ketering" | "placevi" | "firme" | "majstori" | "alat-i-oprema" | "berza";
  grad?: string;
  zanimanje?: string;
  jsonLd?: any[];
  itemCount?: number;
  
  heroBadge: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroBackgroundImage?: string;
  heroStats: { label: string; value: string | number; icon: string }[];
  heroChildren?: ReactNode;
  
  filterConfig?: UnifiedFilterBarProps;
  
  children: ReactNode;
}

export const BaseNichePage: React.FC<BaseNichePageProps> = ({
  seoType, grad, zanimanje, jsonLd, itemCount,
  heroBadge, heroTitle, heroTitleAccent, heroSubtitle, heroBackgroundImage, heroStats, heroChildren,
  filterConfig,
  children
}) => {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen flex flex-col">
      <DynamicSEO type={seoType} grad={grad} zanimanje={zanimanje} jsonLd={jsonLd} itemCount={itemCount} />
      
      <StandardPageHero
        badge={heroBadge}
        title={heroTitle}
        titleAccent={heroTitleAccent}
        subtitle={heroSubtitle}
        backgroundImage={heroBackgroundImage}
        stats={heroStats}
      >
        {heroChildren}
      </StandardPageHero>

      {filterConfig && (
        <section className="bg-surface/90 backdrop-blur-3xl relative z-40 border-y border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <UnifiedFilterBar {...filterConfig} />
          </div>
        </section>
      )}

      <main className="flex-1">
        {children}
      </main>

    </div>
  );
};
