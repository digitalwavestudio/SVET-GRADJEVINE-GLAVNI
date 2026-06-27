import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { BENEFITS, ACCOMMODATION_AMENITIES } from '@/src/constants/taxonomy';
import { COMPANY_MAIN_CATEGORIES, COMPANY_SUB_CATEGORIES } from '@/src/constants/companyTaxonomy';
import { MAX_IMAGE_SIZE_KB, MAX_AD_IMAGES } from '@/src/constants/limits';

export function Step3({
  handleImageUpload,
  removePortfolioImage,
  handlePortfolioUpload,
  selectedCategory,
  nextStep,
  prevStep,
  removeImage,
}: {
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePortfolioImage?: (index: number) => void;
  handlePortfolioUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCategory: string;
  nextStep?: () => void;
  prevStep?: () => void;
  removeImage?: (index: number) => void;
}) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const formData = watch();

  return (
    <>
      {/* STEP 3 - Company */}
      {selectedCategory === 'company' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">ballot</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Podkategorije i usluge</h2>
          </div>

          <div className="space-y-12 mb-16">
            {formData.companyMainCats?.map((mainCatId: string) => {
              const mainCat = COMPANY_MAIN_CATEGORIES.find(c => c.id === mainCatId);
              const subCats = COMPANY_SUB_CATEGORIES[mainCatId] || [];
              return (
                <div key={mainCatId} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-lg">{mainCat?.icon}</span>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white underline decoration-secondary/50 underline-offset-8 decoration-2">{mainCat?.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {subCats.map(sub => {
                      const isSelected = formData.companySubCats?.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            const current = formData.companySubCats || [];
                            const next = isSelected 
                              ? current.filter((s: string) => s !== sub)
                              : [...current, sub];
                            setValue('companySubCats', next);
                          }}
                          className={`px-6 py-3 rounded-[10px] border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isSelected ? 'bg-secondary border-secondary !text-black shadow-[0_0_20px_rgba(254,191,13,0.3)]' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.companySubCats && <p className="text-error text-[10px] font-bold mb-8 uppercase text-center">{errors.companySubCats.message as string}</p>}

          <div className="mt-16 space-y-12">
            <div className="bg-white/[0.02] p-8 rounded-[10px] border border-white/5 space-y-10">
               <h3 className="text-xl font-black uppercase text-secondary flex items-center gap-3">
                 <span className="material-symbols-outlined text-3xl">verified</span> Profesionalni B2B Profil
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Reference i Prethodni Projekti</label>
                     <textarea 
                       {...register('companyReferences')}
                       rows={5}
                       placeholder="Navedite najznačajnije projekte na kojima je vaša firma radila (svaki u novom redu)..."
                       className="w-full bg-white/5 border-2 border-white/5 rounded-[10px] px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-bold resize-none"
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Uža specijalnost tima</label>
                     <textarea 
                       {...register('companyTeamSpecialties')}
                       rows={5}
                       placeholder="U čemu je vaš tim najbolji? (Npr. armiranje, mašinski malter, niskogradnja...)"
                       className="w-full bg-white/5 border-2 border-white/5 rounded-[10px] px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-bold resize-none"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Licence preduzeća i inženjera</label>
                     <textarea 
                       {...register('companyLicenses')}
                       rows={4}
                       placeholder="Npr. Licenca 410, 411, Licenca ministarstva za... "
                       className="w-full bg-white/5 border-2 border-white/5 rounded-[10px] px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-bold resize-none"
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Sertifikati i Kvalitet (ISO, CE...)</label>
                     <textarea 
                       {...register('companyCertifications')}
                       rows={4}
                       placeholder="ISO 9001, OHSAS 18001, CE znak za opremu..."
                       className="w-full bg-white/5 border-2 border-white/5 rounded-[10px] px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-bold resize-none"
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Pregled sopstvene mehanizacije i opreme</label>
                  <textarea 
                    {...register('companyEquipmentSummary')}
                    rows={3}
                    placeholder="Npr. 3 bager gusenica, 2 kamiona kipera, sopstvena oplata 500m2..."
                    className="w-full bg-white/5 border-2 border-white/5 rounded-[10px] px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-bold resize-none"
                  />
               </div>

               <div className="pt-6 border-t border-white/5">
                  <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-secondary/5 rounded-[10px] border border-secondary/10">
                     <div className="w-16 h-16 bg-secondary/20 rounded-[10px] flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined text-secondary text-3xl">collections</span>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-black uppercase text-white mb-1">Portfolio Galerija</h4>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">Dodajte slike završenih projekata kako bi klijenti videli kvalitet vašeg rada.</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <input 
                          id="portfolio-upload"
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={handlePortfolioUpload}
                          className="hidden"
                        />
                        <button 
                          type="button"
                          onClick={() => document.getElementById('portfolio-upload')?.click()}
                          className="px-6 py-3 bg-secondary !text-black font-black rounded-[10px] text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all"
                        >
                          DODAJ SLIKE PROJEKATA
                        </button>
                     </div>
                  </div>

                  {formData.companyPortfolioImages?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-8">
                      {formData.companyPortfolioImages.map((img: string, idx: number) => (
                        <div key={idx} className="relative aspect-[4/3] rounded-[10px] overflow-hidden border border-white/10 group">
                           <img width="800" height="600" decoding="async" src={img} alt="Portfolio" className="w-full h-full object-cover" loading="lazy" />
                           <button 
                             type="button"
                             onClick={() => removePortfolioImage?.(idx)}
                             className="absolute top-2 right-2 w-8 h-8 bg-black/80 text-white rounded-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                           >
                             <span className="material-symbols-outlined text-sm">close</span>
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className={UI_TOKENS.BTN_SECONDARY}>Nazad</button>
            <button type="button" onClick={nextStep} className={UI_TOKENS.BTN_POST_AD}>Nastavi</button>
          </div>
        </motion.div>
      )}

      {/* STEP 3 - Others */}
      {selectedCategory !== 'company' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">description</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Opis i Kontakt</h2>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end ml-1">
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Detaljan opis posla *</label>
                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.opis?.length < 50 ? 'text-error' : 'text-secondary'}`}>
                  {formData.opis?.length || 0} / 3000
                </span>
              </div>
              <div className="relative group">
                <textarea 
                  {...register('opis')}
                  rows={10}
                  className={`w-full bg-white/5 border-2 ${errors.opis ? 'border-error/50' : 'border-white/5'} rounded-[10px] px-6 py-6 text-white focus:border-secondary/50 outline-none transition-all font-medium group-hover:bg-white/[0.08] resize-none leading-relaxed`}
                  placeholder={
                    selectedCategory === 'marketplace' ? "Opišite predmet koji prodajete, njegovo stanje, razlog prodaje i specifikacije..." :
                    selectedCategory === 'accommodation' ? "Opišite smeštajni kapacitet, blizinu gradilišta, pravila boravka i dodatne usluge..." :
                    selectedCategory === 'catering' ? "Opišite Vašu ketering ponudu, kapacitete, način dostave i sastav obroka..." :
                    selectedCategory === 'machines' ? "Opišite mašinu, njeno tehničko stanje, prethodne radove i istoriju održavanja..." :
                    selectedCategory === 'plot' ? "Opišite plac, njegovu poziciju, mogućnosti gradnje i infrastrukturne prednosti..." :
                    "Navedite ključna zaduženja, uslove rada, radno vreme i sve što smatrate bitnim za kandidate..."
                  }
                />
              </div>
              {errors.opis && <p className="text-error text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.opis.message as string}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Kontakt Telefon *</label>
                <div className="relative group">
                  <input 
                    type="tel"
                    {...register('phone')}
                    placeholder="Npr. 0601234567"
                    className={`w-full bg-white/5 border-2 ${errors.phone ? 'border-error/50' : 'border-white/5'} rounded-[10px] px-6 py-5 text-white focus:border-secondary/50 outline-none transition-all font-bold group-hover:bg-white/[0.08]`}
                  />
                  <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-hover:text-secondary transition-colors">call</span>
                </div>
                {errors.phone && <p className="text-error text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.phone.message as string}</p>}
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Dostupni ste na</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setValue('viber', !formData.viber)}
                    className={`flex-1 py-5 rounded-[10px] border-2 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${formData.viber ? 'bg-[#7360F2]/10 border-[#7360F2] text-[#7360F2]' : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'}`}
                  >
                    Viber
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('whatsapp', !formData.whatsapp)}
                    className={`flex-1 py-5 rounded-[10px] border-2 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${formData.whatsapp ? 'bg-[#25D366]/10 border-[#25D366] text-[#25D366]' : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'}`}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {selectedCategory !== 'job' && (
            <div className="p-8 bg-white/[0.02] rounded-[10px] border border-white/5 mt-6 group hover:bg-white/[0.04] transition-all">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-20 h-20 bg-secondary/10 rounded-[10px] flex items-center justify-center shrink-0 border border-secondary/20">
                  <span className="material-symbols-outlined text-4xl text-secondary">add_photo_alternate</span>
                </div>
                <div className="flex-1 w-full">
                  <h4 className="text-xl font-black uppercase tracking-tight mb-2 font-headline">Vizuelni identitet oglasa</h4>
                  <p className="text-sm text-on-surface-variant mb-4 font-medium">
                    Oglasi sa slikama gradilišta imaju <span className="text-white font-bold">3x veći broj prijava</span>. Maksimalno {MAX_AD_IMAGES} slika, do {MAX_IMAGE_SIZE_KB}KB po slici.
                  </p>
                  {errors.images && <p className="text-error text-[10px] font-bold mb-4 uppercase tracking-wider">{errors.images.message as string}</p>}
                  
                  <div className="space-y-6">
                    {formData.images?.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {formData.images.map((img: string, idx: number) => (
                          <div key={idx} className="relative aspect-square rounded-[10px] overflow-hidden border border-white/10 group/img">
                            <img width="800" height="600" decoding="async" src={img} alt="Oglas" className="w-full h-full object-cover" loading="lazy" />
                            <button 
                              type="button"
                              onClick={() => removeImage?.(idx)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-[10px] flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                        {formData.images.length < (MAX_AD_IMAGES || 20) && (
                          <button 
                            type="button"
                            onClick={() => document.getElementById('ad-image-upload')?.click()}
                            className="aspect-square rounded-[10px] border-2 border-dashed border-white/10 flex items-center justify-center hover:border-secondary/50 hover:bg-secondary/5 transition-all"
                          >
                            <span className="material-symbols-outlined text-white/20">add</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <input 
                        id="ad-image-upload"
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {(!formData.images || formData.images.length === 0) && (
                        <button 
                          type="button"
                          onClick={() => document.getElementById('ad-image-upload')?.click()}
                          className="bg-white/5 hover:bg-white/10 text-white font-black px-6 py-3 rounded-[10px] transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 border border-white/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">collections</span> Dodaj Slike
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="mt-16 flex flex-col-reverse md:flex-row justify-between gap-4">
            <button type="button" onClick={prevStep} className={UI_TOKENS.BTN_SECONDARY}>Nazad</button>
            <button type="button" onClick={nextStep} className={UI_TOKENS.BTN_POST_AD}>
              Nastavi dalje
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
