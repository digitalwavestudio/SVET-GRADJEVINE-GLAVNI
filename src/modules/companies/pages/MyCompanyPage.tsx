import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import {
  COMPANY_EMPLOYEE_RANGES,
  COMPANY_MAIN_CATEGORIES,
  COMPANY_SUB_CATEGORIES
} from '@/src/constants/companyTaxonomy';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useCompaniesList, useCompanyAdMutations } from '@/src/modules/companies/hooks/useCompanies';
import { Company as CompanyAd } from '@/src/modules/companies/types/models';
import { uploadImageDirectly } from '@/src/lib/imageCompressor';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Naziv firme je obavezan'),
  pib: z.string().min(1, 'PIB je obavezan'),
  address: z.string().optional(),
  locationSlug: z.string().min(1, 'Lokacija je obavezna'),
  phone: z.string().optional(),
  description: z.string().optional(),
  mainCategories: z.array(z.string()).default([]),
  subCategories: z.array(z.string()).default([]),
  coverageType: z.enum(['local', 'regional', 'national', 'international']).default('local'),
  coverageValue: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional().refine(val => {
    if (!val) return true;
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,})([/\w .-]*)*\/?$/i.test(val);
  }, { message: 'Unesite ispravan URL format za web sajt.' }),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  employeeCount: z.string().default('1-5'),
  companyPortfolioImages: z.array(z.string()).default([]),
  references: z.string().optional(),
  licenses: z.string().optional(),
  certifications: z.string().optional(),
  equipmentSummary: z.string().optional(),
  teamSpecialties: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function MyCompanyPage() {
  const { user, updateUser } = useAuth();
  
  const { data: companiesData, isLoading: loading } = useCompaniesList({ authorId: user?.id } as any);
  const companies = companiesData?.pages.flatMap(page => page?.items || []) || [];
  
  const { addCompanyAd, updateCompanyAd } = useCompanyAdMutations();

  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyAd | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      pib: '',
      address: '',
      locationSlug: 'be-beograd',
      phone: '',
      description: '',
      mainCategories: [],
      subCategories: [],
      coverageType: 'local',
      coverageValue: '',
      instagram: '',
      facebook: '',
      website: '',
      logo: '',
      coverImage: '',
      employeeCount: '1-5',
      companyPortfolioImages: [],
      references: '',
      licenses: '',
      certifications: '',
      equipmentSummary: '',
      teamSpecialties: ''
    },
    mode: 'onSubmit'
  });

  const mainCategories = watch('mainCategories');
  const subCategories = watch('subCategories');
  const coverageType = watch('coverageType');
  const logoUrl = watch('logo');
  const coverImageUrl = watch('coverImage');
  const portfolioImages = watch('companyPortfolioImages');

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
          address: existing.address || '',
          locationSlug: existing.locationSlug || 'be-beograd',
          phone: existing.phone || '',
          description: existing.description || '',
          mainCategories: existing.mainCategories || [],
          subCategories: existing.subCategories || [],
          coverageType: (existing.coverageType as any) || 'local',
          coverageValue: existing.coverageValue || '',
          instagram: existing.instagram || '',
          facebook: existing.facebook || '',
          website: existing.website || '',
          logo: existing.logo || '',
          coverImage: existing.coverImage || '',
          employeeCount: existing.employeeCount || '1-5',
          companyPortfolioImages: existing.portfolioImages || [],
          references: existing.references?.join(', ') || '',
          licenses: existing.licenses?.join(', ') || '',
          certifications: existing.certifications?.join(', ') || '',
          equipmentSummary: existing.equipmentSummary || '',
          teamSpecialties: existing.teamSpecialties?.join(', ') || ''
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

  const toggleMainCategory = (catId: string) => {
    const isSelected = mainCategories.includes(catId);
    const newCats = isSelected 
      ? mainCategories.filter((c: string) => c !== catId)
      : [...mainCategories, catId];
    
    // Clean up subcategories if main is removed
    let newSubCats = subCategories;
    if (isSelected) {
      const remainingSubs = COMPANY_SUB_CATEGORIES[catId] || [];
      newSubCats = subCategories.filter((s: string) => !remainingSubs.includes(s));
    }

    setValue('mainCategories', newCats, { shouldValidate: true, shouldDirty: true });
    setValue('subCategories', newSubCats, { shouldValidate: true, shouldDirty: true });
  };

  const toggleSubCategory = (subName: string) => {
    const newSubCats = subCategories.includes(subName)
      ? subCategories.filter((s: string) => s !== subName)
      : [...subCategories, subName];
    setValue('subCategories', newSubCats, { shouldValidate: true, shouldDirty: true });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaving(true);
      try {
        // 7. Direktni Client-Side Upload i Kompresija 
        const url = await uploadImageDirectly(file);
        setValue('logo', url, { shouldDirty: true });
      } catch (error: any) {
        alert(error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaving(true);
      try {
        // 7. Direktni Client-Side Upload i Kompresija 
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

  const onSubmit = async (data: any) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const payload: Omit<CompanyAd, 'id' | 'createdAt'> = {
        ...data,
        authorId: user.id,
        status: 'active',
        isPremium: true,
        // Map Phase 2 strings back to arrays
        portfolioImages: data.companyPortfolioImages,
        references: data.references ? data.references.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        licenses: data.licenses ? data.licenses.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        certifications: data.certifications ? data.certifications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        teamSpecialties: data.teamSpecialties ? data.teamSpecialties.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        equipmentSummary: data.equipmentSummary
      } as any;

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
          logo: data.logo,
          pib: data.pib
        } as any
      });

      alert("Podaci su sačuvani i profil firme je ažuriran.");
    } catch (error) {
      console.error(error);
      alert("Greška pri čuvanju podataka.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">PROFIL FIRME</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">UPRAVLJAJTE JAVNIM PODACIMA VAŠE KOMPANIJE</p>
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="bg-secondary text-slate-950 font-black px-10 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-xs tracking-widest uppercase disabled:opacity-50"
          >
            {saving ? 'ČUVANJE...' : 'SAČUVAJ IZMENE'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 gap-8 overflow-x-auto no-scrollbar">
          {['Osnovno', 'Usluge', 'Pokrivenost', 'Vizuelno', 'Portfolio & B2B'].map((stepName, idx) => (
            <button
              type="button"
              key={stepName}
              onClick={() => setActiveStep(idx + 1)}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeStep === idx + 1 ? 'text-secondary' : 'text-white/40 hover:text-white'}`}
            >
              {stepName}
              {activeStep === idx + 1 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"></div>}
            </button>
          ))}
        </div>

        {activeStep === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Lokacija Sedišta *</label>
                <select 
                  {...register('locationSlug')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
                >
                   {LOCATIONS.map(loc => <option key={loc.slug} value={loc.slug}>{loc.name}</option>)}
                </select>
                {errors.locationSlug && <p className="text-red-500 text-xs">{errors.locationSlug.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Tačna Adresa</label>
                <input 
                  {...register('address')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Broj Zaposlenih</label>
                <select 
                  {...register('employeeCount')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
                >
                   {COMPANY_EMPLOYEE_RANGES.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Kontakt Telefon</label>
                <input 
                  {...register('phone')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Opis Firme i Istorijat</label>
              <textarea 
                {...register('description')}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-[10px] p-6 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all resize-none"
              ></textarea>
            </div>
          </motion.div>
        )}

        {activeStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div>
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6">GLAVNE DELATNOSTI (Odaberite jednu ili više)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {COMPANY_MAIN_CATEGORIES.map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => toggleMainCategory(cat.id)}
                    className={`p-4 rounded-[10px] border-2 transition-all flex flex-col items-center gap-3 ${mainCategories?.includes(cat.id) ? 'border-secondary bg-secondary/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                  >
                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                    <span className="text-[9px] font-black uppercase text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {mainCategories?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6">SPECIFIČNE USLUGE</h3>
                <div className="flex flex-wrap gap-2">
                   {mainCategories.flatMap((catId: string) => COMPANY_SUB_CATEGORIES[catId] || []).map((sub: string) => (
                     <button
                       type="button"
                       key={sub}
                       onClick={() => toggleSubCategory(sub)}
                       className={`px-4 py-2 rounded-[10px] text-[9px] font-black uppercase tracking-widest border transition-all ${subCategories?.includes(sub) ? 'bg-secondary text-slate-950 border-secondary' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'}`}
                     >
                       {sub}
                     </button>
                   ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeStep === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Područje rada *</label>
                {[
                  { id: 'local', name: 'Lokalno (grad/opština)' },
                  { id: 'regional', name: 'Regionalno (ceo region)' },
                  { id: 'national', name: 'Cela Srbija' },
                  { id: 'international', name: 'Inostranstvo' }
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setValue('coverageType', opt.id as any, { shouldValidate: true, shouldDirty: true })}
                    className={`w-full p-5 rounded-[10px] border-2 text-left transition-all flex items-center justify-between ${coverageType === opt.id ? 'border-secondary bg-secondary/10' : 'border-white/5 bg-white/5'}`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-wider ${coverageType === opt.id ? 'text-secondary' : 'text-white'}`}>{opt.name}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${coverageType === opt.id ? 'border-secondary' : 'border-white/20'}`}>
                      {coverageType === opt.id && <div className="w-2.5 h-2.5 bg-secondary rounded-full"></div>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Detalji lokacija</label>
                <textarea 
                  {...register('coverageValue')}
                  rows={8}
                  placeholder="Navedite gradove ili regije..."
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-6 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </motion.div>
        )}

        {activeStep === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Logo Upload */}
              <div className="space-y-6">
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

              {/* Cover Image Upload */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Naslovna Slika (Cover)</h4>
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className="aspect-square bg-white/5 rounded-[10px] border-4 border-dashed border-white/5 flex items-center justify-center overflow-hidden cursor-pointer group relative"
                >
                  {coverImageUrl ? (
                    <img width="800" height="600" decoding="async" src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="material-symbols-outlined text-white/10 text-6xl">image</span>
                  )}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">publish</span>
                  </div>
                </div>
                <input aria-label="Unos polja" type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-white/5">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Društvene Mreže i Sajt</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { name: 'website', icon: 'language', label: 'Web Sajt' },
                   { name: 'facebook', icon: 'facebook', label: 'Facebook' },
                   { name: 'instagram', icon: 'photo_camera', label: 'Instagram' }
                 ].map(item => (
                   <div key={item.name} className="flex flex-col gap-2">
                     <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-[10px] px-6 py-4 focus-within:border-secondary/50 transition-all">
                       <span className="material-symbols-outlined text-lg text-white/20">{item.icon}</span>
                       <input 
                         {...register(item.name as any)}
                         placeholder={item.label}
                         className="bg-transparent border-none outline-none text-[11px] font-bold text-white w-full placeholder:text-white/10" 
                       />
                     </div>
                     {errors[item.name as keyof CompanyFormValues] && <p className="text-red-500 text-xs">{errors[item.name as keyof CompanyFormValues]?.message as string}</p>}
                   </div>
                 ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeStep === 5 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Reference (Razdvojite zarezom)</label>
                <textarea 
                  {...register('references')}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all resize-none"
                  placeholder="Npr. Projekt X, Izgradnja Y..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Licence i Sertifikati (Svojstva)</label>
                <textarea 
                  {...register('licenses')}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all resize-none"
                  placeholder="Licenca 1, Licenca 2..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Sertifikati (ISO, CE...)</label>
                <textarea 
                  {...register('certifications')}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all resize-none"
                  placeholder="ISO 9001, CE znak..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Specijalnosti tima</label>
                <input 
                  {...register('teamSpecialties')}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all"
                  placeholder="Zavarivanje, Armiranje..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Pregled Mehanizacije</label>
                <textarea 
                  {...register('equipmentSummary')}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white uppercase outline-none focus:border-secondary transition-all resize-none"
                  placeholder="Bageri 5t, Kamioni..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Portfolio Galerija</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {portfolioImages?.map((url: string, idx: number) => (
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
                  <input aria-label="Unos polja" type="file" multiple className="hidden" onChange={handlePortfolioUpload} accept="image/*" />
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </DashboardLayout>
  );
}

