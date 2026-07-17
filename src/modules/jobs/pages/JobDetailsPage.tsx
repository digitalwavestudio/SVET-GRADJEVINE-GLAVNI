import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getQuotaExceeded } from '@/src/lib/errorUtils';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import ReportModal from '@/src/components/ReportModal';
import SeoHead from '@/src/components/SeoHead';
import { APP_CONFIG } from '@/src/constants/config';
import { PAYMENT_DYNAMICS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { useTrackView } from '@/src/hooks/useTrackView';
import { buildJobUrl, extractJobId } from '@/src/lib/seo';
import { generateJobSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { SimilarJobsSlider } from '@/src/modules/jobs/components/jobs/SimilarJobsSlider';
import { JobApplicationModal } from '@/src/modules/jobs/components/jobs/JobApplicationModal';
import { useJobDetails, useJobMutations, useCheckApplied, useSimilarJobs } from '@/src/modules/jobs/hooks/useJobs';
import '@/src/modules/jobs/styles/similarJobs.css';
import { useFavoriteIds } from '@/src/modules/dashboard/hooks/useFavorites';
import MediaGallery from '@/src/modules/core/components/details/MediaGallery';
import { StickyDetailCTABar } from '@/src/components/layout/StickyDetailCTABar';
import AdminCommandCenter from '@/src/modules/jobs/components/jobs/AdminCommandCenter';
import { BENEFITS } from '@/src/constants/taxonomy';
import { useUserProfile } from '@/src/hooks/queries/useUser';
import {
  Briefcase,
  MapPin,
  Clock,
  Wallet,
  Calendar,
  Building2,
  Zap,
  Heart,
  Phone,
  MessageSquare,
  MessageCircle,
  Send,
  ShieldCheck,
  Globe,
  Facebook,
  Instagram
} from 'lucide-react';
import Avatar from '@/src/components/ui/Avatar';
import { toast } from 'react-hot-toast';

const formatCompanyName = (name?: string) => {
  if (!name) return '';
  return name.replace(/GraĐevine/g, 'Građevine').replace(/GRAĐEVINE/g, 'GRAĐEVINE').replace(/graĐevine/g, 'građevine');
};

const getPaymentDynamicsLabel = (slug?: string) => {
  const item = PAYMENT_DYNAMICS.find(t => t.slug === slug);
  return item ? item.name : (slug ? slug.replace(/-/g, ' ') : 'Po dogovoru');
};

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const actualId = id ? extractJobId(id) : '';
  const { data: jobDataResult, isLoading: loading, isError } = useJobDetails(actualId);
  const jobData = jobDataResult as any;
  const { data: authorProfile } = useUserProfile(jobData?.authorId);
  const profile = authorProfile as any;
  const companyDetails = profile?.businessProfile;
  const facebookUrl = profile?.facebook || companyDetails?.facebook;
  const instagramUrl = profile?.instagram || companyDetails?.instagram;
  const pibVal = profile?.pib || companyDetails?.pib;
  const emailVal = jobData?.email || profile?.email || companyDetails?.email;
  const websiteVal = companyDetails?.website || profile?.website;
  const addressVal = typeof (companyDetails?.address || profile?.address || profile?.location) === 'object' 
    ? [
        (companyDetails?.address || profile?.address)?.street,
        (companyDetails?.address || profile?.address)?.city,
        (companyDetails?.address || profile?.address)?.country
      ].filter(Boolean).join(', ') 
    : (companyDetails?.address || profile?.address || profile?.location);
  const { updateJob, deleteJob, applyToJob } = useJobMutations();

  const location = useLocation();
  const navigate = useNavigate();
  const { user, toggleSavedJob } = useAuth();

  const { startConversation } = useMessages();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applicationPhone, setApplicationPhone] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const { data: appliedResult } = useCheckApplied(actualId, user?.id || '');
  const hasApplied = !!appliedResult;
  const { data: similarJobsResult, isLoading: loadingSimilar } = useSimilarJobs(actualId, jobData?.locationSlug, jobData?.professionSlug, jobData?.profession, jobData?.title);
  const similarJobs = (similarJobsResult as any[]) || [];

  const { isTrackedInSession } = useTrackView(!user?.isAdmin ? jobData?.id : null, 'listings', jobData?.companyId);

  useEffect(() => {
    if (user?.isAdmin && jobData) {
      if (import.meta.env.DEV) console.log('[ADMIN_DEBUG] RAW JOB DATA:', jobData);
    }
  }, [user?.isAdmin, jobData]);

  const displayTitle = jobData?.title || jobData?.professionSlug || jobData?.category || 'Građevinski posao';
  const displayDescription = jobData?.description || jobData?.body || jobData?.content || jobData?.opis || 'Opis posla nije dostupan.';

  const isOwner = user?.id === jobData?.authorId;
  const phoneNumber = jobData?.phone || jobData?.telefon || '';

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

  const [titleMain, titleSub] = useMemo(() => {
    if (!displayTitle) return ['', ''];
    const separators = [' — ', ' - ', ' – '];
    for (const sep of separators) {
      if (displayTitle.includes(sep)) {
        const parts = displayTitle.split(sep);
        return [parts[0].trim(), parts.slice(1).join(sep).trim()];
      }
    }
    return [displayTitle, ''];
  }, [displayTitle]);

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
      toast.error('Greška prilikom prijave na oglas. Pokušajte ponovo.');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
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
    try {
      const convId = await startConversation(jobData.authorId, {
        id: jobData.id,
        type: 'jobs',
        category: 'jobs',
        title: jobData.title
      } as any, `Poštovani, javljam se povodom vašeg oglasa za posao "${jobData.title}".\n\nMožete li mi dati više informacija o uslovima?`);
      if (convId) {
        navigate(`/poruke/${convId}`);
      }
    } catch (e) {
      console.error('Failed to start conversation', e);
      toast.error('Greška pri pokretanju razgovora. Pokušajte ponovo.');
    }
  };

  const getDatePosted = () => {
    try {
      return jobData.createdAt?.toDate
        ? jobData.createdAt.toDate().toISOString()
        : typeof jobData.createdAt === 'string'
          ? jobData.createdAt
          : new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const handleApply = () => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    setShowApplicationModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans text-white selection:bg-yellow-500 selection:!text-black pb-20 md:pb-0">
      <SeoHead
        title={user?.isAdmin ? `${displayTitle} (MODERACIJA) - Svet Građevine` : `${displayTitle} ${jobData.location ? `- ${jobData.location}` : ''} - Svet Građevine`}
        description={cleanDescription.substring(0, 160)}
        image={jobData?.logo || jobData?.companyLogo || APP_CONFIG.OG_IMAGE_DEFAULT}
        url={buildJobUrl(jobData)}
        type="job"
        jsonLd={[seoSchema, breadcrumbSchema].filter(Boolean)}
      />

      {user?.isAdmin && (
        <AdminCommandCenter jobData={jobData} deleteJob={deleteJob} />
      )}

      <div className={`hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${user?.isAdmin ? 'mt-8' : 'mt-32'} mb-8`}>
        <Breadcrumbs items={[
          { label: 'Poslovi', path: '/poslovi' },
          ...(jobData.locationSlug ? [{ label: jobData.location, path: `/poslovi/${jobData.locationSlug}` }] : []),
          ...(jobData.professionSlug ? [{ label: jobData.professionSlug.replace(/-/g, ' '), path: `/poslovi/${jobData.professionSlug}${jobData.locationSlug ? `/${jobData.locationSlug}` : ''}` }] : []),
          { label: displayTitle, path: `/posao/${jobData?.id}` }
        ]} />
      </div>

      {/* Modern Header Hero */}
      <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-8 sm:mb-12 ${user?.isAdmin ? 'mt-8 md:mt-0' : 'mt-28 md:mt-12'}`}>
        <div className={`relative border backdrop-blur-xl rounded-3xl p-5 sm:p-8 lg:p-12 overflow-hidden shadow-2xl transition-all duration-500 ${
          jobData.isPremium
            ? 'border-yellow-500/20 bg-gradient-to-b from-yellow-500/[0.02] to-transparent shadow-[0_0_50px_-12px_rgba(234,179,8,0.12)]'
            : 'border-white/10 bg-white/[0.02]'
        }`}>
          {/* Subtle Glow Background */}
          <div className={`absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-transparent to-transparent ${
            jobData.isPremium ? 'via-yellow-500/30' : 'via-blue-500/20'
          }`}></div>
          <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-all duration-500 ${
            jobData.isPremium ? 'bg-yellow-500/10' : 'bg-blue-500/5'
          }`}></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-start text-center sm:text-left flex-1 w-full">
              {/* Company Logo */}
              <div 
                className="rounded-full sm:rounded-2xl bg-white border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-white/20 p-1.5"
                style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
              >
                {jobData.logo || jobData.companyLogo || companyDetails?.logo ? (
                  <img 
                    src={jobData.logo || jobData.companyLogo || companyDetails?.logo} 
                    alt={formatCompanyName(jobData.comp || jobData.companyName || companyDetails?.companyName || jobData.authorName || 'Logo')} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Avatar 
                    name={formatCompanyName(jobData.comp || jobData.companyName || companyDetails?.companyName || jobData.authorName || 'Anonimni Korisnik')} 
                    className="w-full h-full text-lg font-bold" 
                  />
                )}
              </div>

              {/* Title & Info */}
              <div className="space-y-3 flex-1 min-w-0 w-full">
                {/* Company Name */}
                <div className="text-xs sm:text-sm font-black tracking-widest uppercase flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {jobData.companyId ? (
                    <Link to={`/firma/${jobData.companyId}`} className="hover:underline text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 transition-all">
                      {formatCompanyName(jobData.comp || jobData.companyName || companyDetails?.companyName || jobData.authorName || 'Privatni Poslodavac')}
                    </Link>
                  ) : (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
                      {formatCompanyName(jobData.comp || jobData.companyName || companyDetails?.companyName || jobData.authorName || 'Privatni Poslodavac')}
                    </span>
                  )}
                </div>

                {/* Job Title */}
                <h1 id="job-title" className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight bg-gradient-to-b from-white via-white to-white/80 bg-clip-text text-transparent uppercase">
                  {titleMain}
                </h1>
                
                {/* Subtitle / Badges / Views */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  {titleSub && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
                      <MapPin size={12} className="text-yellow-500 shrink-0" />
                      <span>{titleSub}</span>
                    </div>
                  )}

                  {jobData.location && !titleSub && (
                    <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      <MapPin size={12} className="text-amber-500 shrink-0" />
                      <span>{jobData.location}</span>
                    </span>
                  )}

                  {jobData.isUrgent && (
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 backdrop-blur-md">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      HITNO
                    </span>
                  )}

                  <div className="text-[10px] sm:text-xs text-white/40 font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-400 shrink-0">visibility</span>
                    <span>{(jobData.viewsCount || 0) + (isTrackedInSession ? 1 : 0)} pregleda</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleFavorite}
                className={`flex-1 lg:flex-none h-12 px-6 rounded-2xl flex items-center justify-center gap-2 border transition-all duration-300 font-bold text-sm backdrop-blur-md shadow-lg shadow-black/20 ${
                  isSaved
                    ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:border-red-500/40 shadow-red-500/10'
                    : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                <Heart fill={isSaved ? "currentColor" : "none"} size={18} className={isSaved ? "scale-110 transition-transform text-red-500" : "transition-transform text-white/70"} />
                <span>{isSaved ? 'Sačuvano' : 'Sačuvaj'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowReportModal(true)}
                className="flex-1 lg:flex-none lg:w-12 h-12 px-6 lg:px-0 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center gap-2 lg:gap-0 text-white/70 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 transition-all duration-300 backdrop-blur-md shadow-lg shadow-black/20"
                title="Prijavi oglas"
              >
                <span className="material-symbols-outlined text-lg">flag</span>
                <span className="lg:hidden font-bold text-sm text-white/70">Prijavi</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10" itemScope itemType="https://schema.org/JobPosting">
        <meta itemProp="title" content={displayTitle} />
        <meta itemProp="datePosted" content={getDatePosted()} />

        <article className="lg:col-span-8 space-y-6 sm:space-y-8">
          <MediaGallery images={jobData.images || []} title={displayTitle} imageStatus={jobData.imageStatus} />

          {/* Unified Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-px bg-transparent sm:bg-white/10 border border-transparent sm:border-white/10 rounded-2xl overflow-hidden sm:shadow-xl">
            <div className="bg-white/[0.02] sm:bg-[#0B0F19] border border-white/5 sm:border-0 rounded-2xl sm:rounded-none p-5 sm:p-8 flex flex-col items-center sm:items-start justify-center hover:bg-white/[0.04] sm:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Wallet size={18} />
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider">
                  Satnica
                </span>
              </div>
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 tracking-tight leading-none py-1 drop-shadow-[0_2px_10px_rgba(251,191,36,0.15)]">
                  {jobData.isNegotiable 
                    ? 'Pozvati' 
                    : jobData.plataMin != null
                      ? `${Number(jobData.plataMin).toLocaleString()}${jobData.plataMax != null && Number(jobData.plataMax) > 0 ? ` - ${Number(jobData.plataMax).toLocaleString()}` : ''} €`
                      : 'Po dogovoru'}
              </span>
            </div>

            <div className="bg-white/[0.02] sm:bg-[#0B0F19] border border-white/5 sm:border-0 rounded-2xl sm:rounded-none p-5 sm:p-8 flex flex-col items-center sm:items-start justify-center hover:bg-white/[0.04] sm:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Calendar size={18} />
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider">Isplata</span>
              </div>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/70 tracking-tight leading-none py-1">
                {getPaymentDynamicsLabel(jobData.dinamikaIsplate)}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 sm:p-8 lg:p-10 space-y-4 flex flex-col items-center sm:items-start justify-center sm:justify-start text-center sm:text-left w-full">
            <h2 id="section-description" className="text-lg sm:text-xl font-bold text-white flex items-center justify-center sm:justify-start w-full">
              Opis Posla
            </h2>
            <div itemProp="description" className="text-sm sm:text-base text-white/90 leading-relaxed whitespace-pre-wrap font-medium break-words [overflow-wrap:anywhere] text-center sm:text-left w-full max-w-3xl">
              {displayDescription || 'Opis posla trenutno nije unet od strane poslodavca.'}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 sm:p-8 lg:p-10 space-y-6 flex flex-col items-start justify-start text-left w-full">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-start w-full">
              Obezbeđeno od poslodavca
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full auto-rows-fr">
              {BENEFITS.map(benefit => {
                const isProvided = jobData.benefits?.includes(benefit.slug) || jobData.benefiti?.includes(benefit.slug) || jobData.rawBenefits?.includes(benefit.slug);
                if (!isProvided) return null;

                const icon = benefit.slug === 'smestaj' ? 'home_work' : 
                  benefit.slug === 'topli-obrok' ? 'restaurant' : 
                  benefit.slug === 'pauza-za-kafu' ? 'coffee' :
                  benefit.slug === 'prevoz' ? 'directions_bus' : 
                  benefit.slug === 'htz-oprema' ? 'engineering' :
                  benefit.slug === 'alat-za-rad' ? 'handyman' :
                  benefit.slug === 'prijava-ugovor' ? 'shield_person' :
                  benefit.slug === 'placen-prekovremeni' ? 'more_time' :
                  benefit.slug === 'pomoc-pri-vizi' ? 'public' : 'check_circle';
                
                return (
                  <div
                    key={benefit.slug}
                    className="px-5 py-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center sm:justify-start gap-3 text-emerald-400 hover:bg-emerald-500/10 transition-colors h-full min-h-[58px] w-full sm:w-auto min-w-[200px]"
                  >
                    <span className="material-symbols-outlined text-[20px] shrink-0">
                      {icon}
                    </span>
                    <span className="font-semibold text-sm text-white/90">{benefit.name}</span>
                  </div>
                );
              })}
              
              {!BENEFITS.some(b => jobData.benefits?.includes(b.slug) || jobData.benefiti?.includes(b.slug) || jobData.rawBenefits?.includes(b.slug)) && (
                <div className="col-span-full text-white/40 text-sm font-medium p-4 border border-white/5 rounded-xl bg-white/[0.01] w-full text-center">
                  Poslodavac nije eksplicitno izdvojio posebne benefite.
                </div>
              )}
            </div>
          </section>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4" aria-label="Kontakt i prijava">
          <div className="sticky top-28 space-y-6">
            
            {/* Employer Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col items-center text-center mb-6">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 block">Oglašavač</span>
                <div 
                  className="rounded-2xl bg-white border border-white/10 overflow-hidden flex items-center justify-center mb-4 shadow-xl p-1.5 shrink-0"
                  style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
                >
                  {jobData.logo || jobData.companyLogo || companyDetails?.logo ? (
                    <img 
                      src={jobData.logo || jobData.companyLogo || companyDetails?.logo} 
                      alt={formatCompanyName(jobData.comp || jobData.companyName || companyDetails?.companyName || jobData.authorName || 'Logo')} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Avatar 
                      name={formatCompanyName(jobData.comp || jobData.companyName || companyDetails?.companyName || jobData.authorName || 'Anonimni Korisnik')} 
                      className="w-full h-full text-base font-bold" 
                    />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white px-2 mt-1">
                  {formatCompanyName(jobData.comp || jobData.companyName || jobData.authorName || 'Privatni poslodavac')}
                </h3>
                {jobData.isCompanyVerified && (
                  <div className="inline-flex items-center gap-1.5 mt-3 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                    <span>Verifikovan poslodavac</span>
                  </div>
                )}

                {/* Employer Bio / Description */}
                {(companyDetails?.about || companyDetails?.description || profile?.description) && (
                  <p className="text-xs text-white/50 mt-2 px-2 max-w-[240px] leading-relaxed line-clamp-3">
                    {companyDetails?.about || companyDetails?.description || profile?.description}
                  </p>
                )}

                {/* Company details list with icons and improved design */}
                {(pibVal || addressVal || websiteVal || emailVal || facebookUrl || instagramUrl) && (
                  <div className="w-full space-y-3.5 text-sm text-white/80 border-t border-white/5 pt-5 mt-5 text-left font-sans">
                    {pibVal && (
                      <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-yellow-500 shrink-0">fingerprint</span>
                          <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">PIB</span>
                        </div>
                        <span className="font-sans text-yellow-400 font-extrabold text-sm tracking-wide select-all">{pibVal}</span>
                      </div>
                    )}
                    {addressVal && (
                      <div className="flex items-start justify-between py-1.5 border-b border-white/[0.03] gap-4">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-yellow-500 shrink-0">location_on</span>
                          <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">Adresa</span>
                        </div>
                        <span className="text-right text-white text-xs font-semibold">{addressVal}</span>
                      </div>
                    )}
                    {websiteVal && (
                      <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-yellow-500 shrink-0">language</span>
                          <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">Sajt</span>
                        </div>
                        <a 
                          href={websiteVal.startsWith('http') ? websiteVal : `https://${websiteVal}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-yellow-400 hover:text-yellow-300 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          Poseti sajt <Globe size={12} className="shrink-0" />
                        </a>
                      </div>
                    )}
                    {emailVal && (
                      <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">mail</span>
                          <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">Email</span>
                        </div>
                        <a 
                          href={`mailto:${emailVal}`} 
                          className="text-white hover:text-yellow-400 font-semibold text-xs transition-colors truncate max-w-[170px] sm:max-w-none"
                        >
                          {emailVal}
                        </a>
                      </div>
                    )}
                    {(facebookUrl || instagramUrl) && (
                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-yellow-500 shrink-0">share</span>
                          <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">Mreže</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {facebookUrl && (
                            <a 
                              href={facebookUrl.startsWith('http') ? facebookUrl : `https://facebook.com/${facebookUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-white/60 hover:text-yellow-400 transition-colors p-1 bg-white/5 rounded-md border border-white/10 flex items-center justify-center w-7 h-7"
                            >
                              <Facebook size={14} />
                            </a>
                          )}
                          {instagramUrl && (
                            <a 
                              href={instagramUrl.startsWith('http') ? instagramUrl : `https://instagram.com/${instagramUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-white/60 hover:text-yellow-400 transition-colors p-1 bg-white/5 rounded-md border border-white/10 flex items-center justify-center w-7 h-7"
                            >
                              <Instagram size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-white/5 mb-6" />

              <div className="space-y-3">
                <a
                  href={`tel:${phoneNumber}`}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 !text-black h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Phone size={18} />
                  Pozovi: {phoneNumber}
                </a>
                
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#0e7568] text-white shadow-lg shadow-[#25D366]/15 hover:shadow-[#25D366]/25 border-0 font-bold h-12 rounded-xl text-xs transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                  <a
                    href={`https://viber.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-[#7360F2] to-[#5a48d8] hover:from-[#604dec] hover:to-[#4937c5] text-white shadow-lg shadow-[#7360F2]/15 hover:shadow-[#7360F2]/25 border-0 font-bold h-12 rounded-xl text-xs transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Viber
                  </a>
                </div>
                
                <button
                  onClick={handleStartChat}
                  className="w-full bg-gradient-to-r from-[#1E293B] to-[#0F172A] hover:from-[#334155] hover:to-[#1E293B] border border-white/10 text-white shadow-lg shadow-black/30 font-bold h-12 rounded-xl text-xs transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-3"
                >
                  <Send size={16} className="text-yellow-400" />
                  Pošalji poruku na sajtu
                </button>
              </div>
            </div>

            {/* Apply Button */}
            {!hasApplied && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white h-16 rounded-2xl font-bold text-sm tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                PRIJAVI SE NA OGLAS
              </motion.button>
            )}
            {hasApplied && (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 h-16 rounded-2xl font-bold text-sm tracking-wider flex items-center justify-center gap-2">
                <ShieldCheck size={20} />
                PRIJAVA POSLATA
              </div>
            )}
          </div>
        </aside>
      </main>

      {similarJobs && similarJobs.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 w-full border-t border-white/5 mt-8 sm:mt-12 relative z-10">
          <SimilarJobsSlider
            jobData={jobData}
            displaySimilarJobs={similarJobs}
            buildJobUrl={buildJobUrl}
          />
        </div>
      )}

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
        phone={jobData.phone || jobData.telefon || jobData.applicationPhone || ''}
        onMessage={handleStartChat}
        price={jobData.isNegotiable ? 'Pozvati' : jobData.plataMin != null ? `${Number(jobData.plataMin).toLocaleString()}${jobData.plataMax != null && Number(jobData.plataMax) > 0 ? ` - ${Number(jobData.plataMax).toLocaleString()}` : ''}` : undefined}
        currency={jobData.isNegotiable ? '' : 'EUR'}
        priceLabel={jobData.isNegotiable ? 'CENA' : 'SATNICA'}
        ctaText={!hasApplied && !isOwner ? "PRIJAVI SE" : hasApplied ? "PRIJAVLJEN" : undefined}
        onCtaClick={!hasApplied && !isOwner ? handleApply : undefined}
      />
    </div>
  );
}
