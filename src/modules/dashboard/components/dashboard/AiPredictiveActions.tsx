import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useDashboardMetrics } from '@/src/modules/dashboard/hooks/useDashboardStats';

interface AiPredictiveActionsProps {
  user: any;
}

export default function AiPredictiveActions({ user }: AiPredictiveActionsProps) {
  const { data } = useDashboardMetrics();
  const roleData = (data as any as {
    pendingApplications?: number;
    totalAds?: number;
    smartMatches?: { id: string; matchRate: number }[];
  }) || {};
  const actions = useMemo(() => {
    if (!user) return [];
    
    const items = [];
    
    // Pametne akcije za Poslodavce
    if (user.role === 'poslodavac') {
        const pendingValue = roleData?.pendingApplications ?? 0;
        if (pendingValue > 0) {
            items.push({
                id: 'pending_app',
                title: 'Nove prijave',
                subtitle: `Imate ${pendingValue} neobrađenih prijava`,
                icon: 'group_add',
                color: 'text-[#ffad3a]',
                bg: 'bg-[#ffad3a]/10',
                border: 'border-[#ffad3a]/20',
                link: '/komandni-centar',
                cta: 'PREGLEDAJ'
            });
        }
        if (!user.businessProfile?.logo || !user.company) {
            items.push({
                id: 'complete_profile',
                title: 'Profil kompanije',
                subtitle: 'Popunite podatke za 2x više prijava',
                icon: 'storefront',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
                border: 'border-blue-400/20',
                link: '/moj-profil/podesavanja',
                cta: 'AŽURIRAJ'
            });
        }
        if (roleData?.totalAds === 0) {
            items.push({
                id: 'first_ad',
                title: 'Zapošljavajte odmah',
                subtitle: 'Nema aktivnih oglasa. Kreirajte novi.',
                icon: 'campaign',
                color: 'text-green-400',
                bg: 'bg-green-400/10',
                border: 'border-green-400/20',
                link: '/postavi-oglas',
                cta: 'NOVI OGLAS'
            });
        }
    }
    
    // Pametne akcije za Majstore / Radnike
    if (user.role === 'majstor' || user.role === 'radnik') {
        if (!user.hasCV && !user.profession) {
            items.push({
                id: 'cv_missing',
                title: 'Prednost pri odabiru',
                subtitle: 'Kandidati sa radnom biografijom se brže zapošljavaju',
                icon: 'badge',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
                border: 'border-purple-400/20',
                link: '/moj-profil/podesavanja',
                cta: 'DODAJ CV'
            });
        }
        if (roleData?.smartMatches && roleData.smartMatches.length > 0) {
             items.push({
                id: 'smart_match_urgent',
                title: 'Idealna prilika',
                subtitle: `Pronašli smo posao za vas sa ${~~roleData.smartMatches[0].matchRate}% poklapanja`,
                icon: 'radar',
                color: 'text-green-400',
                bg: 'bg-green-400/10',
                border: 'border-green-400/20',
                link: `/poslovi/${roleData.smartMatches[0].id}`,
                cta: 'APLICIRAJ'
            });
        }
    }

    if (items.length === 0) {
         items.push({
             id: 'explore_market',
             title: 'Tržište je aktivno',
             subtitle: 'Pogledajte nove trendove i cene u vašoj industriji',
             icon: 'trending_up',
             color: 'text-blue-400',
             bg: 'bg-blue-400/10',
             border: 'border-blue-400/20',
             link: '/vesti',
             cta: 'ISTRAŽI'
         });
    }

    return items.slice(0, 3); // max 3 actions
  }, [user, roleData]);

  if (actions.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
         <span className="material-symbols-outlined text-sm text-secondary animate-pulse">auto_awesome</span>
         PAMETNI PREDLOZI ZA VAS
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, i) => (
            <motion.div
              key={action.id || `action-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className={`bg-[#0A0F14] border ${action.border} p-6 rounded-[10px] hover:scale-[1.02] transition-transform flex flex-col justify-between group overflow-hidden relative min-h-[168px]`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.05] to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="flex gap-4 mb-6">
                <div className={`w-12 h-12 rounded-[10px] ${action.bg} flex items-center justify-center shrink-0`}>
                   <span className={`material-symbols-outlined ${action.color} text-2xl group-hover:scale-110 transition-transform`}>{action.icon}</span>
                </div>
                <div>
                   <h4 className="text-white font-black uppercase tracking-tight">{action.title}</h4>
                   <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1 line-clamp-2">{action.subtitle}</p>
                </div>
              </div>
              <Link to={action.link} className={`w-full py-3 rounded-[10px] ${action.bg} ${action.color} text-[10px] font-black uppercase tracking-widest text-center hover:brightness-110 transition-all`}>
                  {action.cta}
              </Link>
            </motion.div>
        ))}
      </div>
    </div>
  );
}
