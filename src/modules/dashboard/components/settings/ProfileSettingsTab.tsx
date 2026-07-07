import React from 'react';
import { motion } from 'motion/react';
import { OptimizedImage } from '@/src/components/OptimizedImage';

interface ProfileSettingsTabProps {
  formData: any;
  errors: Record<string, string>;
  user: any;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  coverInputRef?: React.RefObject<HTMLInputElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleCoverChange?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function ProfileSettingsTab({
  formData,
  errors,
  user,
  fileInputRef,
  coverInputRef,
  handleInputChange,
  handleFileChange,
  handleCoverChange,
}: ProfileSettingsTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-10"
    >
      {user?.role === 'poslodavac' && (
        <div className="pb-10 border-b border-white/5 space-y-4">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">POZADINA PROFILA FIRME</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
            OVA SLIKA ĆE SE PRIKAZIVATI KAO POZADINA VAŠEG BIZNIS PROFILA. <span className="text-secondary opacity-60">(LIMIT: 100KB)</span>
          </p>
          <div className="relative group w-full h-48 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center overflow-hidden cursor-pointer hover:border-secondary transition-all" onClick={() => coverInputRef?.current?.click()}>
            {formData.coverImage ? (
              <OptimizedImage src={formData.coverImage} fallbackType="default" alt="Cover slika" className="w-full h-full object-cover" containerClassName="w-full h-full" />
            ) : (
              <span className="material-symbols-outlined text-white/20 text-6xl">wallpaper</span>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl">publish</span>
            </div>
            <input type="file" ref={coverInputRef} onChange={handleCoverChange} className="hidden" accept="image/*" />
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-white/5">
        <div className="relative group md:inline-block flex flex-col items-center mx-auto md:mx-0">
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
              <span className="text-6xl font-black !text-black">{formData.name.charAt(0) || 'U'}</span>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="md:absolute md:-bottom-3 md:-right-3 w-12 h-12 bg-secondary !text-black rounded-[10px] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform mt-2 md:mt-0"
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
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">IDENTITET NA PLATFORMI</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
            OVE INFORMACIJE SU JAVNE I POMAŽU KLIJENTIMA DA VAS PRONAĐU. FOTOGRAFIJA JE KLJUČNA ZA POVERENJE. <span className="text-secondary opacity-60">(LIMIT: 100KB)</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2 text-center md:text-left">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">IME I PREZIME</label>
            <input 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="npr. Marko Perić"
              className={`w-full bg-white/[0.03] border ${errors.name ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.name}</p>}
          </div>
          <div className="space-y-2 text-center md:text-left">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">TELEFON ZA KONTAKT</label>
            <input 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="npr. +381 60 123 4567"
              className={`w-full bg-white/[0.03] border ${errors.phone ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
            />
            {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.phone}</p>}
          </div>
        </div>

        {user?.role === 'poslodavac' && (
          <>
            <div className="space-y-2 text-center md:text-left">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">NAZIV FIRME</label>
              <input 
                name="company"
                value={formData.company || ''}
                onChange={handleInputChange}
                placeholder="npr. ENERGOPROJEKT D.O.O."
                className={`w-full bg-white/[0.03] border ${errors.company ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
              />
              {errors.company && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.company}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 text-center md:text-left">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">PIB FIRME</label>
                <input 
                  name="pib"
                  value={formData.pib || ''}
                  onChange={handleInputChange}
                  placeholder="npr. 102345678"
                  className={`w-full bg-white/[0.03] border ${errors.pib ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
                />
                {errors.pib && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.pib}</p>}
              </div>
              <div className="space-y-2 text-center md:text-left">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">WEBSAJT FIRME</label>
                <input 
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="npr. https://vasafirma.rs"
                  className={`w-full bg-white/[0.03] border ${errors.website ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
                />
                {errors.website && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.website}</p>}
              </div>
            </div>
          </>
        )}
        
        {user?.role !== 'standard' && user?.role !== 'poslodavac' && (
           <div className="space-y-2 text-center md:text-left">
             <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">VAŠA PROFESIJA / SPECIJALNOST</label>
             <input 
               name="profession"
               value={formData.profession}
               onChange={handleInputChange}
               placeholder="npr. Keramičar, Tesar, Šef gradilišta..."
               className={`w-full bg-white/[0.03] border ${errors.profession ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
             />
             {errors.profession && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.profession}</p>}
           </div>
        )}

        {user?.role !== 'standard' && (
          <>
            <div className="space-y-2 relative text-center md:text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">KRATAK OPIS / O NAMA</label>
                {(user?.role === 'poslodavac' || user?.role === 'company' || user?.role === 'business') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const comp = formData.company || formData.name || 'naša kompanija';
                      const generated = `Dobrodošli na profil firme ${comp}. Mi smo profesionalni tim specijalizovan za visokokvalitetne radove i usluge u građevinarstvu. Sa dugogodišnjim iskustvom i posvećenošću detaljima, garantujemo pouzdanost i stručnost na svakom projektu. Naš cilj je da vaše vizije pretvorimo u stvarnost, poštujući rokove i najviše standarde kvaliteta u industriji. Kontaktirajte nas za saradnju i uverite se u našu profesionalnost!`;
                      const fakeEvent = { target: { name: 'description', value: generated } } as any;
                      handleInputChange(fakeEvent);
                    }}
                    className="text-[10px] font-black text-secondary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Generiši AI Opis
                  </button>
                )}
              </div>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Opišite vaše iskustvo, misiju ili usluge koje nudite..."
                className={`w-full bg-white/[0.03] border ${errors.description ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none resize-none`}
              />
              {errors.description && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 text-center md:text-left">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">FACEBOOK PROFIL / STRANICA</label>
                   <input 
                     name="facebook"
                     value={formData.facebook}
                     onChange={handleInputChange}
                     placeholder="facebook.com/vas-profil"
                     className={`w-full bg-white/[0.03] border ${errors.facebook ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
                   />
                   {errors.facebook && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.facebook}</p>}
                </div>
                <div className="space-y-2 text-center md:text-left">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">INSTAGRAM PROFIL</label>
                   <input 
                     name="instagram"
                     value={formData.instagram}
                     onChange={handleInputChange}
                     placeholder="@vas_profil"
                     className={`w-full bg-white/[0.03] border ${errors.instagram ? 'border-red-500' : 'border-white/5'} rounded-[10px] py-5 px-6 text-sm text-center md:text-left font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none`}
                   />
                   {errors.instagram && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.instagram}</p>}
                </div>
            </div>
          </>
        )}

        <div className="pt-6 border-t border-white/5 text-center md:text-left">
          <div className="space-y-2 max-w-md mx-auto md:mx-0">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">EMAIL ADRESA (PRIVATNO)</label>
            <input 
              name="email"
              value={formData.email}
              className="w-full md:w-auto bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-[11px] md:text-sm font-bold tracking-widest uppercase opacity-40 cursor-not-allowed outline-none"
              disabled
            />
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/10 border border-yellow-500/30 flex items-center justify-center shrink-0 mx-auto md:mx-0">
              <span className="material-symbols-outlined text-yellow-400 text-2xl">verified</span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-black text-white uppercase tracking-tight">VERIFIKOVANA FIRMA</div>
              <p className="text-[9px] text-yellow-400/60 font-bold uppercase tracking-widest">ZLATNI BEDŽ · PROVEREN POSLODAVAC</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
