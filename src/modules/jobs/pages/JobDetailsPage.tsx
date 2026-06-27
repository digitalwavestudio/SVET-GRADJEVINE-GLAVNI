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
  ShieldCheck
} from 'lucide-react';
import Avatar from '@/src/components/ui/Avatar';
import { toast } from 'react-hot-toast';

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
  const { data: similarJobsResult, isLoading: loadingSimilar } = useSimilarJobs(actualId, jobData?.locationSlug, jobData?.professionSlug);
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
    try {
      const convId = await startConversation(jobData.companyId || jobData.authorId, {
        id: jobData.id,
        type: 'Posao',
        title: jobData.title
      }, `Poštovani, javljam se povodom vašeg oglasa za posao "${jobData.title}".\n\nMožete li mi dati više informacija o uslovima?`);
      if (convId) {
        navigate(`/poruke/${convId}`);
      }
    } catch {
      console.error('Failed to start conversation');
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
      <div className={`max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mb-12 ${user?.isAdmin ? 'mt-8 md:mt-0' : 'mt-32 md:mt-12'}`}>
        <div className="relative border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-4 sm:p-8 lg:p-12 overflow-hidden shadow-2xl">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="space-y-6 flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {jobData.isPremium && (
                  <span className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                    <Zap size={14} className="fill-yellow-500" /> PREMIUM POSAO
                  </span>
                )}
                {jobData.isUrgent && (
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="fill-red-500" /> URGENTNO
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="space-y-4 max-w-4xl">
                <h1 id="job-title" className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {displayTitle}
                </h1>
                
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-white/50 font-medium text-sm">
                  {jobData.companyId ? (
                    <Link to={`/firma/${jobData.companyId}`} className="flex items-center gap-2 hover:text-white transition-colors">
                      <Building2 size={16} />
                      <span>{jobData.comp || jobData.companyName || 'Privatni Poslodavac'}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Building2 size={16} />
                      <span>{jobData.comp || jobData.companyName || 'Privatni Poslodavac'}</span>
                    </span>
                  )}
                  {jobData.location && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      <span className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{jobData.location}</span>
                      </span>
                    </>
                  )}
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>{(jobData.viewsCount || 0) + (isTrackedInSession ? 1 : 0)} pregleda</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleFavorite}
                className={`flex-1 lg:flex-none h-12 px-6 rounded-xl flex items-center justify-center gap-2 border transition-all duration-300 font-semibold text-sm shadow-sm ${
                  isSaved
                    ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 shadow-red-500/10'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <Heart fill={isSaved ? "currentColor" : "none"} size={18} />
                <span>{isSaved ? 'Sačuvano' : 'Sačuvaj'}</span>
              </motion.button>

              <button
                onClick={() => setShowReportModal(true)}
                className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 transition-all"
                title="Prijavi oglas"
              >
                <span className="material-symbols-outlined">flag</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10" itemScope itemType="https://schema.org/JobPosting">
        <meta itemProp="title" content={displayTitle} />
        <meta itemProp="datePosted" content={getDatePosted()} />

        <article className="lg:col-span-8 space-y-8">
          <MediaGallery images={jobData.images || []} title={displayTitle} imageStatus={jobData.imageStatus} />

          {/* Unified Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-[#0B0F19] p-5 md:p-6 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Wallet size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {jobData.salaryType === 'hourly' ? 'Satnica' : 'Mesečna plata'}
                </span>
              </div>
              <span className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
                  {jobData.plataMin != null
                    ? `${Number(jobData.plataMin).toLocaleString()}${jobData.plataMax != null ? ` - ${Number(jobData.plataMax).toLocaleString()}` : ''} €`
                    : 'Po dogovoru'}
              </span>
            </div>
            


            <div className="bg-[#0B0F19] p-5 md:p-6 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Calendar size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Isplata</span>
              </div>
              <span className="text-sm font-bold text-white">
                {getPaymentDynamicsLabel(jobData.dinamikaIsplate)}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 sm:p-6 lg:p-10 space-y-6">
            <h2 id="section-description" className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                <Briefcase size={20} />
              </div>
              Opis Posla
            </h2>
            <div itemProp="description" className="text-base text-white/70 leading-relaxed whitespace-pre-wrap font-medium break-words [overflow-wrap:anywhere]">
              {displayDescription || 'Opis posla trenutno nije unet od strane poslodavca.'}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              Obezbeđeni Uslovi Rada
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 auto-rows-fr">
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
                    className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3 text-emerald-400 hover:bg-emerald-500/10 transition-colors h-full min-h-[72px]"
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {icon}
                    </span>
                    <span className="font-semibold text-sm text-white/90">{benefit.name}</span>
                  </div>
                );
              })}
              
              {!BENEFITS.some(b => jobData.benefits?.includes(b.slug) || jobData.benefiti?.includes(b.slug) || jobData.rawBenefits?.includes(b.slug)) && (
                <div className="col-span-full text-white/40 text-sm font-medium p-4 border border-white/5 rounded-xl bg-white/[0.01]">
                  Poslodavac nije eksplicitno izdvojio posebne benefite.
                </div>
              )}
            </div>
          </section>

          {/* Map Section */}
          {(jobData.tacnaLokacija || jobData.location) && (
            <section className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <MapPin size={20} />
                  </div>
                  Lokacija
                </h2>
              </div>
              <div className="h-64 sm:h-[300px] w-full relative">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder={0}
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(jobData.tacnaLokacija || jobData.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  className="absolute inset-0 grayscale contrast-125 opacity-70 hover:grayscale-0 hover:opacity-100 hover:contrast-100 transition-all duration-700"
                  title="Mesto rada"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(11,15,25,0.8)]"></div>
              </div>
              <div className="p-6 sm:p-8 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block">Tačna adresa</span>
                  <p className="text-white/90 text-sm font-medium">{jobData.tacnaLokacija || jobData.location}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobData.tacnaLokacija || jobData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <MapPin size={16} />
                  <span>Otvori mapu</span>
                </a>
              </div>
            </section>
          )}

          <div className="pt-4">
            <SimilarJobsSlider
              jobData={jobData}
              displaySimilarJobs={similarJobs}
              buildJobUrl={buildJobUrl}
            />
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4" aria-label="Kontakt i prijava">
          <div className="sticky top-28 space-y-6">
            
            {/* Employer Card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center mb-4 shadow-xl">
                  <Avatar name={jobData.comp || jobData.companyName || jobData.authorName || 'Anonimni Korisnik'} url={jobData.logo || jobData.companyLogo} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Oglašavač</span>
                <h3 className="text-lg font-black text-white">
                  {jobData.comp || jobData.companyName || jobData.authorName || 'Privatni poslodavac'}
                </h3>
                {jobData.isCompanyVerified && (
                  <div className="inline-flex items-center gap-1.5 mt-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                    <ShieldCheck size={14} />
                    <span>Verifikovan poslodavac</span>
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-white/5 mb-8" />

              {isLoggedIn ? (
                <div className="space-y-3">
                  <a
                    href={showPhone ? `tel:${phoneNumber}` : '#'}
                    onClick={(e) => {
                      if (!showPhone) {
                        e.preventDefault();
                        setShowPhone(true);
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(phoneNumber).catch(() => {});
                        }
                      }
                    }}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 !text-black h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                  >
                    <Phone size={18} />
                    {showPhone ? `Tel: ${phoneNumber}` : 'Prikaži Telefon'}
                  </a>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] h-12 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} />
                      WhatsApp
                    </a>
                    <a
                      href={`https://viber.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#7360F2]/10 hover:bg-[#7360F2]/20 border border-[#7360F2]/20 text-[#7360F2] h-12 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Phone size={16} />
                      Viber
                    </a>
                  </div>
                  
                  <button
                    onClick={handleStartChat}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white h-12 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <MessageSquare size={16} />
                    Pošalji poruku na sajtu
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Kontakt podaci zaštićeni</p>
                    <div className="w-full bg-white/5 border border-white/10 h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-3 blur-[3px] opacity-50 select-none">
                      <Phone size={18} />
                      <span>+381 6X XXX XXX</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/prijava')}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    Prijavi se za kontakt
                  </button>
                </div>
              )}
            </div>

            {/* Apply Button */}
            {!hasApplied && !isOwner && (
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
            
            <p className="text-center text-[10px] text-white/30 font-medium px-4">
              Nikada ne uplaćujte novac unapred pre nego što se uverite u kvalitet usluge ili postojanje posla.
            </p>
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
        phone={jobData.phone || jobData.telefon || jobData.applicationPhone || ''}
        onMessage={handleStartChat}
        price={jobData.plataMin != null ? `${Number(jobData.plataMin).toLocaleString()}${jobData.plataMax != null ? ` - ${Number(jobData.plataMax).toLocaleString()}` : ''}` : undefined}
        currency="EUR"
        priceLabel="PLATA"
        ctaText={!hasApplied && !isOwner ? "PRIJAVI SE" : hasApplied ? "PRIJAVLJEN" : undefined}
        onCtaClick={!hasApplied && !isOwner ? handleApply : undefined}
      />
    </div>
  );
}
