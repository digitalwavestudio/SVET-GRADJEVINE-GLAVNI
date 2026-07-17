import { OptimizedImage } from '@/src/components/OptimizedImage';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import CVEditor from '@/src/modules/jobs/components/CVEditor';
import { DashboardLayout } from '@/src/modules/core';
import ProfileHealth from '@/src/modules/dashboard/components/ProfileHealth';
import Spinner from '@/src/components/ui/Spinner';
import { useAuth } from '@/src/context/AuthContext';
import { getLazyAuth } from '@/src/lib/firebase';
import { uploadImage } from '@/src/lib/imageUtils';
import { userProfileSchema } from '@/src/modules/auth';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/src/lib/apiClient';
import { calculateProfileScore } from '../utils/profileCompletion';

import { ProfileSettingsTab } from '../components/settings/ProfileSettingsTab';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'cv' | 'applications'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'profile', label: 'JAVNI PROFIL', icon: 'visibility' },
    ...(user?.role === 'majstor' || user?.role === 'candidate' ? [
      { id: 'cv', label: 'MOJ CV', icon: 'description' },
      { id: 'applications', label: 'MOJE PRIJAVE', icon: 'assignment' }
    ] : [])
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    photoURL: '',
    coverImage: '',
    profession: '',
    description: '',
    facebook: '',
    instagram: '',

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

        // Prioritet dajemo logotipu firme ako je u pitanju poslodavac
        photoURL: user.role === 'poslodavac' 
          ? (user.businessProfile?.logo || '') 
          : (user.photoURL || ''),
        coverImage: user.role === 'poslodavac' ? (user.businessProfile?.coverImage || '') : '',
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
        toast.error(msg);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSaving(true);
      try {
        const url = await uploadImage(file, 'profiles/covers', 'avatar');
        setFormData(prev => ({ ...prev, coverImage: url }));
        toast.success("Pozadinska slika je uspešno postavljena");
      } catch (error: unknown) {
        toast.error('Greška pri uploadu pozadinske slike');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const calculateScore = (data: Record<string, any>) => {
    const mergedUser = {
      ...user,
      ...data,
      businessProfile: user?.role === 'poslodavac' ? {
        ...user?.businessProfile,
        logo: data.photoURL || user?.businessProfile?.logo,
        coverImage: user?.businessProfile?.coverImage,
        companyName: data.company || user?.businessProfile?.companyName
      } : user?.businessProfile
    };
    return calculateProfileScore(mergedUser);
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
        instagram: formData.instagram,
        company: formData.company
      };

      const result = userProfileSchema.safeParse(validationData);
      
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        const errorDetails = result.error.issues.map(issue => {
          const field = String(issue.path[0] ?? 'forma');
          newErrors[field] = issue.message;
          return `${field}: ${issue.message}`;
        }).join(', ');
        
        setErrors(newErrors);
        throw new Error(`Molimo ispravite greške u formi. Razlog: ${errorDetails}`);
      }

      const score = calculateScore(formData);
      const updateData: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone,
        profileScore: score
      };

      if (user.role === 'poslodavac') {
        updateData.company = formData.company;
        updateData.description = formData.description;
        updateData.facebook = formData.facebook;
        updateData.instagram = formData.instagram;
        updateData.businessProfile = {
          ...user.businessProfile,
          logo: formData.photoURL,
          coverImage: formData.coverImage,
          companyName: formData.company,
        };
      } else {
        if (formData.profession) updateData.profession = formData.profession;
        if (formData.description) updateData.description = formData.description;
        if (formData.facebook) updateData.facebook = formData.facebook;
        if (formData.instagram) updateData.instagram = formData.instagram;
        updateData.photoURL = formData.photoURL;
        updateData.businessProfile = {
          ...user.businessProfile,
          logo: formData.photoURL,
        };
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
      <div className="max-w-7xl mx-auto space-y-10">
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
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 text-center md:text-left">{user?.role === 'poslodavac' ? 'VAŠ BIZNIS PROFIL' : 'MOJ PROFIL'}</h1>
          <p className="text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase text-center md:text-left">UPRAVLJAJTE VAŠIM PODACIMA I BIOGRAFIJOM</p>
        </motion.div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Navigation Sidebar */}
          {tabs.length > 1 && (
            <div className="space-y-2">
              {tabs.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as "profile" | "cv" | "applications")}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[10px] transition-all text-[10px] font-black tracking-widest uppercase ${
                    activeSection === section.id 
                      ? 'bg-secondary !text-black shadow-lg shadow-secondary/10' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div className={tabs.length > 1 ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
            <div className="hidden md:block">
              <ProfileHealth score={liveScore} hideButton={true} />
            </div>
            
            <div className={activeSection === 'profile'
              ? "bg-[#0A0F14] border border-white/5 rounded-[10px] px-0 md:px-10 py-6" 
              : "space-y-6"
            }>
              {activeSection === 'profile' && (
                <ProfileSettingsTab 
                  formData={formData}
                  errors={errors}
                  user={user}
                  fileInputRef={fileInputRef}
                  coverInputRef={coverInputRef}
                  handleInputChange={handleInputChange}
                  handleFileChange={handleFileChange}
                  handleCoverChange={handleCoverChange}
                />
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

              <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-center md:justify-end gap-4">
                <button onClick={() => window.location.href = '/kontrolna-tabla'} className="w-full md:w-auto px-8 py-4 rounded-[10px] text-[10px] font-black tracking-widest uppercase text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all">ODUSTANI</button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || user?.syncStatus === 'syncing'}
                  className="w-full md:w-auto bg-secondary !text-black font-black px-10 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-[0.2em] uppercase shadow-2xl shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
                      const authInst = await getLazyAuth();
                      if (!authInst.currentUser) return;
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
