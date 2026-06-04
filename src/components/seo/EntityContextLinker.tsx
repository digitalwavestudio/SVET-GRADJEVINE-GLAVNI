import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobsService } from '@/src/modules/jobs/services/jobsService';
import { Building2, Briefcase, Wrench, Bed, Utensils, Tractor } from 'lucide-react';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export interface EntityData {
  id?: string;
  companyId?: string;
  comp?: string;
  lokacija?: string;
  grad?: string;
  city?: string;
  location?: string;
  description?: string;
  opis?: string;
}

interface EntityContextLinkerProps {
  entityType: 'job' | 'company' | 'machine' | 'accommodation' | 'catering' | 'plot' | 'marketplace' | 'master';
  entityData: EntityData | null | undefined;
}

export const EntityContextLinker: React.FC<EntityContextLinkerProps> = ({ entityType, entityData }) => {
  // Fetch related company jobs if we have a company ID and it's a job or company
  const compId = entityData?.companyId || entityData?.comp || (entityType === 'company' ? entityData?.id : null);
  
  const { data: relatedJobsCount } = useQuery({
    queryKey: ['entity-linker-jobs', compId],
    queryFn: async () => {
      if (!compId) return 0;
      const jobs = await jobsService.fetchByCompany(compId);
      return jobs.filter(d => d.id !== entityData?.id).length;
    },
    enabled: !!compId,
  });

  const city = entityData?.lokacija || entityData?.grad || entityData?.city || entityData?.location;
  const safeCity = city ? slugify(city) : '';

  // Generate semantically related links (Cross-Vertical Links)
  const crossLinks = [];

  if (city) {
    if (entityType === 'job' || entityType === 'company' || entityType === 'master') {
      crossLinks.push({
        label: `Smeštaj za radnike ${city}`,
        url: `/smestaj/lokacija/${safeCity}`,
        icon: <Bed className="w-4 h-4" />
      });
      crossLinks.push({
        label: `Ketering usluge ${city}`,
        url: `/ketering/${safeCity}`,
        icon: <Utensils className="w-4 h-4" />
      });
      crossLinks.push({
        label: `Iznajmljivanje alata ${city}`,
        url: `/alat-i-oprema/lokacija/${safeCity}`,
        icon: <Wrench className="w-4 h-4" />
      });
    }

    if (entityType === 'machine' || entityType === 'marketplace' || entityType === 'plot') {
      crossLinks.push({
        label: `Građevinske firme ${city}`,
        url: `/firme/${safeCity}`,
        icon: <Building2 className="w-4 h-4" />
      });
      crossLinks.push({
        label: `Majstori ${city}`,
        url: `/majstori/${safeCity}`,
        icon: <Briefcase className="w-4 h-4" />
      });
    }
  }

  // Related machines by keyword text extraction (Naive NLP for UI demonstration mostly)
  const desc = (entityData?.description || entityData?.opis || '').toLowerCase();
  if (desc.includes('bager') || desc.includes('cat') || desc.includes('jcb')) {
    crossLinks.push({
      label: 'Povezano: Bageri (Najam/Kupovina)',
      url: '/masine/bageri',
      icon: <Tractor className="w-4 h-4" />
    });
  }

  if (desc.includes('skele') || desc.includes('skela')) {
    crossLinks.push({
      label: 'Povezano: Građevinske skele',
      url: '/alat-i-oprema/skele',
      icon: <Wrench className="w-4 h-4" />
    });
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-[10px] p-6 shadow-sm mb-6 mt-6">
      <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-secondary" />
        Srodni Entiteti na mrežnom čvorištu
      </h3>
      
      <div className="space-y-4">
        {!!relatedJobsCount && relatedJobsCount > 0 && compId && (
          <div className="text-sm font-bold text-white/80 bg-secondary/10 p-4 rounded-[10px] border border-secondary/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Ova kompanija traži još{' '}
            <Link to={`/firma/${compId}`} className="font-black text-secondary hover:underline uppercase mx-1">
              {relatedJobsCount} {relatedJobsCount === 1 ? 'radnika' : 'radnika'}
            </Link>
          </div>
        )}

        {crossLinks.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {crossLinks.map((link, idx) => (
              <li key={idx}>
                <Link
                  to={link.url}
                  className="flex items-center gap-3 p-3 text-sm text-white/50 hover:text-secondary hover:bg-white/5 hover:border-secondary/30 rounded-[10px] border border-white/5 transition-all w-full"
                >
                  <span className="text-secondary/50">{link.icon}</span>
                  <span className="font-semibold uppercase tracking-wider text-[11px]">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
