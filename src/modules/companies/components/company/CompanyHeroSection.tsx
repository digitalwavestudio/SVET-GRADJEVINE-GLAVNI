import { OptimizedImage } from '@/src/components/OptimizedImage';
import { motion } from 'motion/react';

interface CompanyHeroSectionProps {
  company: any;
}

export function CompanyHeroSection({ company }: CompanyHeroSectionProps) {
  return (
    <section className="relative max-w-7xl mx-auto w-full h-[35vh] md:h-[55vh] min-h-[180px] md:min-h-[450px] overflow-hidden rounded-b-[10px]">
      {/* Cover slika */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        {company.coverImage ? (
          <OptimizedImage 
            src={company.coverImage} 
            fallbackType="default" 
            alt={company.name || "Cover slika"} 
            className="w-full h-full object-cover" 
            containerClassName="w-full h-full"
          /> 
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a111a] via-[#111a24] to-[#1a2533]"></div>
        )}
      </motion.div>
    </section>
  );
}
