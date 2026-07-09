import { OptimizedImage } from '@/src/components/OptimizedImage';
import { motion } from 'motion/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import Footer from '@/src/components/Footer';
import Navbar from '@/src/components/Navbar';
import { RelatedSEO } from '@/src/components/RelatedSEO';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { useTrackView } from '@/src/hooks/useTrackView';

import SeoHead from '@/src/components/SeoHead';
import { APP_CONFIG } from '@/src/constants/config';
import { getAccommodationLink, getCateringLink, getMachineLink, getPlotLink } from '@/src/lib/routeFilters';
import { generateProfessionalServiceSchema } from '@/src/lib/seoSchema';
import { createPersonSchema, createBreadcrumbSchema } from '@/src/lib/seo/schemas';
import { usePublicProfileNode } from '@/src/modules/dashboard/hooks/usePublicProfileNode';
import { AvailabilityCalendar, CalendarEvent } from '@/src/modules/core/components/calendar/AvailabilityCalendar';
import { User } from '@svet-gradjevine/shared';


interface PublicProfileData extends Omit<User, 'cvData' | 'availability'> {
  availability?: string;
  events?: CalendarEvent[];
  cvData?: {
    about?: string;
    title?: string;
    skills?: string[];
    location?: string;
    experience?: string | any;
    education?: string | any;
    availability?: string;
    experienceYears?: string;
    portfolioTitle?: string;
    portfolioDescription?: string;
    portfolioImages?: string[];
    phone?: string;
  };
  services?: { id: string }[];
  portfolio?: { id: string }[];
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startConversation } = useMessages();
  
  const isAdmin = Boolean(user?.email && (user.role === 'admin' || user.isAdmin));

  const nodeData = usePublicProfileNode(id, isAdmin);
  const profile = nodeData.profile as unknown as PublicProfileData | null;
  const { companyId, loading, loadingAds, userAds, isUpdating, handleAdminAction } = nodeData;
  
  const { isTrackedInSession } = useTrackView(profile?.id, 'users', profile?.id);

  const onAdminAction = async (action: 'approve' | 'premium' | 'delete') => {
    try {
      await handleAdminAction(action);
      alert("Profil uspešno ažuriran!");
    } catch {
      alert("Greška pri ažuriranju profila.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">
        UČITAVANJE PROFILA...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6">
        <h1 className="text-4xl font-black uppercase">PROFIL NIJE PRONAĐEN</h1>
        <Link to="/" className="bg-secondary !text-black px-8 py-4 rounded-[10px] font-black uppercase text-xs">Vrati se na početnu</Link>
      </div>
    );
  }

  const isCompany = profile.role === 'poslodavac';
  const isMaster = profile.role === 'majstor';
  const displayName = profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : (profile.name || 'Korisnik');
  const photo = profile.photoURL || profile.businessProfile?.logo;

  const personSchema = isMaster ? (
    generateProfessionalServiceSchema(profile, `${APP_CONFIG.BASE_URL}/profil/${profile.id}`)
  ) : createPersonSchema({
    role: profile.role,
    name: displayName,
    description: (((profile as PublicProfileData)?.cvData?.about) || profile.description || `Profil korisnika ${displayName} na platformi Svet Građevine.`).substring(0, 300),
    image: photo,
    jobTitle: ((profile as PublicProfileData)?.cvData?.title) || profile.profession,
    url: `${APP_CONFIG.BASE_URL}/profil/${profile.id}`,
    skills: ((profile as PublicProfileData)?.cvData?.skills) || [],
    location: ((profile as PublicProfileData)?.cvData?.location) || "Srbija",
    phone: profile.phone || "",
    socialLinks: [profile.facebook, profile.instagram].filter(Boolean) as string[]
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Početna", item: "/" },
    { name: "Majstori", item: "/majstori" },
    { name: displayName, item: `/profil/${profile.id}` }
  ]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {isAdmin && profile && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900 border-t border-white/10 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Moderacija Profila</span>
              <span className="text-white font-bold text-xs">STATUS: {profile.status?.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onAdminAction('approve')}
                disabled={isUpdating || profile.status === 'active'}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-white px-6 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                ODOBRI PROFIL
              </button>
              <button 
                onClick={() => onAdminAction('premium')}
                disabled={isUpdating}
                className={`${profile.isPremiumProfile ? 'bg-secondary !text-black font-bold' : 'bg-white/10 text-secondary border border-secondary/30'} hover:scale-105 px-6 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all`}
              >
                {profile.isPremiumProfile ? '★ VIP AKTIVAN' : 'DAJ VIP STATUS'}
              </button>
              <button 
                onClick={() => onAdminAction('delete')}
                disabled={isUpdating || profile.status === 'deleted'}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                UKLONI PROFIL
              </button>
            </div>
          </div>
        </div>
      )}
      <SeoHead 
        title={`${displayName} | Profil ${isCompany ? 'Firme' : 'Majstora'}`}
        description={((profile as PublicProfileData)?.cvData?.about) || profile.description || `Pregledajte profil korisnika ${displayName} na Svetu Građevine.`}
        image={photo}
        url={`${APP_CONFIG.BASE_URL}/profil/${profile.id}`}
        type={isCompany ? 'website' : 'article'}
        jsonLd={[personSchema, breadcrumbSchema]}
      />
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs items={[
            { label: 'Majstori', path: '/majstori' },
            { label: ((profile as PublicProfileData)?.cvData?.location) || 'Srbija' },
            { label: displayName }
          ]} />

          {/* Header Section */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 md:p-12 mb-10 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 blur-[120px] pointer-events-none" />
             
             <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
                <div className="w-48 h-48 rounded-[10px] bg-white p-2 shadow-2xl flex-shrink-0">
                   {photo ? (
                      <OptimizedImage 
                        src={photo} 
                        fallbackType="default" 
                        alt="Photo" 
                        className="w-full h-full object-cover rounded-[5px]" 
                        containerClassName="w-full h-full"
                      />
                   ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-6xl font-black !text-black rounded-[10px]">
                         {displayName.charAt(0)}
                      </div>
                   )}
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-4">
                   <div className="inline-block px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-[10px] text-secondary text-[10px] font-black uppercase tracking-widest mb-2">
                      {isCompany ? 'PREDUZEĆE' : profile.role?.toUpperCase() || 'KORISNIK'}
                   </div>
                   <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none w-full break-words max-w-full overflow-hidden text-ellipsis px-1">{displayName}</h1>
                   
                    {companyId && (
                      <div className="flex justify-center md:justify-start">
                        <Link 
                          to={`/firma/${companyId}`}
                          className="inline-flex items-center gap-2 bg-secondary !text-black px-3 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-secondary/10"
                        >
                          <span className="material-symbols-outlined text-xs">business_center</span>
                          Pogledaj profil firme
                        </Link>
                      </div>
                    )}
                   <div className="flex items-center gap-4">
                    <span className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 border border-white/10">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        {(profile?.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
                    </span>
                    {!isCompany && (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          profile.availability === 'slobodan' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          profile.availability === 'zauzet' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {profile.availability === 'slobodan' ? 'DOSTUPAN' : profile.availability === 'zauzet' ? 'ZAUZET' : 'USKORO'}
                        </span>
                      )}
                    </div>
                   {profile.profession && (
                      <p className="text-xl font-bold text-white/60 uppercase">{((profile as PublicProfileData)?.cvData?.title) || profile.profession}</p>
                   )}
                          <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                      {profile.phone && (
                         <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-[10px] text-[10px] font-bold text-white/40 uppercase border border-white/5">
                            <span className="material-symbols-outlined text-sm">call</span>
                            {profile.phone}
                         </div>
                      )}
                      {profile.email && (
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-[10px] text-[10px] font-bold text-white/40 uppercase border border-white/5">
                           <span className="material-symbols-outlined text-sm">mail</span>
                           {profile.email}
                        </div>
                      )}
                      {((profile as PublicProfileData)?.cvData?.location) && (
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-[10px] text-[10px] font-bold text-white/40 uppercase border border-white/5">
                           <span className="material-symbols-outlined text-sm">location_on</span>
                           {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.location}
                        </div>
                      )}
                   </div>
                </div>
                
                <div className="md:text-right space-y-4 pt-6 md:pt-0">
                   {profile.profileScore && (
                      <div className="inline-flex flex-col items-center md:items-end">
                         <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">SNAGA PROFILA</div>
                         <div className="text-4xl font-black text-secondary">{profile.profileScore}%</div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-10">
             {/* Left Column: Details */}
             <div className="lg:col-span-2 space-y-10">
                {(((profile as PublicProfileData)?.cvData?.about) || profile.description) && (
                  <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
                    <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-8">O MENI / BIOGRAFIJA</h2>
                    <div className="text-lg font-medium text-white/70 leading-relaxed whitespace-pre-line">
                        {((profile as PublicProfileData)?.cvData?.about) || profile.description}
                    </div>
                  </section>
                )}
                
                {(profile as PublicProfileData & Record<string, unknown>)?.cvData && (
                   <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-10">
                      {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.experience && (
                        <div>
                          <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg">work_history</span>
                            RADNO ISKUSTVO
                          </h2>
                          <div className="text-base font-bold text-white/70 leading-relaxed whitespace-pre-line bg-white/[0.02] p-8 rounded-[10px] border border-white/5">
                            {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.experience}
                          </div>
                        </div>
                      )}
                      
                      {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.skills && ((profile as PublicProfileData & Record<string, unknown>)?.cvData?.skills as string[]).length > 0 && (
                        <div>
                          <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg">construction</span>
                            VEŠTINE I SPECIJALNOSTI
                          </h2>
                          <div className="flex flex-wrap gap-3">
                            {((profile as PublicProfileData & Record<string, unknown>)?.cvData?.skills || []).map((skill: string, idx: number) => (
                              <span key={idx} className="bg-secondary/10 border border-secondary/20 text-secondary px-5 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform cursor-default">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.education && (
                        <div>
                          <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-lg">school</span>
                            OBRAZOVANJE
                          </h2>
                          <div className="text-sm font-black text-white/70 uppercase tracking-wide bg-white/[0.02] p-6 rounded-[10px] border border-white/5">
                            {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.education}
                          </div>
                        </div>
                      )}
                   </section>
                )}

                {/* Portfolio Section */}
                {(profile as PublicProfileData & Record<string, unknown>)?.cvData && ((profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioImages?.length || (profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioTitle) && (
                  <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
                      <div>
                        <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                          <span className="material-symbols-outlined text-lg">collections</span>
                          PORTFOLIO RADOVA
                        </h2>
                        {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioTitle && (
                          <h3 className="text-2xl font-black text-white uppercase tracking-tight">{(profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioTitle}</h3>
                        )}
                      </div>
                    </div>

                    {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioDescription && (
                      <p className="text-white/60 font-medium leading-relaxed italic border-l-2 border-secondary/30 pl-6">
                        {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioDescription}
                      </p>
                    )}

                    {(profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioImages && ((profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioImages as string[]).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {((profile as PublicProfileData & Record<string, unknown>)?.cvData?.portfolioImages || []).map((img: string, idx: number) => (
                          <motion.div 
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="aspect-[4/3] rounded-[10px] overflow-hidden border border-white/10 group relative"
                          >
                            <OptimizedImage 
                              src={img} 
                              fallbackType="default" 
                              alt="Slika" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              containerClassName="w-full h-full"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                               <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                                  PREGLED RADA
                               </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Availability Calendar */}
                <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
                   <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                     <span className="material-symbols-outlined text-lg">calendar_month</span>
                     ZAUZEĆE I REZERVACIJE
                   </h2>
                   <AvailabilityCalendar 
                     mode="view"
                     events={(profile.events || []) as CalendarEvent[]}
                     onBookRequest={async (start, end) => {
                       const msg = `Poštovani, interesuje me mogućnost Vašeg angažmana za period od ${start.toLocaleDateString()} do ${end.toLocaleDateString()}. Da li ste slobodni u ovom terminu?`;
                       const convId = await startConversation(profile.id || '', undefined, msg);
                       if (convId) {
                         navigate(`/poruke?id=${convId}`);
                       }
                     }}
                   />
                </section>
             </div>

             {/* Right Column: Sidebar */}
             <div className="space-y-8">
                {/* User Ads Section */}
                {(userAds?.machines?.length || 0) > 0 || (userAds?.accommodations?.length || 0) > 0 || (userAds?.caterings?.length || 0) > 0 || (userAds?.plots?.length || 0) > 0 ? (
                  <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em]">AKTIVNI OGLASI</h2>
                      <div className="flex-1 h-px bg-white/5"></div>
                    </div>

                    <div className="space-y-4">
                      {userAds?.machines?.map((machine: Record<string, unknown>, idx: number) => (
                        <Link key={machine.id || `machine-${idx}`} to={getMachineLink(String(machine.id))} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-[10px] hover:border-secondary/30 transition-all group">
                          <div className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center text-secondary group-hover:scale-110 transition-transform flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-secondary">{String(machine.adTitle || '')}</h4>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">MAŠINE</p>
                          </div>
                        </Link>
                      ))}

                      {userAds?.accommodations?.map((acc: Record<string, unknown>, idx: number) => (
                        <Link key={acc.id || `acc-${idx}`} to={getAccommodationLink(String(acc.id))} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-[10px] hover:border-secondary/30 transition-all group">
                          <div className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">home_work</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-secondary">{String(acc.title || '')}</h4>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">SMEŠTAJ</p>
                          </div>
                        </Link>
                      ))}

                      {userAds?.caterings?.map((cat: Record<string, unknown>, idx: number) => (
                        <Link key={cat.id || `cat-${idx}`} to={getCateringLink(String(cat.id))} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-[10px] hover:border-secondary/30 transition-all group">
                          <div className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">restaurant</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-secondary">{String(cat.title || '')}</h4>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">KETERING</p>
                          </div>
                        </Link>
                      ))}

                      {userAds?.plots?.map((plot: Record<string, unknown>, idx: number) => (
                        <Link key={plot.id || `plot-${idx}`} to={getPlotLink(String(plot.id))} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-[10px] hover:border-secondary/30 transition-all group">
                          <div className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">landscape</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-secondary">{String(plot.title || '')}</h4>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">PLAC</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
                <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
                   <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-8">DRUŠTVENE MREŽE</h3>
                   <div className="space-y-4">
                      {profile.facebook ? (
                         <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://${profile.facebook}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-[10px] border border-white/5 hover:bg-white/10 transition-all">
                            <span className="text-[10px] font-black uppercase text-white/60">FACEBOOK</span>
                            <span className="material-symbols-outlined text-white/20">open_in_new</span>
                         </a>
                      ) : (
                         <div className="p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-[10px] text-[9px] font-black text-white/10 text-center uppercase">FACEBOOK NIJE POVEZAN</div>
                      )}
                      
                      {profile.instagram ? (
                         <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-[10px] border border-white/5 hover:bg-white/10 transition-all">
                            <span className="text-[10px] font-black uppercase text-white/60">INSTAGRAM</span>
                            <span className="material-symbols-outlined text-white/20">open_in_new</span>
                         </a>
                      ) : (
                         <div className="p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-[10px] text-[9px] font-black text-white/10 text-center uppercase">INSTAGRAM NIJE POVEZAN</div>
                      )}
                   </div>
                </section>
                
                <section className="bg-white !text-black rounded-[10px] p-10 shadow-2xl flex flex-col gap-6">
                   <h3 className="text-[10px] font-black !text-black/20 uppercase tracking-[0.2em]">KONTAKT</h3>
                   <p className="text-sm font-bold uppercase tracking-tight !text-black/60 leading-relaxed">
                      ZAINTERESOVANI STE ZA SARADNJU? POŠALJITE PORUKU ILI POZOVITE DIREKTNO.
                   </p>
                   <button className="w-full py-5 bg-slate-950 text-white font-black rounded-[10px] text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform">POŠALJI PORUKU</button>
                   {String(profile.phone || (profile.cvData as { phone?: string })?.phone || '') && (
                      <a href={`tel:${String(profile.phone || (profile.cvData as { phone?: string })?.phone || '')}`} className="w-full py-5 bg-secondary !text-black font-black rounded-[10px] text-[10px] text-center uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-xl shadow-secondary/10">POZOVI ODMAH</a>
                   )}
                </section>
             </div>
          </div>
        </div>
        <RelatedSEO 
             locationSlug={LOCATIONS.find(l => l.name === ((profile as PublicProfileData)?.cvData?.location))?.slug || 'beograd'} 
             currentType="masters" 
        />
      </main>

      <Footer />
    </div>
  );
}
