import { OptimizedImage } from '@/src/components/OptimizedImage';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import CVEditor from '@/src/modules/jobs/components/CVEditor';
import { DashboardLayout } from '@/src/modules/core';
import ProfileHealth from '@/src/modules/dashboard/components/ProfileHealth';
import Spinner from '@/src/components/ui/Spinner';
import { useAuth } from '@/src/context/AuthContext';
import { auth } from '@/src/firebase';
import { uploadImage } from '@/src/lib/imageUtils';
import { userProfileSchema } from '@/src/modules/auth';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/src/lib/apiClient';

import { Laptop, Phone, Fingerprint } from 'lucide-react';

const SessionManager = () => {
  const [sessions, setSessions] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await apiClient.get<Record<string, unknown>>('/auth/devices');
        if (Array.isArray(res.sessions)) setSessions(res.sessions as Record<string, unknown>[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const revokeOthers = async () => {
    try {
      await apiClient.post('/auth/devices/revoke-others', {});
      toast.success('Sve ostale sesije su prekinute.');
      const res = await apiClient.get<Record<string, unknown>>('/auth/devices');
      if (Array.isArray(res.sessions)) setSessions(res.sessions as Record<string, unknown>[]);
    } catch (e) {
      toast.error('Došlo je do greške prilikom prekidanja sesija.');
    }
  };

  return (
    <div className="bg-[#121A21] rounded-[10px] p-6 sm:p-8 border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl text-white font-black uppercase tracking-widest font-heading mb-2">Aktivne Sesije</h3>
          <p className="text-gray-400 text-sm">Upravljajte uređajima koji trenutno imaju pristup Vašem nalogu.</p>
        </div>
        <button 
          onClick={revokeOthers}
          className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-[10px] hover:bg-red-500/20 transition-all text-xs font-black uppercase tracking-wider"
        >
          Odjavi sve ostale uređaje
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="h-20 flex items-center justify-center"><div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div></div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">Nema aktivnih sesija.</div>
        ) : (
          sessions.map((session, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                   {String(session.userAgent || '').includes('Mobile') ? <Phone size={18} /> : <Laptop size={18} />}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{String(session.userAgent || 'Nepoznat uređaj')}</div>
                  <div className="text-gray-500 text-xs mt-1">Zadnja aktivnost:{' '}
                    {new Date(((session as { lastActive?: string | number | Date })?.lastActive as string | number | Date)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'cv' | 'applications' | 'security' | 'notifications'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    photoURL: '',
    profession: '',
    description: '',
    facebook: '',
    instagram: '',
    mb: '',
    pib: '',
    licences: [] as string[],
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Dinamička sinhronizacija sa kontekstom korisnika
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        company: user.company || '',
        profession: user.profession || '',
        description: user.description || '',
        facebook: user.facebook || '',
        instagram: user.instagram || '',
        mb: user.mb || '',
        pib: user.pib || '',
        licences: user.licences || [],
        // Prioritet dajemo logotipu firme ako je u pitanju poslodavac
        photoURL: user.role === 'poslodavac' 
          ? (user.businessProfile?.logo || '') 
          : (user.photoURL || ''),
        phone: String((user as unknown as { phone?: string })?.phone || '') || ''
      }));
    }
  }, [user]);

  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    sms: false,
    marketing: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSaving(true);
      try {
        const url = await uploadImage(file, 'profiles/avatars', 'avatar');
        setFormData(prev => ({ ...prev, photoURL: url }));
        toast.success("Fotografija je uspešno zamenjena");
      } catch (error: unknown) {
        let msg = 'Greška pri uploadu';
        if (error instanceof Error) msg = error.message;
        if (error && typeof error === 'object') {
           const errObj = error as Record<string, unknown>;
           if (errObj.response && typeof errObj.response === 'object') {
              const res = errObj.response as Record<string, unknown>;
              if (res.data && typeof res.data === 'object') {
                 const d = res.data as Record<string, unknown>;
                 if (typeof d.error === 'string') msg = d.error;
              }
           }
        }
        toast.error(msg);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const calculateScore = (data: Record<string, unknown>) => {
    let score = 0;
    if (data.name) score += 10;
    if (data.photoURL) score += 15;
    if (data.phone) score += 15;
    if (typeof data.description === 'string' && data.description.length > 10) score += 20;
    if (data.profession) score += 15;
    if (user?.hasCV) score += 15;
    if (data.facebook) score += 5;
    if (data.instagram) score += 5;
    return Math.min(score, 100);
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrors({});
    
    try {
      // Validate with Zod
      const validationData = {
        name: formData.name,
        phone: formData.phone,
        profession: formData.profession,
        description: formData.description,
        photoURL: formData.photoURL,
        facebook: formData.facebook,
        instagram: formData.instagram
      };

      const result = userProfileSchema.safeParse(validationData);
      
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          newErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(newErrors);
        throw new Error('Molimo ispravite greške u formi.');
      }

      const score = calculateScore(formData);
      const updateData: Record<string, unknown> = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        profession: formData.profession,
        description: formData.description,
        facebook: formData.facebook,
        instagram: formData.instagram,
        mb: formData.mb,
        pib: formData.pib,
        licences: formData.licences,
        profileScore: score
      };

      if (user.role === 'poslodavac') {
        // Za firme, photoURL u formi se koristi kao logo
        updateData.businessProfile = {
          ...user.businessProfile,
          logo: formData.photoURL
        };
        // Ne dupliramo photoURL ako već imamo logo, da ne pređemo 1MB
      } else {
        updateData.photoURL = formData.photoURL;
      }

      await updateUser(updateData);

      toast.success('Podešavanja su uspešno sačuvana!');
    } catch (error: unknown) {
      console.error(error);
      let msg = 'Greška pri čuvanju podešavanja.';
      if (error instanceof Error) msg = error.message;
      if (error && typeof error === 'object') {
         const errObj = error as Record<string, unknown>;
         if (errObj.response && typeof errObj.response === 'object') {
            const res = errObj.response as Record<string, unknown>;
            if (res.data && typeof res.data === 'object') {
               const d = res.data as Record<string, unknown>;
               if (typeof d.error === 'string') msg = d.error;
            }
         }
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const liveScore = calculateScore(formData);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 px-4">
        {user?.syncStatus === 'syncing' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/10 border border-secondary/20 rounded-[10px] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex space-x-1">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1 }} 
                  className="w-1.5 h-1.5 bg-secondary rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} 
                  className="w-1.5 h-1.5 bg-secondary rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} 
                  className="w-1.5 h-1.5 bg-secondary rounded-full" 
                />
              </div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">SINHRONIZACIJA PROFILA U TOKU...</p>
            </div>
            <p className="text-[9px] text-secondary/60 font-bold uppercase tracking-widest hidden md:block">
              VAŠE IZMENE SE ŠALJU NA SVE AKTIVNE OGLASE I KONVERZACIJE
            </p>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">MOJ PROFIL</h1>
          <p className="text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">UPRAVLJAJTE VAŠIM PODACIMA I BIOGRAFIJOM</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Navigation Sidebar */}
          <div className="space-y-2">
            {[
              { id: 'profile', label: 'JAVNI PROFIL', icon: 'visibility' },
              { id: 'cv', label: 'MOJ CV', icon: 'description' },
              { id: 'applications', label: 'MOJE PRIJAVE', icon: 'assignment' },
              { id: 'security', label: 'BEZBEDNOST', icon: 'lock' },
              { id: 'notifications', label: 'NOTIFIKACIJE', icon: 'notifications' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as "profile" | "cv" | "applications" | "security" | "notifications")}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[10px] transition-all text-[10px] font-black tracking-widest uppercase ${
                  activeSection === section.id 
                    ? 'bg-secondary text-slate-950 shadow-lg shadow-secondary/10' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <ProfileHealth score={liveScore} hideButton={true} />
            
            <div className={activeSection === 'profile' || activeSection === 'security' || activeSection === 'notifications' 
              ? "bg-[#0A0F14] border border-white/5 rounded-[10px] p-10" 
              : "space-y-6"
            }>
              {activeSection === 'profile' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-white/5">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-[10px] bg-white flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-secondary transition-all p-2 shadow-2xl">
                        {formData.photoURL ? (
                          <OptimizedImage 
                            src={formData.photoURL} 
                            fallbackType="default" 
                            alt="Profilna slika" 
                            className="w-full h-full object-contain rounded-[5px]" 
                            containerClassName="w-full h-full"
                          /> 
                            
                        ) : (
                          <span className="text-6xl font-black text-slate-950">{formData.name.charAt(0)}</span>
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-3 -right-3 w-12 h-12 bg-secondary text-slate-950 rounded-[10px] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept="image/*"
                        />
                        <span className="material-symbols-outlined text-xl">photo_camera</span>
                      </button>
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">IDENTITET NA PLATFORMI</h3>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                        OVE INFORMACIJE SU JAVNE I POMAŽU KLIJENTIMA DA VAS PRONAĐU. FOTOGRAFIJA JE KLJUČNA ZA POVERENJE. <span className="text-secondary opacity-60">(LIMIT: 100KB)</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">IME I PREZIME</label>
                        <input 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="npr. Marko Perić"
                          className={`w-full bg-white/[0.03] border ${errors.name ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
                        />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">TELEFON ZA KONTAKT</label>
                        <input 
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="npr. +381 60 123 4567"
                          className={`w-full bg-white/[0.03] border ${errors.phone ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
                        />
                        {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.phone}</p>}
                      </div>
                    </div>

                    {user?.role === 'poslodavac' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">NAZIV FIRME</label>
                        <input 
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="npr. ENERGOPROJEKT D.O.O."
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                        />
                      </div>
                    )}
                    
                    {user?.role !== 'standard' && user?.role !== 'poslodavac' && (
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">VAŠA PROFESIJA / SPECIJALNOST</label>
                         <input 
                           name="profession"
                           value={formData.profession}
                           onChange={handleInputChange}
                           placeholder="npr. Keramičar, Tesar, Šef gradilišta..."
                           className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                         />
                       </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">KRATAK OPIS / O NAMA</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Opišite vaše iskustvo, misiju ili usluge koje nudite..."
                        className={`w-full bg-white/[0.03] border ${errors.description ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none`}
                      />
                      {errors.description && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">FACEBOOK PROFIL / STRANICA</label>
                          <input 
                            name="facebook"
                            value={formData.facebook}
                            onChange={handleInputChange}
                            placeholder="facebook.com/vas-profil"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">INSTAGRAM PROFIL</label>
                          <input 
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleInputChange}
                            placeholder="@vas_profil"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                          />
                       </div>
                    </div>

                    {(user?.role === 'poslodavac' || user?.role === 'majstor') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8 mt-8">
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">verified_user</span>
                            APR Verifikacija i Licence
                          </h4>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mb-6">
                            Unesite vaše poslovne podatke i licence kako biste dobili "TRUST ENGINE" bedž na vašem profilu. Ovi podaci se verifikuju od strane administracije.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Matični Broj (MB)</label>
                          <input 
                            name="mb"
                            value={formData.mb}
                            onChange={handleInputChange}
                            placeholder="npr. 12345678"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">PIB</label>
                          <input 
                            name="pib"
                            value={formData.pib}
                            onChange={handleInputChange}
                            placeholder="npr. 101234567"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-5 px-6 text-sm font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Selektor Inženjerskih i Izvođačkih Licenci</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {['Licenca 300', 'Licenca 310', 'Licenca 410', 'Licenca 411', 'Licenca 800', 'Majstorsko pismo', 'Sertifikat ISO', 'Ostale komorske licence'].map((lic) => (
                              <label key={lic} className="flex items-center gap-3 cursor-pointer group bg-white/[0.02] border border-white/5 p-4 rounded-[10px] hover:border-secondary transition-colors">
                                <input 
                                  type="checkbox"
                                  className="w-4 h-4 rounded-[4px] border-white/20 bg-transparent text-secondary focus:ring-secondary/20 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                                  checked={formData.licences.includes(lic)}
                                  onChange={(e) => {
                                    if (e.target.checked) setFormData(p => ({ ...p, licences: [...p.licences, lic] }));
                                    else setFormData(p => ({ ...p, licences: p.licences.filter(l => l !== lic) }));
                                  }}
                                />
                                <span className="text-[11px] font-bold text-white/70 group-hover:text-white transition-colors uppercase tracking-wider">{lic}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-6 border-t border-white/5">
                      <div className="space-y-2 max-w-md">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">EMAIL ADRESA (PRIVATNO)</label>
                        <input 
                          name="email"
                          value={formData.email}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-sm font-bold tracking-widest uppercase opacity-40 cursor-not-allowed outline-none"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'cv' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <CVEditor />
                </motion.div>
              )}

              {activeSection === 'applications' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8 text-center py-10"
                >
                  <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-[10px] flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">assignment</span>
                  </div>
                  <div className="max-w-md mx-auto space-y-4">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">PRATI SVOJE PRIJAVE</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                      OVDE MOŽETE VIDETI STATUS SVIH POSLOVA NA KOJE STE KONKURISALI.
                    </p>
                    <div className="pt-6">
                      <button 
                        onClick={() => window.location.href = '/moj-profil/prijave'}
                        className="bg-blue-500 text-white font-black px-10 py-5 rounded-[10px] hover:bg-blue-600 transition-all text-xs tracking-[0.2em] uppercase shadow-2xl shadow-blue-500/20"
                      >
                        POGLEDAJ MOJE PRIJAVE
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'security' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">TRENUTNA LOZINKA</label>
                      <input 
                        type="password"
                        name="currentPassword"
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">NOVA LOZINKA</label>
                        <input 
                          type="password"
                          name="newPassword"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">POTVRDI LOZINKU</label>
                        <input 
                          type="password"
                          name="confirmPassword"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[10px]">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="material-symbols-outlined text-blue-500 text-lg">info</span>
                      <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">SAVET ZA BEZBEDNOST</h4>
                    </div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed">
                      LOZINKA TREBA DA SADRŽI NAJMANJE 8 KARAKTERA, UKLJUČUJUĆI BROJEVE I SPECIJALNE ZNAKOVE.
                    </p>
                  </div>

                  <SessionManager />
                </motion.div>
              )}

              {activeSection === 'notifications' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {[
                    { key: 'email', label: 'EMAIL NOTIFIKACIJE', desc: 'PRIMAJTE OBAVEŠTENJA O NOVIM PORUKAMA I PRIJAVAMA NA EMAIL.' },
                    { key: 'browser', label: 'BROWSER NOTIFIKACIJE', desc: 'DOZVOLITE APLIKACIJI DA ŠALJE OBAVEŠTENJA DOK JE OTVORENA.' },
                    { key: 'sms', label: 'SMS OBAVEŠTENJA', desc: 'PRIMAJTE HITNA OBAVEŠTENJA PUTEM SMS PORUKA.' },
                    { key: 'marketing', label: 'MARKETING I PONUDE', desc: 'PRIMAJTE INFORMACIJE O NOVIM PAKETIMA I PROMOCIJAMA.' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[10px]">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{item.label}</h4>
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{item.desc}</p>
                      </div>
                      <button 
                        onClick={() => toggleNotification(item.key as "email" | "marketing" | "browser" | "sms")}
                        className={`w-12 h-6 rounded-full transition-all relative ${notifications[item.key as keyof typeof notifications] ? 'bg-secondary' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: notifications[item.key as keyof typeof notifications] ? 24 : 4 }}
                          className={`absolute top-1 w-4 h-4 rounded-full ${notifications[item.key as keyof typeof notifications] ? 'bg-slate-950' : 'bg-white/40'}`}
                        />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}

              <div className="mt-12 pt-8 border-t border-white/5 flex justify-end gap-4">
                <button className="px-8 py-4 rounded-[10px] text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white transition-all">ODUSTANI</button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || user?.syncStatus === 'syncing'}
                  className="bg-secondary text-slate-950 font-black px-10 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-[0.2em] uppercase shadow-2xl shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                  {isSaving && <Spinner className="w-4 h-4" />}
                  {isSaving ? 'ČUVANJE...' : user?.syncStatus === 'syncing' ? 'SINHRONIZACIJA...' : 'SAČUVAJ IZMENE'}
                </button>
              </div>

              {user?.syncStatus === 'failed' && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">sync_problem</span>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">SINHRONIZACIJA NIJE USPELA</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!auth.currentUser) return;
                      try {
                        await apiClient.post('/user/force-sync', {});
                        toast.success('Zahtev za sinhronizaciju je poslat.');
                      } catch (e: unknown) {
                        let msg = 'Greška pri sinhronizaciji';
                        if (e instanceof Error) msg = e.message;
                        if (e && typeof e === 'object') {
                           const errObj = e as Record<string, unknown>;
                           if (errObj.response && typeof errObj.response === 'object') {
                              const res = errObj.response as Record<string, unknown>;
                              if (res.data && typeof res.data === 'object') {
                                 const d = res.data as Record<string, unknown>;
                                 if (typeof d.error === 'string') msg = d.error;
                              }
                           }
                        }
                        toast.error(msg);
                        console.error(e);
                      }
                    }}
                    className="bg-red-500 text-white font-black px-6 py-3 rounded-[10px] hover:bg-red-600 transition-all text-[9px] tracking-[0.2em] uppercase"
                  >
                    POKUŠAJ PONOVO (FORCE SYNC)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
