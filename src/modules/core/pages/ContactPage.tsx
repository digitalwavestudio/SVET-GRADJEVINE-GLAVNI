import { OptimizedImage } from '@/src/components/OptimizedImage';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import SeoHead from '@/src/components/SeoHead';
import { APP_CONFIG } from '@/src/constants/config';
import { useToast } from '@/src/context/ToastContext';
import { trackEvent } from '@/src/lib/analytics';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Opšti upit', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast('Molimo popunite sva polja.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to send');

      trackEvent('Kontakt', 'Submit', 'Forma');
      addToast('Poruka uspešno poslata! Naš tim će Vas kontaktirati.', 'success');
      setFormData({ name: '', email: '', subject: 'Opšti upit', message: '' });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Greška pri slanju poruke:', error);
      addToast('Greška pri slanju poruke.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0F1923] text-white font-body selection:bg-secondary selection:text-on-secondary">
      <SeoHead 
        title="Kontakt | Svet Građevine"
        description="Kontaktirajte tim Svet Građevine za saradnju, reklamiranje ili podršku. Tu smo za sve vaše potrebe u građevinskoj industriji."
        type="website"
      />
      {/* Hero Section */}
      <header className="blueprint-pattern pt-48 pb-24 px-8 relative overflow-hidden border-b border-white/5">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-screen-xl mx-auto relative z-10 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold font-headline mb-6 tracking-tighter uppercase">
            Kontaktirajte <span className="text-secondary">Nas</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg md:text-xl font-medium">
            Povežite se sa najvećim portalom za građevinsku industriju u regionu. Naš tim je tu da odgovori na sve vaše upite.
          </p>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] to-transparent opacity-60"></div>
      </header>
      
      <main className="max-w-screen-xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column: Construction Visual & Info */}
          <div className="space-y-12">
            <div className="relative rounded-[10px] overflow-hidden h-[450px] shadow-2xl border border-white/5 group">
              <OptimizedImage 
                src="" 
                fallbackType="company" 
                alt="Građevinski vizual" 
                className="w-full h-full object-cover grayscale opacity-50" 
                containerClassName="w-full h-full"
              /> 
                
              <div className="absolute inset-0 blueprint-overlay transition-opacity duration-500 group-hover:opacity-90"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="glass-card p-8 rounded-[10px] border-l-4 border-secondary max-w-md">
                  <p className="font-bold text-sm uppercase tracking-widest text-secondary mb-4">Sedište Kompanije</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary">location_on</span>
                      <p className="text-white font-medium">Trg Nikole Pašića, Beograd, Srbija</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary">call</span>
                      <p className="text-white font-medium">+381 66 27 55 32</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary">mail</span>
                      <div className="space-y-1">
                        <p className="text-white font-medium">{APP_CONFIG.CONTACT_EMAIL}</p>
                        <p className="text-white font-medium">{APP_CONFIG.SUPPORT_EMAIL}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-surface-container-low p-3 rounded text-secondary">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Radno vreme</h4>
                    <p className="text-on-surface-variant">Pon - Pet: 09:00 - 17:00</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-surface-container-low p-3 rounded text-secondary">
                    <span className="material-symbols-outlined">support_agent</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Tehnička Podrška</h4>
                    <p className="text-on-surface-variant">Dostupna 24/7 za hitne slučajeve</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Contact Form */}
          <div className="bg-surface-container-low p-8 md:p-12 rounded-[10px] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-5 blur-[100px] -mr-16 -mt-16"></div>
            <h3 className="text-3xl font-bold font-headline mb-8">Pošaljite poruku</h3>
            <form onSubmit={handleSend} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-400 mb-2 block">Ime i prezime</label>
                  <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} aria-label="Unos polja" className="w-full bg-[#0F1923] border border-[#707884]/20 rounded-[10px] p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none text-white" placeholder="Vaše ime" type="text" required/>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-400 mb-2 block">Email adresa</label>
                  <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} aria-label="Unos polja" className="w-full bg-[#0F1923] border border-[#707884]/20 rounded-[10px] p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none text-white" placeholder="vas@email.com" type="email" required/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 mb-2 block">Tema upita</label>
                <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-[#0F1923] border border-[#707884]/20 rounded-[10px] p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none text-white appearance-none">
                  <option>Opšti upit</option>
                  <option>Marketing i oglašavanje</option>
                  <option>Tehnička podrška</option>
                  <option>Saradnja</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 mb-2 block">Poruka</label>
                <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-[#0F1923] border border-[#707884]/20 rounded-[10px] p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none text-white resize-none" placeholder="Kako vam možemo pomoći?" rows={5} maxLength={500} required></textarea>
                <div className="text-right text-xs text-gray-500">
                  {formData.message.length} / 500
                </div>
              </div>
              <button 
                disabled={isSubmitting || isSuccess}
                className={`w-full flex font-bold py-4 rounded-[10px] transition-all duration-300 active:scale-95 uppercase tracking-widest items-center justify-center gap-2 disabled:opacity-50 ${isSuccess ? 'bg-green-600 text-white' : 'bg-gradient-to-br from-[#ffeb3b] to-[#fb8c00] hover:from-[#fb8c00] hover:to-[#ffeb3b] !text-black hover:shadow-lg hover:shadow-secondary/30 hover:-translate-y-1'}`} 
                type="submit"
              >
                {isSuccess ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    Uspešno poslato! <span className="material-symbols-outlined">check_circle</span>
                  </motion.div>
                ) : (
                  <>
                    {isSubmitting ? 'Slanje...' : 'Pošalji poruku'}
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Support Section */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline uppercase">Hitna Podrška</h2>
            <p className="text-on-surface-variant mt-2 mb-6 uppercase tracking-widest text-xs font-bold">Dostupni smo vam i putem aplikacija za instant poruke</p>
            <div className="inline-block bg-secondary/10 border border-secondary/20 px-8 py-4 rounded-[10px]">
              <p className="text-secondary text-3xl md:text-4xl font-black tracking-tighter">+381 66 27 55 32</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <a className="glass-card p-8 rounded-[10px] border border-white/5 flex items-center gap-6 hover:border-secondary/50 transition-all group" href="https://wa.me/38166275532">
              <div className="bg-[#25D366]/20 p-4 rounded-full text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.53.909 3.039 1.389 4.625 1.39 5.45.001 9.885-4.434 9.888-9.884.002-2.64-1.029-5.122-2.898-6.991-1.87-1.869-4.353-2.9-6.993-2.902-5.447 0-9.884 4.434-9.886 9.884-.001 1.73.457 3.419 1.32 4.91l-.995 3.635 3.739-.982zm11.381-7.39c-.09-.15-.33-.24-.69-.42-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.89-1.78-1.06-.94-1.78-2.11-1.99-2.47-.21-.36-.02-.55.16-.73.16-.17.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.705-.58-.609-.81-.621l-.69-.012c-.24 0-.63.09-.96.45s-1.26 1.23-1.26 3c0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.15 5.44.86.37 1.53.59 2.06.76.86.27 1.65.23 2.27.14.69-.1 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71z"/></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold">WhatsApp Podrška</h4>
                <p className="text-gray-400 text-sm">Pišite nam direktno na WhatsApp</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-gray-500 group-hover:text-secondary">arrow_forward_ios</span>
            </a>
            <a className="glass-card p-8 rounded-[10px] border border-white/5 flex items-center gap-6 hover:border-secondary/50 transition-all group" href="viber://chat?number=+381601234567">
              <div className="bg-[#7360F2]/20 p-4 rounded-full text-[#7360F2] group-hover:bg-[#7360F2] group-hover:text-white transition-all">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.618 16.647c-.419.053-.728-.117-.927-.51l-.571-1.127c-.033-.065-.114-.094-.181-.065l-.94.41c-.066.029-.096.11-.066.176l.571 1.127c.199.393.125.842-.185 1.121-.31.279-.763.336-1.132.143l-2.254-1.144c-.369-.193-.566-.601-.492-.996.074-.395.39-.705.79-.775l.94-.165c.066-.012.11-.077.098-.143l-.165-.94c-.012-.066-.077-.11-.143-.098l-.94.165c-.4.07-.816-.074-1.04-.361-.224-.287-.27-.665-.115-1.001l1.144-2.254c.155-.336.486-.554.845-.554.096 0 .193.016.287.05l2.254 1.144c.336.155.554.486.554.845 0 .096-.016.193-.05.287l-1.144 2.254c-.155.336-.109.714.115 1.001.224.287.64.431 1.04.361l.94-.165c.066-.012.131.032.143.098l.165.94c.012.066-.032.131-.098.143l-.94.165c-.4.07-.716.38-.79.775-.074.395.123.803.492.996l2.254 1.144c.369.193.566.601.492.996-.074.395-.39.705-.79.775z"/></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold">Viber Zajednica</h4>
                <p className="text-gray-400 text-sm">Pridružite se našoj Viber grupi</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-gray-500 group-hover:text-secondary">arrow_forward_ios</span>
            </a>
          </div>
        </section>
        
        {/* Social Media Row */}
        <div className="mt-24 border-t border-white/5 pt-12 text-center">
          <p className="uppercase tracking-widest text-xs font-bold text-gray-500 mb-8">Pratite nas na društvenim mrežama</p>
          <div className="flex justify-center gap-8">
            <a className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group" href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <div className="w-12 h-12 rounded-[10px] border border-white/10 flex items-center justify-center group-hover:bg-[#1877F2] group-hover:border-[#1877F2] transition-all">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <span className="font-bold">Facebook</span>
            </a>
            <a className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group" href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <div className="w-12 h-12 rounded-[10px] border border-white/10 flex items-center justify-center group-hover:bg-[#E1306C] group-hover:border-[#E1306C] transition-all">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
              <span className="font-bold">Instagram</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
