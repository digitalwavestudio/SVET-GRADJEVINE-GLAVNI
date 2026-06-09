import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getQuotaExceeded } from '@/src/lib/errorUtils';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { RelatedSEO } from '@/src/components/RelatedSEO';
import ReportModal from '@/src/components/ReportModal';
import SeoHead from '@/src/components/SeoHead';
import { SEO } from '@/src/components/SEO';
import { APP_CONFIG } from '@/src/constants/config';
import { ENGAGEMENT_TYPES, LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { useTrackView } from '@/src/hooks/useTrackView';
import { db } from '@/src/firebase-db';
import { trackEvent } from '@/src/lib/analytics';
import { buildJobUrl, extractJobId } from '@/src/lib/seo';
import { generateJobSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { jobsService } from '@/src/modules/jobs/services/jobsService';
import { JobResponse } from '@/src/modules/jobs/types/models';
import { CanonicalLink } from '@svet-gradjevine/ui';
import { JobConditions } from '@/src/modules/jobs/components/jobs/JobConditions';
import { JobLocationMap } from '@/src/modules/jobs/components/jobs/JobLocationMap';
import { JobShareBlock } from '@/src/modules/jobs/components/jobs/JobShareBlock';
import { JobHeroSection } from '@/src/modules/jobs/components/jobs/JobHeroSection';
import { JobStatsBar } from '@/src/modules/jobs/components/jobs/JobStatsBar';
import { JobDescription } from '@/src/modules/jobs/components/jobs/JobDescription';
import { JobGallery } from '@/src/modules/jobs/components/jobs/JobGallery';
import { JobWhatWeOffer } from '@/src/modules/jobs/components/jobs/JobWhatWeOffer';
import { JobSidebar } from '@/src/modules/jobs/components/jobs/JobSidebar';
import { SimilarJobsSlider } from '@/src/modules/jobs/components/jobs/SimilarJobsSlider';
import { JobApplicationModal } from '@/src/modules/jobs/components/jobs/JobApplicationModal';
import { useJobDetails, useJobMutations, useCheckApplied, useSimilarJobs } from '@/src/modules/jobs/hooks/useJobs';
import { useFavoriteIds } from '@/src/modules/dashboard/hooks/useFavorites';
import AdminActionToolbar from '@/src/modules/dashboard/components/details/AdminActionToolbar';
import MediaGallery from '@/src/modules/core/components/details/MediaGallery';
import PropertyGrid from '@/src/modules/core/components/details/PropertyGrid';
import StickyContactCard from '@/src/modules/core/components/details/StickyContactCard';
import { StickyDetailCTABar } from '@/src/components/layout/StickyDetailCTABar';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Wallet, 
  Users, 
  GraduationCap,
  Calendar,
  Building2,
  Zap,
  CheckCircle2,
  Heart
} from 'lucide-react';

import { EntityContextLinker } from '@/src/components/seo/EntityContextLinker';

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const actualId = id ? extractJobId(id) : '';
  const { data: jobDataResult, isLoading: loading, isError } = useJobDetails(actualId);
  const jobData = jobDataResult as any;
  const { updateJob, applyToJob } = useJobMutations();

  const location = useLocation();
  const navigate = useNavigate();
  const { user, toggleSavedJob } = useAuth();

  const { startConversation } = useMessages();
  const [showAllImages, setShowAllImages] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applicationPhone, setApplicationPhone] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { data: appliedResult, refetch: refetchApplied } = useCheckApplied(actualId, user?.id || '');
  const hasApplied = !!appliedResult;
  const { data: similarJobsResult, isLoading: loadingSimilar } = useSimilarJobs(actualId, jobData?.locationSlug, jobData?.professionSlug);
  const similarJobs = (similarJobsResult as any[]) || [];
  const { isTrackedInSession } = useTrackView(!user?.isAdmin ? jobData?.id : null, 'listings', jobData?.companyId);

  useEffect(() => {
    if (user?.isAdmin && jobData) {
      console.log('[ADMIN_DEBUG] RAW JOB DATA:', jobData);
    }
  }, [user?.isAdmin, jobData]);

  const displayTitle = jobData?.title || jobData?.professionSlug || jobData?.category || 'Građevinski posao';
  const displayDescription = jobData?.description || jobData?.body || jobData?.content || jobData?.opis || 'Opis posla nije dostupan.';
  const displaySimilarJobs = similarJobs || [];
  const isOwner = user?.id === jobData?.authorId;

  const getUrgencyText = (createdAt: any) => {
    if (!createdAt) return 'Hitno';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      if (isNaN(date.getTime())) return 'Hitno';
      const days = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Danas';
      if (days <= 3) return 'Nova prilika';
      if (days <= 7) return 'Ove nedelje';
      return 'Hitno';
    } catch {
      return 'Hitno';
    }
  };

  const cleanDescription = useMemo(() => {
    if (!jobData?.description) return '';
    const clean = jobData.description.replace(/<[^>]*>?/gm, '');
    return clean;
  }, [jobData?.description]);

  const seoSchema = useMemo(() => {
    if (!jobData) return null;
    return generateJobSchema(jobData);
  }, [jobData, location.pathname]);

  const breadcrumbSchema = useMemo(() => {
    if (!jobData) return null;
    return generateBreadcrumbSchema([
      { name: "Početna", url: `${APP_CONFIG.BASE_URL}/` },
      { name: "Poslovi", url: `${APP_CONFIG.BASE_URL}/posao` },
      { name: jobData.title || 'Oglas', url: `${APP_CONFIG.BASE_URL}/posao/${jobData.id}` }
    ]);
  }, [jobData]);

  const { data: favoriteIds } = useFavoriteIds(user?.id);
  const isSaved = favoriteIds?.jobs?.includes(actualId) || false;

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    await toggleSavedJob(actualId);
  };

  const isLoggedIn = !!user;

  // Handle application submission
  const handleApplicationSubmit = async () => {
    if (!user) {
      setApplicationMessage('Morate biti prijavljeni da biste se prijavili na oglas.');
      return;
    }
    setIsApplying(true);
    try {
      await applyToJob({
        jobId: jobData.id,
        jobTitle: jobData.title || 'Oglas',
        employerId: jobData.companyId || jobData.authorId || '',
        applicantId: user.id || '',
        applicantName: user.displayName || 'Korisnik',
        applicantEmail: user.email || '',
        coverLetter: applicationMessage,
        applicantPhone: applicationPhone
      });
      setShowApplicationModal(false);
    } catch (e) {
      console.error(e);
      alert('Greška prilikom prijave na oglas. Pokušajte ponovo.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!jobData || (!user?.isAdmin && user?.id !== jobData.companyId)) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = jobData.status === 'active' ? 'inactive' : 'active';
      const updates = { status: newStatus };
      await updateJob({ id: jobData.id, updates });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
        <p className="mt-4 text-white/50 text-sm font-medium">Učitavanje oglasa...</p>
      </div>
    );
  }

  if (isError || !jobData) {
    const isQuotaError = getQuotaExceeded();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className={`material-symbols-outlined text-[64px] ${isQuotaError ? 'text-amber-500/50' : 'text-white/20'} mb-6`}>
          {isQuotaError ? 'speed' : 'work_history'}
        </span>
        <h2 className="text-2xl font-black text-white/90 mb-2">
          {isQuotaError ? 'Sistem je pod neverovatnim opterećenjem' : (isError ? 'Greška pri učitavanju' : 'Oglas Nije Pronađen')}
        </h2>
        <p className="text-white/50 text-sm max-w-md text-center mb-8">
          {isQuotaError 
            ? 'Ograničen mod je aktivan zbog velikog broja korisnika. Pokušajte ponovo za koji trenutak.' 
            : (isError 
              ? 'Došlo je do greške prilikom preuzimanja podataka o oglasu. Moguće je da su podaci neispravni.' 
              : 'Ovaj oglas je verovatno istekao, obrisan od strane poslodavca, ili link koji ste otvorili nije validan.')}
        </p>
        <Link to="/poslovi" className={UI_TOKENS.BTN_PRIMARY}>NAZAD NA POSLOVE</Link>
      </div>
    );
  }

  const handleStartChat = async () => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    const convId = await startConversation(jobData.companyId || jobData.authorId, {
      id: jobData.id,
      type: 'Posao',
      title: jobData.title
    }, `Poštovani, javljam se povodom vašeg oglasa za posao "${jobData.title}".\n\nMožete li mi dati više informacija o uslovima?`);
    if (convId) {
      navigate(`/poruke/${convId}`);
    }
  };
  const handleApply = () => setShowApplicationModal(true);

  return (
    <div className="min-h-screen bg-background font-sans">
      <SeoHead
        title={user?.isAdmin ? `${displayTitle} (MODERACIJA) - Svet Građevine` : `${displayTitle} ${jobData.location ? `- ${jobData.location}` : ''} - Svet Građevine`}
        description={cleanDescription.substring(0, 160)}
        image={jobData?.companyLogo || APP_CONFIG.OG_IMAGE_DEFAULT}
        url={buildJobUrl(jobData)}
        type="job"
        jsonLd={[seoSchema, breadcrumbSchema].filter(Boolean)}
      />

      {/* COMMAND CENTER - HIGH END ADMIN MODERATION */}
      {user?.isAdmin && (
        <div className="bg-slate-900 border-b border-white/5 py-12 relative overflow-hidden">
           {/* Cyberpunk grid background effect */}
           <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           
           <div className="max-w-7xl mx-auto px-8 relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-white/5 p-10 rounded-[10px] border border-white/10 backdrop-blur-3xl shadow-2xl">
                 <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[10px] bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20 animate-pulse">
                       <Zap size={32} />
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">ADMIN COMMAND CENTER</span>
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           jobData.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 
                           jobData.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'
                         }`}>
                           {jobData.status?.toUpperCase() || 'UNSET'}
                         </span>
                       </div>
                       <h2 className="text-3xl font-black text-white tracking-tight uppercase">UPRAVLJANJE OGLASOM</h2>
                       <p className="text-sm font-bold text-white/40 uppercase tracking-widest">
                         PROVERI PODATKE I ODREDI STATUS OGLASA PRE OBJAVLJIVANJA
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    {jobData.status === 'pending' && (
                      <>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            if (confirm('Odobriti oglas?')) {
                               await updateJob({ id: jobData.id, updates: { status: 'active' } });
                               alert('Oglas je sada aktivan.');
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-16 px-10 rounded-[10px] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3"
                        >
                          <CheckCircle2 size={18} />
                          ODOBRI OGLAS
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            const reason = prompt('Razlog odbijanja oglas:');
                            if (reason !== null) {
                               await updateJob({ id: jobData.id, updates: { status: 'rejected', rejectionReason: reason } as Partial<JobResponse> & { rejectionReason: string } });
                               alert('Oglas je odbijen.');
                               navigate('/admin');
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 h-16 px-10 rounded-[10px] text-sm font-black uppercase tracking-widest transition-all flex items-center gap-3"
                        >
                          ODBIJ OGLAS
                        </motion.button>
                      </>
                    )}
                    {jobData.status === 'active' && (
                       <motion.button 
                         whileTap={{ scale: 0.95 }}
                         onClick={() => updateJob({ id: jobData.id, updates: { status: 'pending' } })}
                         className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-16 px-10 rounded-[10px] text-sm font-black uppercase tracking-widest transition-all"
                       >
                         VRATI NA ČEKANJE
                       </motion.button>
                    )}
                    <div className="w-px h-12 bg-white/10 mx-2" />
                    <button onClick={() => navigate('/admin')} className="text-xs font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-colors">
                      Zatvori
                    </button>
                 </div>
              </div>

              {/* Technical Metadata Bar */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 px-10">
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">ID OGLASA</span>
                    <p className="text-[11px] font-mono text-secondary break-all">{jobData.id}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">OGLAŠAVAČ ID</span>
                    <p className="text-[11px] font-mono text-white/60 break-all">{jobData.authorId || jobData.companyId}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">EMAIL ADRESA</span>
                    <p className="text-[11px] font-bold text-white uppercase">{jobData.email || jobData.applicationEmail || 'Nije uneto'}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">TELEFON</span>
                    <p className="text-xl font-black text-secondary">{jobData.phone || jobData.applicationPhone || 'Nije uneto'}</p>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* Breadcrumbs - visually hidden but kept for SEO via component */}
      <Breadcrumbs items={[
        { label: 'Poslovi', path: '/poslovi' },
        ...(jobData.locationSlug ? [{ label: jobData.location, path: `/poslovi/${jobData.locationSlug}` }] : []),
        ...(jobData.professionSlug ? [{ label: jobData.professionSlug.replace(/-/g, ' '), path: `/poslovi/${jobData.professionSlug}${jobData.locationSlug ? `/${jobData.locationSlug}` : ''}` }] : []),
        { label: displayTitle, path: `/posao/${jobData?.id}` }
      ]} />

      {/* Admin Info Summary (Samo za admina) */}
      {user?.isAdmin && (
        <div className="max-w-7xl mx-auto px-8 mb-8">
           <div className="bg-white/5 border border-white/10 rounded-[10px] p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">POŠILJALAC (ID)</span>
                <p className="text-sm font-mono text-secondary break-all">{jobData.authorId || jobData.companyId}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">TIP KATEGORIJE</span>
                <p className="text-sm font-bold text-white uppercase">{jobData.type || 'Nije definisano'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">DATUM KREIRANJA</span>
                <p className="text-sm font-bold text-white tracking-widest">
                   {jobData.createdAt?.toDate ? jobData.createdAt.toDate().toLocaleString() : 'Nema datuma'}
                </p>
              </div>
              <div className="space-y-1 text-right">
                 <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">PREGLEDI</span>
                 <p className="text-2xl font-black text-secondary">{jobData.viewsCount || 0}</p>
              </div>
           </div>
        </div>
      )}

      {/* Header Bento */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 lg:mt-8 mb-8 lg:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {jobData.isPremium && (
              <span className="bg-secondary text-slate-950 px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-secondary/20">
                ★ PREMIUM POSAO
              </span>
            )}
            <span className="px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest border bg-secondary/10 text-secondary border-secondary/30">
              {jobData.tipAngazmana?.toUpperCase() || 'PUNO RADNO VREME'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 id="job-title" className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-white">
              {displayTitle}
            </h1>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleFavorite}
              className={`shrink-0 w-16 h-16 rounded-[10px] flex items-center justify-center border transition-all duration-300 ${
                isSaved 
                  ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/20' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSaved ? 'saved' : 'unsaved'}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 15
                  }}
                >
                  <Heart fill={isSaved ? "currentColor" : "none"} size={28} />
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
          <div className="flex items-center gap-4 text-secondary font-bold text-xs uppercase tracking-widest" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
            {jobData.companyId ? (
              <Link to={`/firma/${jobData.companyId}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Building2 size={14} aria-hidden="true" />
                <span itemProp="name">{jobData.companyName || 'Privatni Poslodavac'}</span>
              </Link>
            ) : (
              <span className="flex items-center gap-2">
                <Building2 size={14} aria-hidden="true" />
                <span itemProp="name">{jobData.companyName || 'Privatni Poslodavac'}</span>
              </span>
            )}
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span itemProp="jobLocation" itemScope itemType="https://schema.org/Place" className="flex items-center gap-2">
              <MapPin size={14} aria-hidden="true" />
              <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress"><span itemProp="addressLocality">{jobData.location}</span></span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12" itemScope itemType="https://schema.org/JobPosting">
        <span hidden itemProp="title">{displayTitle}</span>
        <span hidden itemProp="datePosted">{jobData.createdAt?.toDate ? jobData.createdAt.toDate().toISOString() : new Date().toISOString()}</span>
        <article className="lg:col-span-8 space-y-16" aria-labelledby="job-title">
          {/* Gallery Bento */}
          <MediaGallery images={jobData.images || []} title={displayTitle} imageStatus={jobData.imageStatus} />

          {/* Quick Metrics Grid */}
          <PropertyGrid 
            items={[
              { icon: Wallet, label: 'Plata/Satnica', value: jobData.plataMin ? `${jobData.plataMin} - ${jobData.plataMax} EUR` : 'Po dogovoru', highlight: true },
              { icon: Clock, label: 'Iskustvo', value: jobData.iskustvo || 'Bez iskustva' },
              { icon: Briefcase, label: 'Sektor', value: jobData.sector },
              { icon: GraduationCap, label: 'Obrazovanje', value: jobData.education || 'Nije uslov' },
              { icon: Users, label: 'Broj izvršilaca', value: jobData.positionsCount || 1 },
              { icon: Calendar, label: 'Objavljeno', value: getUrgencyText(jobData.createdAt) }
            ]}
          />

          <section className="space-y-8" aria-labelledby="section-description">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[10px] bg-secondary/10 flex items-center justify-center text-secondary">
                <Briefcase size={20} />
              </div>
              <h2 id="section-description" className="text-2xl font-black uppercase tracking-tight text-white">Opis Posla</h2>
            </div>
            <div itemProp="description" className="text-lg text-white/60 leading-relaxed font-medium whitespace-pre-wrap bg-white/5 p-10 rounded-[10px] border border-white/5">
              {displayDescription || 'Nema unetog opisa za ovaj oglas.'}
            </div>

            <EntityContextLinker entityType="job" entityData={jobData} />
          </section>

          {/* AI BLUEPRINT: STRUKTURIRANI PODACI ZA LLM / SEO */}
          <article id="ai-blueprint" className="bg-white/5 border border-white/10 rounded-[10px] p-10 space-y-12" itemScope itemType="https://schema.org/JobPosting">
            <header className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-12 h-12 rounded-[10px] bg-secondary/10 flex items-center justify-center text-secondary">
                <Users size={20} />
              </div>
              <h2 id="section-details" className="text-2xl font-black uppercase tracking-tight text-white">Detalji Pozicije (Fact-Sheet)</h2>
            </header>
            
            <section>
              <h3 className="sr-only">Osnovne Informacije o Poslu</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Karakteristika</th>
                      <th scope="col">Vrednost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { label: 'Tip angažmana', value: jobData.tipAngazmana || jobData.engagementSlug, prop: 'employmentType' },
                      { label: 'Radno iskustvo', value: jobData.iskustvo || jobData.experienceSlug, prop: 'experienceRequirements' },
                      { label: 'Sektor / Kategorija', value: jobData.sector || jobData.sectorSlug, prop: 'occupationalCategory' },
                      { label: 'Profesija', value: jobData.professionSlug, prop: 'title' },
                      { label: 'Plata', value: jobData.plataMin ? `${jobData.plataMin} - ${jobData.plataMax} EUR` : jobData.salary, prop: 'baseSalary' },
                    ].filter(f => f.value).map((f, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <th scope="row" className="py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] w-1/3">
                          {f.label}
                        </th>
                        <td className="py-4 text-sm font-bold text-white uppercase" itemProp={f.prop}>
                          {f.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6">Kontakt i Lokacija</h3>
              <address className="not-italic">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-white/5">
                      <th className="py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] w-1/3">Lokacija</th>
                      <td className="py-4 text-sm font-bold text-white uppercase" itemProp="jobLocation">{jobData.location}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <th className="py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Telefon</th>
                      <td className="py-4 text-sm font-bold text-white uppercase">
                        <a href={`tel:${jobData.phone || jobData.telefon}`} className="hover:text-secondary transition-colors" itemProp="telephone">
                          {jobData.phone || jobData.telefon || 'Nije uneto'}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <th className="py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Email</th>
                      <td className="py-4 text-sm font-bold text-white uppercase">
                        <a href={`mailto:${jobData.email || jobData.applicationEmail}`} className="hover:text-secondary transition-colors" itemProp="email">
                          {jobData.email || jobData.applicationEmail || 'Nije uneto'}
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </address>
            </section>
          </article>

          {jobData.whatWeOffer && (
             <section className="space-y-8" aria-labelledby="section-offer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Zap size={20} />
                </div>
                <h2 id="section-offer" className="text-2xl font-black uppercase tracking-tight text-white">Šta Nudimo</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Array.isArray(jobData.whatWeOffer) ? jobData.whatWeOffer : [jobData.whatWeOffer]).map((offer: string, i: number) => (
                  <div key={i} className="p-6 bg-surface-container-highest/30 border border-outline-variant/10 rounded-[10px] flex items-center gap-4">
                    <CheckCircle2 className="text-emerald-500" size={18} />
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{offer}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="lg:col-span-4" aria-label="Kontakt i prijava">
          <StickyContactCard 
            phone={jobData.phone || jobData.applicationPhone}
            email={jobData.email || jobData.applicationEmail}
            authorName={jobData.companyName || jobData.authorName}
            isVerified={true}
            avatar={jobData.companyLogo}
            profileUrl={jobData.companyId ? `/firma/${jobData.companyId}` : undefined}
            onMessage={handleStartChat}
          />

          {/* Application Specific Widget */}
          {!hasApplied && !isOwner && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApply}
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-white py-6 rounded-[10px] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-3"
            >
              PRIJAVI SE NA OGLAS
            </motion.button>
          )}
          {hasApplied && (
            <div className="w-full mt-6 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 py-6 rounded-[10px] font-black text-sm uppercase tracking-widest text-center">
              PRIJAVA POSLATA
            </div>
          )}
        </aside>
      </main>

      <SimilarJobsSlider 
        jobData={jobData} 
        displaySimilarJobs={displaySimilarJobs} 
        buildJobUrl={buildJobUrl} 
      />

      <JobApplicationModal 
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSubmit={handleApplicationSubmit}
        applicationMessage={applicationMessage}
        setApplicationMessage={setApplicationMessage}
        applicationPhone={applicationPhone}
        setApplicationPhone={setApplicationPhone}
        isApplying={isApplying}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={jobData?.id}
        targetType="JOB"
        targetName={displayTitle}
      />

      <StickyDetailCTABar
        phone={jobData.phone || jobData.applicationPhone || ''}
        onMessage={handleStartChat}
        price={jobData.plataMin ? `${jobData.plataMin}-${jobData.plataMax}` : undefined}
        currency="EUR"
        priceLabel="PLATA"
        ctaText={!hasApplied && !isOwner ? "PRIJAVI SE" : hasApplied ? "PRIJAVLJEN" : undefined}
        onCtaClick={!hasApplied && !isOwner ? handleApply : undefined}
      />
    </div>
  );
}
