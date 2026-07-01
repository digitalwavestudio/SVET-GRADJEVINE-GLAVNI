import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useCompaniesList, useCompanyAdMutations } from '@/src/modules/companies/hooks/useCompanies';
import { Company as CompanyAd } from '@/src/modules/companies/types/models';
import { uploadImageDirectly } from '@/src/lib/imageCompressor';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Naziv firme je obavezan'),
  pib: z.string().min(1, 'PIB je obavezan'),
  locationSlug: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional().refine(val => {
    if (!val) return true;
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,})([/\w .-]*)*\/?$/i.test(val);
  }, { message: 'Unesite ispravan URL format za web sajt.' }),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  companyPortfolioImages: z.array(z.string()).default([]),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function MyCompanyPage() {
  const { user, updateUser } = useAuth();
  
  const { data: companiesData, isLoading: loading } = useCompaniesList({ authorId: user?.id } as any);
  const companies = companiesData?.pages.flatMap(page => page?.items || []) || [];
  
  const { addCompanyAd, updateCompanyAd } = useCompanyAdMutations();

  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyAd | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      pib: '',
      locationSlug: '',
      phone: '',
      description: '',
      instagram: '',
      facebook: '',
      website: '',
      logo: '',
      coverImage: '',
      companyPortfolioImages: [],
    },
    mode: 'onSubmit'
  });

  const logoUrl = watch('logo');
  const coverUrl = watch('coverImage');
  const portfolioImages = watch('companyPortfolioImages') || [];

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (user && !loading && !hasInitializedRef.current) {
      const existing = companies.find((c: any) => c.authorId === user.id);
      if (existing) {
        hasInitializedRef.current = true;
        setCompanyData(existing);
        reset({
          name: existing.name || '',
          pib: existing.pib || '',
          locationSlug: existing.locationSlug || '',
          phone: existing.phone || '',
          description: existing.description || '',
          instagram: existing.instagram || '',
          facebook: existing.facebook || '',
          website: existing.website || '',
          logo: existing.logo || '',
          coverImage: existing.coverImage || '',
          companyPortfolioImages: existing.portfolioImages || [],
        });
      } else {
        hasInitializedRef.current = true;
        reset((prev: any) => ({
          ...prev,
          name: user.company || '',
          phone: user.phone || ''
        }));
      }
    }
  }, [user, companies, loading, reset]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaving(true);
      try {
        const url = await uploadImageDirectly(file);
        setValue('logo', url, { shouldDirty: true });
      } catch (error: any) {
        alert(error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaving(true);
      try {
        const url = await uploadImageDirectly(file);
        setValue('coverImage', url, { shouldDirty: true });
      } catch (error: any) {
        alert(error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    setSaving(true);
    try {
      const uploadPromises = files.map(file => uploadImageDirectly(file));
      const urls = await Promise.all(uploadPromises);
      setValue('companyPortfolioImages', [...portfolioImages, ...urls], { shouldDirty: true });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removePortfolioImage = (index: number) => {
    const newImages = portfolioImages.filter((_: any, i: number) => i !== index);
    setValue('companyPortfolioImages', newImages, { shouldDirty: true });
  };

  const handleAIGenerate = async () => {
    const name = watch('name');
    const location = watch('locationSlug');
    if (!name) {
      alert("Molimo unesite Naziv Firme pre generisanja opisa.");
      return;
    }
    
    // Simulacija AI endpointa dok ga ne napravimo pravog:
    const locationObj = LOCATIONS.find(l => l.slug === location);
    const locName = locationObj ? locationObj.name : location;
    const simDescription = `Mi smo ${name}, profesionalni tim stručnjaka lociran u mestu ${locName}. Posvećeni smo pružanju vrhunskih usluga i garantujemo kvalitet u svakom segmentu našeg poslovanja. Naše dugogodišnje iskustvo i brojni zadovoljni klijenti svedoče o našoj pouzdanosti i stručnosti.`;
    
    setValue('description', simDescription, { shouldDirty: true });
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const payload: any = {
        ...data,
        type: 'company',
        authorId: user.id,
        status: 'active',
        isPremium: true,
        companyName: data.name,
        companyPIB: data.pib || '',
        companyDescription: data.description || '',
        companyAddress: data.location || '',
        portfolioImages: data.companyPortfolioImages,
        images: data.companyPortfolioImages || [],
        
        // Postavljamo podrazumevane (prazne) vrednosti za zaostala legacy polja
        address: { street: '', city: '', country: '' },
        workingHours: '',
        mainCategories: [],
        subCategories: [],
        coverageType: 'local',
        coverageValue: '',
        coverImage: data.coverImage || '',
        employeeCount: '1-5',
        references: [],
        licenses: [],
        certifications: [],
        teamSpecialties: [],
        equipmentSummary: ''
      };

      if (companyData && companyData.id) {
        await updateCompanyAd({ id: companyData.id, data: payload as any });
      } else {
        await addCompanyAd(payload);
      }

      // Sync to Auth Profile
      await updateUser({
        company: data.name,
        phone: data.phone,
        businessProfile: {
          ...user.businessProfile,
          companyName: data.name,
          logo: data.logo,
          coverImage: data.coverImage,
          pib: data.pib
        } as any
      });

      alert("Podaci su sačuvani i profil firme je ažuriran.");
    } catch (error: any) {
      console.error(error);
      let errMsg = error?.response?.data?.error || error?.message || "Nepoznata greška";
      if (error?.response?.data?.details) {
         errMsg += "\nDetalji: " + JSON.stringify(error.response.data.details);
      }
      alert("Greška pri čuvanju podataka: " + errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-12 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">PROFIL FIRME</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">POPUNITE PROFIL I DODAĆEMO VAS U ADRESAR</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          {/* Pozadina profila */}
          <div className="w-full space-y-4">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Pozadina Profila</h4>
            <div 
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-48 bg-white/5 shadow-2xl rounded-[10px] border border-white/5 flex items-center justify-center overflow-hidden cursor-pointer group relative"
            >
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-white/10 text-6xl">wallpaper</span>
              )}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <span className="material-symbols-outlined text-white">publish</span>
              </div>
            </div>
            <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
          </div>

          {/* Logo i Osnovno */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="w-full md:w-1/3 space-y-4">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Logo Firme</h4>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-white shadow-2xl rounded-[10px] border-4 border-white/5 flex items-center justify-center overflow-hidden cursor-pointer group relative"
              >
                {logoUrl ? (
                  <img width="800" height="600" decoding="async" src={logoUrl} alt="Logo" className="w-full h-full object-contain" loading="lazy" />
                ) : (
                  <span className="material-symbols-outlined text-black/10 text-6xl">add_business</span>
                )}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">publish</span>
                </div>
              </div>
              <input aria-label="Unos polja" type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            </div>

            <div className="w-full md:w-2/3 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Naziv Firme *</label>
                <input 
                  {...register('name')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message as string}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">PIB (Javno vidljiv) *</label>
                <input 
                  {...register('pib')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
                />
                {errors.pib && <p className="text-red-500 text-xs">{errors.pib.message as string}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Lokacija Sedišta</label>
                <select 
                  {...register('locationSlug')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center", backgroundSize: "1.2rem" }}
                >
                   <option value="" className="bg-[#0B1219] text-white">SVE LOKACIJE (OPCIONO)</option>
                   {LOCATIONS.map(loc => <option key={loc.slug} value={loc.slug} className="bg-[#0B1219] text-white">{loc.name}</option>)}
                </select>
                {errors.locationSlug && <p className="text-red-500 text-xs">{errors.locationSlug.message as string}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Email Adresa</label>
               <input 
                 value={user?.email || ''}
                 disabled
                 className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white/50 outline-none cursor-not-allowed"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Kontakt Telefon</label>
               <input 
                 {...register('phone')}
                 className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
               />
             </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Društvene Mreže i Sajt</h4>
            <div className="flex flex-col gap-6">
               {[
                 { name: 'website', icon: 'language', label: 'Web Sajt' },
                 { name: 'facebook', icon: 'facebook', label: 'Facebook' },
                 { name: 'instagram', icon: 'photo_camera', label: 'Instagram' }
               ].map(item => (
                 <div key={item.name} className="flex flex-col gap-2 relative">
                   <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-lg text-white/20 z-10 pointer-events-none">{item.icon}</span>
                   <input 
                     {...register(item.name as any)}
                     placeholder={item.label}
                     className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 pl-14 text-xs font-bold text-white outline-none focus:border-secondary transition-all placeholder:text-white/20" 
                   />
                   {errors[item.name as keyof CompanyFormValues] && <p className="text-red-500 text-xs">{errors[item.name as keyof CompanyFormValues]?.message as string}</p>}
                 </div>
               ))}
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-white/5 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Opis Firme</label>
              <button 
                type="button" 
                onClick={handleAIGenerate}
                className="flex items-center gap-2 text-secondary hover:text-white bg-secondary/10 hover:bg-secondary/20 transition-all px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest"
              >
                <span>✨</span> Generiši Opis sa AI
              </button>
            </div>
            <textarea 
              {...register('description')}
              rows={8}
              placeholder="Unesite kratak opis firme..."
              className="w-full bg-white/5 border border-white/10 rounded-[10px] p-6 text-xs font-bold text-white outline-none focus:border-secondary transition-all resize-none"
            ></textarea>
          </div>

          <div className="space-y-6 pt-6 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Portfolio Slike</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {portfolioImages.map((url: string, idx: number) => (
                <div key={idx} className="aspect-square relative rounded-[10px] overflow-hidden group">
                  <OptimizedImage src={url} fallbackType="company" alt="Slika" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removePortfolioImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-[10px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-secondary transition-all cursor-pointer">
                <span className="material-symbols-outlined text-white/20">add_a_photo</span>
                <input aria-label="Unos slika" type="file" multiple className="hidden" onChange={handlePortfolioUpload} accept="image/*" />
              </label>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-secondary !text-black font-black px-10 py-5 rounded-[10px] hover:bg-yellow-400 transition-all text-sm tracking-widest uppercase disabled:opacity-50 mt-10"
          >
            {saving ? 'ČUVANJE...' : 'SAČUVAJ IZMENE'}
          </button>
        </motion.div>
      </form>
    </DashboardLayout>
  );
}
