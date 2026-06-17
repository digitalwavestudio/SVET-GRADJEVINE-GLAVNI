import React from 'react';
import { motion } from 'motion/react';
import { OptimizedImage } from '@/src/components/OptimizedImage';

interface ProfileSettingsTabProps {
  formData: any;
  errors: Record<string, string>;
  user: any;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function ProfileSettingsTab({
  formData,
  errors,
  user,
  fileInputRef,
  handleInputChange,
  handleFileChange,
}: ProfileSettingsTabProps) {
  return (
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
              <span className="text-6xl font-black text-slate-950">{formData.name.charAt(0) || 'U'}</span>
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

        {user?.role !== 'standard' && (
          <>
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
          </>
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
  );
}
