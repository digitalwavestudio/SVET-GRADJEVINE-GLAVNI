import { OptimizedImage } from '@/src/components/OptimizedImage';
import { VerticalCTA } from '@/src/components/VerticalCTA';
import { HardHat } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import NoResults from '@/src/components/ui/NoResults';
import Spinner from '@/src/components/ui/Spinner';
import { LOCATIONS, PROFESSIONS } from '@/src/constants/taxonomy';
import { useMastersList } from '@/src/modules/masters/hooks/useMasters';
import withSEOAndFilters from '@/src/hoc/withSEOAndFilters';
import { usePrefetch } from '@/src/hooks/usePrefetch';
import { AiSearchBar } from '@/src/components/AiSearchBar';
import { resolveRouteFilters } from '@/src/lib/routeFilters';
import { generateProfessionalServiceListSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { useCount } from '@/src/hooks/useCollectionStats';

function MastersPage() {
  const prefetch = usePrefetch();
  const params = useParams();

  const resolved = resolveRouteFilters('majstori', params);
  const gradSlug = resolved.locationSlug;
  const zanimanjeSlug = resolved.professionSlug;
  const { data: masterCount } = useCount('masters');

  const activeFilters = useMemo(() => ({
    profession: zanimanjeSlug || undefined,
    location: gradSlug || undefined,
  }), [gradSlug, zanimanjeSlug]);

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useMastersList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const masters = useMemo(() => data?.pages.flatMap(page => page?.docs || []) || [], [data]);

  const locName = gradSlug ? LOCATIONS.find(l => l.slug === gradSlug)?.name : '';
  const profName = zanimanjeSlug ? [...Object.values(PROFESSIONS)].flat().find(p => p.slug === zanimanjeSlug)?.name : '';
  const itemListSchema = useMemo(() => generateProfessionalServiceListSchema(
    masters.slice(0, 20).map((m: any) => ({
      name: m.name || m.title,
      url: `${APP_CONFIG.BASE_URL}/majstori/${m.id}`,
      description: m.description,
      image: m.photo || m.avatar
    })),
    {
      name: `Majstori ${profName ? `- ${profName}` : ''} ${locName ? `u mestu ${locName}` : ''}`,
      description: `Baza majstora za građevinske radove ${locName ? `iz mesta ${locName}` : 'širom Srbije'}.`,
      url: `${APP_CONFIG.BASE_URL}/majstori${zanimanjeSlug ? `/${zanimanjeSlug}` : ''}${gradSlug ? `/${gradSlug}` : ''}`,
    }
  ), [masters, locName, profName, gradSlug, zanimanjeSlug]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen">
      <StandardPageHero
        badge="BAZA MAJSTORA"
        title="GRAĐEVINSKI"
        titleAccent="MAJSTORI"
        subtitle="Baza verifikovanih profesionalaca, majstora i ekipa za sve vrste građevinskih radova u Srbiji."
        stats={[
          { label: "Majstora u bazi", value: masterCount?.toLocaleString() || "2.8K+", icon: "verified" },
          { label: "Aktivnih profila", value: masters.length?.toLocaleString() || "0", icon: "engineering" },
          { label: "Premium", value: masters.filter((m: any) => m.isPremiumProfile)?.length?.toLocaleString() || "0", icon: "category" }
        ]}
      >
        <div className="mt-8 flex flex-col gap-4 max-w-4xl w-full">
          <AiSearchBar vertical="masters" />
        </div>
      </StandardPageHero>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {loading && masters.length === 0 ? (
          <ListingSkeleton count={6} viewMode="grid" />
        ) : masters.length === 0 ? (
          <NoResults message="Nije pronađen nijedan majstor." icon="engineering" />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {masters.map((master: any, idx: number) => (
                <motion.div
                  key={master.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group relative flex flex-col h-full bg-gradient-to-br from-[#111A22] to-[#050B10] border border-white/5 rounded-[10px] overflow-hidden transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_15px_40px_-10px_rgba(254,191,13,0.15)] hover:-translate-y-1"
                >
                  <div className="relative h-24 md:h-36 w-full overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-tr from-[#0F1720] to-[#182330]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050B10] via-[#050B10]/40 to-transparent opacity-90"></div>
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      {master.isPremiumProfile && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-secondary to-yellow-400 !text-black px-2 py-0.5 rounded-[10px] text-[8px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(254,191,13,0.3)] transform transition-transform group-hover:scale-105">
                          <span className="material-symbols-outlined text-[10px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                          PLAĆENI OGLAS
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute left-4 top-24 md:top-36 -translate-y-1/2 w-16 h-16 md:w-[80px] md:h-[80px] bg-white rounded-full flex items-center justify-center p-1.5 md:p-2 shadow-[0_8px_25px_rgba(0,0,0,0.5)] border-4 border-[#050B10] group-hover:border-secondary/20 transition-all duration-500 z-20 overflow-hidden">
                    {master.photo ? (
                      <OptimizedImage src={master.photo} alt={master.name} className="w-full h-full object-contain rounded-full" containerClassName="w-full h-full" />
                    ) : (
                      <span className="!text-black font-black text-2xl opacity-20">{master.name?.charAt(0) || 'M'}</span>
                    )}
                  </div>

                  <div className="relative px-4 pb-4 flex-grow flex flex-col pt-8 md:pt-11 z-10">
                    <div className="flex items-start justify-between gap-2 mb-0">
                      <div className="flex-1 min-w-0">
                        <Link onMouseEnter={() => prefetch('master', master.id)} to={`/majstori/profil/${master.id}`} className="block group/link">
                          <h3 className="text-xl font-black font-headline text-white uppercase tracking-tight group-hover/link:text-secondary transition-colors truncate">{master.name}</h3>
                        </Link>
                      </div>
                      {master.verified && (
                        <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mt-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Verifikovan
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 my-1">
                      {master.profession && (
                        <span className="text-[11px] font-bold text-secondary tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px] text-white/40">work</span>
                          {master.profession}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-white/40 tracking-wider flex items-center gap-1 ml-auto">
                        <span className="material-symbols-outlined text-[10px] text-white/40">location_on</span>
                        {master.location || 'Nije navedeno'}
                      </span>
                    </div>

                    <div className="border-t border-white/5 my-2"></div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-sm">
                      {master.experience && (
                        <span className="flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[11px] text-white/40">history</span>
                          <span className="text-white/60">{master.experience}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-white/50 text-[13px] mb-3 line-clamp-5 leading-relaxed font-medium flex-grow">{master.description || ''}</p>
                    <div className="pt-3 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(master.skills) && master.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="bg-secondary/10 border border-secondary/20 text-secondary px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-[0.12em]">
                            {s}
                          </span>
                        ))}
                      </div>
                      <Link onMouseEnter={() => prefetch('master', master.id)} to={`/majstori/profil/${master.id}`} className="w-full bg-gradient-to-r from-secondary/20 to-secondary/10 hover:from-secondary hover:to-yellow-400 text-secondary hover:!text-black border border-secondary/20 hover:border-secondary transition-all px-4 py-2.5 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group/btn">
                        <span>Pogledaj profil</span>
                        <span className="material-symbols-outlined text-[12px] transition-transform duration-300 group-hover/btn:translate-x-1">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-col justify-center mt-12 gap-4 items-center">
              {isDeepPagingLimitReached && (
                <div className="w-full">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-center max-w-lg mx-auto">
                    <p className="text-xs text-red-400 font-bold">
                      Dosegli ste limit listanja.
                    </p>
                  </div>
                </div>
              )}
              {hasMore && (
                <button onClick={() => loadMore()} disabled={loading} className="bg-secondary flex items-center gap-2 !text-black font-black px-8 py-4 rounded-md text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50">
                  {loading && <Spinner className="w-4 h-4" />}
                  {loading ? 'UČITAVANJE...' : 'Učitaj još'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-16">
          <VerticalCTA title="MAJSTOR STE?" description="REGISTRUJTE SVOJ PROFIL, POKAŽITE SVOJE RADOVE I DOBIJTE PONUDE ZA RAD NA NAJVEĆIM GRADILIŠTIMA." buttonText="KREIRAJ PROFIL" buttonLink="/postavi-oglas" icon={HardHat} />
        </div>
      </section>
    </div>
  );
}

export default withSEOAndFilters(MastersPage, 'majstori');
