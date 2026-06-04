import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useBrandLogo } from '@/src/context/BrandContext';
import { apiClient } from '@/src/lib/apiClient';
import { toast } from 'react-hot-toast';

export function BrandingTab() {
  const { logoUrl, setLogoUrl } = useBrandLogo();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingLogo(true);
    
    try {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = async () => {
            try {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 800;
              if (width > height) {
                if (width > maxDim) {
                  height *= maxDim / width;
                  width = maxDim;
                }
              } else {
                if (height > maxDim) {
                  width *= maxDim / height;
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Canvas toBlob failed"));
                try {
                  console.info("Requesting presigned URL...", new Date().toISOString());
                  
                  // Get Presigned URL
                  const { uploadUrl, downloadUrl } = await apiClient.post<{ uploadUrl: string; downloadUrl: string }>('/media/presigned', { 
                    contentType: 'image/webp',
                    folder: 'branding',
                    customFileName: 'branding/logo.webp'
                  });

                  console.info("Starting direct upload...", new Date().toISOString());
                  
                  // Direct PUT upload to GCS via the presigned URL
                  const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'image/webp',
                      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000'
                    },
                    body: blob
                  });

                  if (!uploadRes.ok) {
                    throw new Error("Neuspešan upload preko presigned rute.");
                  }

                  console.info("Upload complete, updating Firestore...", new Date().toISOString());
                  
                  // Log URL strictly via backend
                  await apiClient.patch('/admin/settings/branding', { updates: { logoUrl: downloadUrl } });
                  
                  console.info("Firestore updated.", new Date().toISOString());
                  
                  setLogoUrl(downloadUrl);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }, 'image/webp', 0.8);
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      toast.success("Logo uspešno sačuvan!");
    } catch (error: any) {
      console.error("Logo upload error:", error);
      toast.error(error?.response?.data?.error || error.message || "Greška pri čuvanju logotipa.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8 max-w-4xl"
    >
      <div className="flex items-center gap-4 mb-12">
        <div className="w-16 h-16 bg-purple-500 rounded-[10px] flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)]">
          <span className="material-symbols-outlined text-white text-4xl">palette</span>
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">PODEŠAVANJA BRENDA</h2>
          <p className="text-sm font-bold text-white/40 tracking-widest uppercase">Upravljanje vizuelnim identitetom</p>
        </div>
      </div>

      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8">GLOBALNI LOGO APPLIKACIJE</h3>
        
        <div className="flex items-center gap-12">
          <div className="w-48 h-48 bg-white/5 rounded-[10px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group">
            {logoUrl ? (
              <img width="800" height="600" decoding="async" src={logoUrl} alt="Svet Građevine" className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <span className="material-symbols-outlined text-white/20 text-6xl">image_not_supported</span>
            )}
            
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
               <span className="text-xs font-black text-white uppercase tracking-widest">Promeni sliku</span>
            </div>
            
            <input 
              type="file" 
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={isUploadingLogo}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm font-bold text-white/60 leading-relaxed">
              Lokalno kompresovanje: Logo se automatski smanjuje na <span className="text-secondary">WebP (max 800x800)</span> radi globalne brzine učitavanja.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/5 px-4 py-3 rounded-[10px] flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">MAX DIMENZIJA</span>
                <span className="text-xs font-black text-white">800x800 px</span>
              </div>
              <div className="bg-white/5 px-4 py-3 rounded-[10px] flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">FORMAT</span>
                <span className="text-xs font-black text-white">WEBP <span className="text-white/30 text-[9px]">(COMPRESSION 0.8)</span></span>
              </div>
            </div>
            
            {isUploadingLogo && (
              <div className="mt-4 flex items-center gap-3 text-secondary font-black text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                OBRADA I UPLOAD U TOKU... PUNO SAČEKAJTE...
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5">
           <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Uputstvo za nula Firebase upita</h4>
           <p className="text-xs font-bold text-white/40 leading-relaxed">
             Sistem koristi pametno keširanje putem <code className="bg-white/10 px-2 py-1 rounded text-secondary">localStorage</code> mehanizma.
             Logo se učitava sa servera <strong>samo jednom</strong> po sesiji korisnika (First Paint). Nakon inicijalnog učitavanja, 
             sačuva se na klijentu i svako naredno učitavanje se dešava trenutno sa 0 Firebase poziva. Prilikom uspešnog 
             uploada sa ove stranice, keš memorija se trenutno prazni i preispisuje, osiguravajući da promena bude odmah primenjena bez ključeva (F5).
           </p>
        </div>
      </div>
    </motion.div>
  );
}
