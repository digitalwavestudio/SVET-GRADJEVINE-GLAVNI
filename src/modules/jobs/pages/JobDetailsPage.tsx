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
import { ENGAGEMENT_TYPES, LOCATIONS, EXPERIENCE_LEVELS, PAYMENT_DYNAMICS } from '@/src/constants/taxonomy';
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
import { useJobDetails, useJobMutations, useCheckApplied, useSimilarJobs, useJobs } from '@/src/modules/jobs/hooks/useJobs';
import '@/src/modules/jobs/styles/similarJobs.css';
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
  Heart,
  Phone,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import Avatar from '@/src/components/ui/Avatar';

import { EntityContextLinker } from '@/src/components/seo/EntityContextLinker';

const getEngagementLabel = (slug?: string, customVal?: string) => {
  if (slug === 'upisi') return customVal || 'Radno vreme';
  const item = ENGAGEMENT_TYPES.find(t => t.slug === slug);
  return item ? item.name : (slug ? slug.replace(/-/g, ' ') : 'Puno radno vreme');
};

const getExperienceLabel = (slug?: string) => {
  const item = EXPERIENCE_LEVELS.find(t => t.slug === slug);
  return item ? item.name : (slug ? slug.replace(/-/g, ' ') : 'Nije navedeno');
};

const getPaymentDynamicsLabel = (slug?: string) => {
  const item = PAYMENT_DYNAMICS.find(t => t.slug === slug);
  return item ? item.name : (slug ? slug.replace(/-/g, ' ') : 'Po dogovoru');
};

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [showPhone, setShowPhone] = useState(false);
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

  // Fetch all jobs as fallback for similar jobs slider
  const { data: allJobsResult, isLoading: loadingAllJobs } = useJobs({});
  const allJobs = allJobsResult?.pages?.flatMap(p => (p as any).items) || [];
  const fallbackJobs = allJobs.slice(0, 8);
  const displaySimilarJobs = similarJobs.length > 0 ? similarJobs : fallbackJobs;
  
  const { isTrackedInSession } = useTrackView(!user?.isAdmin ? jobData?.id : null, 'listings', jobData?.companyId);

  useEffect(() => {
    if (user?.isAdmin && jobData) {
      console.log('[ADMIN_DEBUG] RAW JOB DATA:', jobData);
    }
  }, [user?.isAdmin, jobData]);

  const displayTitle = jobData?.title || jobData?.professionSlug || jobData?.category || 'Građevinski posao';
  const displayDescription = jobData?.description || jobData?.body || jobData?.content || jobData?.opis || 'Opis posla nije dostupan.';

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
    <div className="min-h-screen bg-[#070B0F] font-sans text-white selection:bg-secondary selection:text-slate-950">
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
        <div className="bg-[#0D151D] border-b border-white/5 py-12 relative overflow-hidden">
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
      
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <Breadcrumbs items={[
          { label: 'Poslovi', path: '/poslovi' },
          ...(jobData.locationSlug ? [{ label: jobData.location, path: `/poslovi/${jobData.locationSlug}` }] : []),
          ...(jobData.professionSlug ? [{ label: jobData.professionSlug.replace(/-/g, ' '), path: `/poslovi/${jobData.professionSlug}${jobData.locationSlug ? `/${jobData.locationSlug}` : ''}` }] : []),
          { label: displayTitle, path: `/posao/${jobData?.id}` }
        ]} />
      </div>

      {/* Header Premium Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-12">
        <div className="bg-gradient-to-br from-[#0D141C] to-[#080D12] border border-white/5 rounded-[20px] p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
          {/* Neon orange accent line */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-secondary via-amber-500 to-transparent"></div>
          {/* Subtle backglow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:items-center">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {jobData.isPremium && (
                  <span className="bg-secondary text-slate-950 px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-secondary/20">
                    ★ PREMIUM POSAO
                  </span>
                )}
                {jobData.isUrgent && (
                  <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    🚨 URGENTNO
                  </span>
                )}
                <span className="px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase tracking-widest border bg-white/5 text-white/60 border-white/10">
                  {jobData.tipAngazmana?.replace(/-/g, ' ')?.toUpperCase() || 'PUNO RADNO VREME'}
                </span>
                <span className="px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase tracking-widest border bg-white/5 text-white/60 border-white/10 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">visibility</span>
                  {(jobData.viewsCount || 0) + (isTrackedInSession ? 1 : 0)} PREGLEDA
                </span>
              </div>

              <div className="space-y-4">
                <h1 id="job-title" className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[1] text-white">
                  {displayTitle}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-white/60 font-bold text-xs uppercase tracking-widest">
                  {jobData.companyId ? (
                    <Link to={`/firma/${jobData.companyId}`} className="flex items-center gap-2 text-secondary hover:text-white transition-colors">
                      <Building2 size={16} />
                      <span>{jobData.companyName || 'Privatni Poslodavac'}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Building2 size={16} />
                      <span>{jobData.companyName || 'Privatni Poslodavac'}</span>
                    </span>
                  )}
                  <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-secondary" />
                    <span>{jobData.location}</span>
                  </span>
                  {jobData.tacnaLokacija && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
                      <span className="text-white/45 normal-case font-medium">{jobData.tacnaLokacija}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-end gap-3 w-full lg:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleFavorite}
                className={`w-14 h-14 rounded-[10px] flex items-center justify-center border transition-all duration-300 ${
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
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <Heart fill={isSaved ? "currentColor" : "none"} size={24} />
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              
              <button 
                onClick={() => setShowReportModal(true)}
                className="w-14 h-14 rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/20 transition-all"
                title="Prijavi oglas"
              >
                <span className="material-symbols-outlined">flag</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 lg:gap-12" itemScope itemType="https://schema.org/JobPosting">
        <span hidden itemProp="title">{displayTitle}</span>
        <span hidden itemProp="datePosted">{jobData.createdAt?.toDate ? jobData.createdAt.toDate().toISOString() : new Date().toISOString()}</span>
        
        <article className="lg:col-span-8 space-y-12">
          {/* Gallery Bento */}
          <MediaGallery images={jobData.images || []} title={displayTitle} imageStatus={jobData.imageStatus} />

          {/* Quick Metrics Grid (Bento Style) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Plata / Satnica */}
            <div className="bg-[#0D141C] border border-white/5 p-6 rounded-[12px] flex flex-col justify-between h-36 hover:border-secondary/20 transition-all group">
              <div className="w-10 h-10 rounded-[8px] bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <Wallet size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">
                  {jobData.salaryType === 'hourly' ? 'Satnica' : 'Mesečna plata'}
                </span>
                <span className="text-xl font-black text-secondary tracking-tight">
                  {jobData.plataMin 
                    ? `${jobData.plataMin.toLocaleString()}${jobData.plataMax ? ` - ${jobData.plataMax.toLocaleString()}` : ''} EUR`
                    : 'Po dogovoru'}
                  {jobData.plataMin && (jobData.salaryType === 'hourly' ? ' / sat' : ' / mesec')}
                </span>
              </div>
            </div>

            {/* Radno vreme / Tip angažmana */}
            <div className="bg-[#0D141C] border border-white/5 p-6 rounded-[12px] flex flex-col justify-between h-36 hover:border-white/15 transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                <Clock size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Tip angažmana / Radno vreme</span>
                <span className="text-lg font-black text-white tracking-tight uppercase">
                  {getEngagementLabel(jobData.tipAngazmana, jobData.customEngagement)}
                </span>
              </div>
            </div>

            {/* Potrebno iskustvo */}
            <div className="bg-[#0D141C] border border-white/5 p-6 rounded-[12px] flex flex-col justify-between h-36 hover:border-white/15 transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                <Briefcase size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Potrebno Iskustvo</span>
                <span className="text-lg font-black text-white tracking-tight uppercase">
                  {getExperienceLabel(jobData.iskustvo)}
                </span>
              </div>
            </div>

            {/* Dinamika isplate */}
            <div className="bg-[#0D141C] border border-white/5 p-6 rounded-[12px] flex flex-col justify-between h-36 hover:border-white/15 transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center text-white/60 shrink-0">
                <Calendar size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Dinamika Isplate</span>
                <span className="text-lg font-black text-white tracking-tight uppercase">
                  {getPaymentDynamicsLabel(jobData.dinamikaIsplate)}
                </span>
              </div>
            </div>
          </div>

          {/* Opis Posla */}
          <section className="bg-[#0D141C] border border-white/5 rounded-[16px] p-6 sm:p-10 space-y-6">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="w-12 h-12 rounded-[10px] bg-secondary/10 flex items-center justify-center text-secondary">
                <Briefcase size={22} />
              </div>
              <h2 id="section-description" className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Opis Posla</h2>
            </div>
            <div itemProp="description" className="text-base sm:text-lg text-white/70 leading-relaxed font-medium whitespace-pre-wrap">
              {displayDescription || 'Opis posla trenutno nije unet od strane poslodavca.'}
            </div>
          </section>

                  {/* Obezbeđeni Uslovi Rada (Sva polja iz koraka 3 sa check / x statusom) */}
          <section className="bg-[#0D141C] border border-white/5 rounded-[16px] p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <div className="w-12 h-12 rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-[24px]">fact_check</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Obezbeđeni Uslovi Rada i Benefiti</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Svi uslovi definisani od strane poslodavca</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'smestaj', name: 'Smeštaj za radnike', icon: 'home_work' },
                { key: 'topli-obrok', name: 'Topli obrok / Ishrana', icon: 'restaurant' },
                { key: 'pauza-za-kafu', name: 'Pauza za kafu', icon: 'coffee' },
                { key: 'prevoz', name: 'Prevoz do posla i nazad', icon: 'directions_bus' },
                { key: 'htz-oprema', name: 'Radno odelo i HTZ oprema', icon: 'engineering' },
                { key: 'prijava-ugovor', name: 'Prijava / Ugovor obavezna', icon: 'shield_person' },
                { key: 'placen-prekovremeni', name: 'Plaćen prekovremeni rad', icon: 'more_time' },
                { key: 'pomoc-pri-vizi', name: 'Pomoć pri vizi / radnoj dozvoli', icon: 'public' }
              ].map(benefit => {
                const isProvided = jobData.benefiti?.includes(benefit.key) || jobData.rawBenefits?.includes(benefit.key);
                return (
                  <div 
                    key={benefit.key} 
                    className={`p-5 rounded-[10px] border flex items-center justify-between transition-all duration-300 ${
                      isProvided
                        ? 'bg-emerald-500/[0.03] border-emerald-500/15 text-white' 
                        : 'bg-red-500/[0.01] border-white/5 text-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <span className={`material-symbols-outlined text-2xl ${isProvided ? 'text-emerald-400' : 'text-white/20'}`}>
                        {benefit.icon}
                      </span>
                      <span className="font-bold text-xs uppercase tracking-widest">{benefit.name}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        isProvided 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        <span className="material-symbols-outlined text-[14px] font-black">
                          {isProvided ? 'check' : 'close'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interaktivna Google Mapa sa GPS Navigacijom */}
          <section className="bg-[#0D141C] border border-white/5 rounded-[16px] overflow-hidden">
            <div className="relative p-6 sm:p-10 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[10px] bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Tačna Lokacija i Mapa</h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">LOKACIJA ZA RAD I GPS PLANIRANJE RUTE</p>
                    </div>
                  </div>
                  {/* Rotating shadow effect */}
                  <div className="absolute inset-0 pointer-events-none rounded-[16px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-20 blur-3xl animate-[spin_30s_linear_infinite]" />
                </div>

            <div className="h-96 w-full bg-slate-900 relative">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(jobData.tacnaLokacija || jobData.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0 grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                title="Mesto rada"
              ></iframe>
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.7)]"></div>
            </div>

            <div className="p-6 bg-[#0B1017] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <h4 className="text-white font-black text-sm uppercase tracking-wider mb-1">Mesto i okolina gradilišta</h4>
                <p className="text-white/40 text-xs font-bold uppercase">{jobData.tacnaLokacija || jobData.location}</p>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobData.tacnaLokacija || jobData.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-secondary hover:bg-yellow-400 text-slate-950 font-black px-8 py-4 rounded-[10px] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/15"
              >
                <span className="material-symbols-outlined text-[18px]">directions</span>
                <span>ZAPOČNI GPS NAVIGACIJU</span>
              </a>
            </div>
          </section>

<div className="relative mt-12">
  {/* Rotating shadow above footer */}
  <div className="absolute -top-8 left-0 w-full h-8 pointer-events-none bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-20 blur-3xl animate-[spin_20s_linear_infinite]" />
    <SimilarJobsSlider
      jobData={jobData}
      displaySimilarJobs={displaySimilarJobs}
      buildJobUrl={buildJobUrl}
    />
</div>
        </article>

        {/* Sidebar Sticky Panel */}
        <aside className="lg:col-span-4 space-y-6" aria-label="Kontakt i prijava">
          <div className="sticky top-24 space-y-6">
            <div className="bg-[#0D141C] border border-white/5 rounded-[16px] p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none"></div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[10px] bg-secondary/10 flex items-center justify-center border border-secondary/20 overflow-hidden shadow-inner">
                    <Avatar name={jobData.companyName || jobData.authorName || 'Anonimni Korisnik'} url={jobData.companyLogo} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">OGLAŠAVAČ</span>
                    <h3 className="text-base font-black text-white tracking-tight uppercase leading-snug">
                      {jobData.companyName || jobData.authorName || 'Privatni poslodavac'}
                    </h3>
                    {jobData.isCompanyVerified && (
                      <div className="flex items-center gap-1.5 mt-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[4px] w-fit">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[7.5px] font-black tracking-widest uppercase text-green-400">Verifikovan APR</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {isLoggedIn ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {/* Yellow "Pozovi Poslodavca" button */}
                      <a
                        href={showPhone ? `tel:${jobData.phone || jobData.telefon}` : '#'}
                        onClick={(e) => {
                          if (!showPhone) {
                            e.preventDefault();
                            setShowPhone(true);
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(jobData.phone || jobData.telefon).catch(() => {});
                            }
                          }
                        }}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-950 py-5 rounded-[10px] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/10"
                      >
                        <Phone size={18} fill="currentColor" />
                        {showPhone ? `Tel: ${jobData.phone || jobData.telefon}` : 'Pozovi Poslodavca'}
                      </a>
                      {/* WhatsApp button */}
                      <a
                        href={`https://wa.me/${(jobData.phone || jobData.telefon)?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/20 py-4 rounded-[10px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        WhatsApp
                      </a>
                      {/* Viber button - using https fallback */}
                      <a
                        href={`https://viber.me/${(jobData.phone || jobData.telefon)?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/20 py-4 rounded-[10px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        Viber
                      </a>
                    </div>
                    <button
                      onClick={handleStartChat}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 py-4 rounded-[10px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                    >
                      <MessageSquare size={16} />
                      Pošalji Poruku na sajtu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider text-center">Kontakt podaci su zaštićeni</p>
                    <div className="w-full bg-white/5 py-5 rounded-[10px] font-black text-lg flex items-center justify-center gap-3 blur-md opacity-40 select-none border border-white/5">
                      <Phone size={18} />
                      <span>+381 6X XXX XXX</span>
                    </div>
                    <button 
                      onClick={() => navigate('/prijava')}
                      className="w-full bg-secondary hover:bg-yellow-400 text-slate-950 py-5 rounded-[10px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/15"
                    >
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      Prijavi se za kontakt
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Prijava na oglas dugme */}
            {!hasApplied && !isOwner && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleApply}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-6 rounded-[12px] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-3"
              >
                PRIJAVI SE NA OGLAS
              </motion.button>
            )}
            {hasApplied && (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-6 rounded-[12px] font-black text-sm uppercase tracking-widest text-center">
                PRIJAVA JE POSLATA
              </div>
            )}

            {/* Bezbedna Trgovina */}
            <div className="bg-[#0D141C] border border-white/5 rounded-[12px] p-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 rounded-[10px] bg-white/5 text-secondary">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">BEZBEDNA TRGOVINA</h4>
                  <p className="text-[10px] text-white/40 leading-relaxed font-bold">Nikada ne uplaćujte novac unapred pre nego što se uverite u kvalitet usluge ili proizvoda.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>



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
