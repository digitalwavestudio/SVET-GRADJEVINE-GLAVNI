import React from 'react';
import { Phone, Mail, MessageSquare, ShieldCheck, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import Avatar from '@/src/components/ui/Avatar';

interface StickyContactCardProps {
  phone: string;
  email?: string;
  authorName?: string;
  isVerified?: boolean;
  avatar?: string;
  price?: string | number;
  currency?: string;
  profileUrl?: string;
  onMessage?: () => void;
}

export default function StickyContactCard({ 
  phone, 
  email, 
  authorName, 
  isVerified, 
  avatar,
  price,
  currency = 'EUR',
  profileUrl,
  onMessage
}: StickyContactCardProps) {
  
  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: authorName,
        url: window.location.href
      });
    }
  };

  return (
    <div className="sticky top-24 space-y-6">
      {/* Price Bento (If provided) */}
      {price && (
        <div className="bg-secondary p-8 rounded-[10px] flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] font-black text-slate-900/40 uppercase tracking-widest">TRAŽENA CENA</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black !text-black tracking-tighter">{price}</span>
            <span className="text-xl font-bold !text-black/60 uppercase tracking-widest">{currency}</span>
          </div>
        </div>
      )}

      {/* Main Contact Identity Card */}
      <div className="bg-surface-container-highest border border-outline-variant/10 rounded-[10px] p-8 shadow-sm overflow-hidden relative">
        <div className="relative z-10 space-y-8">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {profileUrl ? (
                <a href={profileUrl} className="block w-16 h-16 rounded-[10px] bg-secondary/20 border border-secondary/30 overflow-hidden shadow-inner hover:opacity-80 transition-opacity">
                  <Avatar name={authorName || 'Anonimni Korisnik'} url={avatar} className="w-full h-full object-cover" />
                </a>
              ) : (
                <div className="w-16 h-16 rounded-[10px] bg-secondary/20 border border-secondary/30 overflow-hidden shadow-inner">
                  <Avatar name={authorName || 'Anonimni Korisnik'} url={avatar} className="w-full h-full object-cover" />
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-secondary !text-black p-1.5 rounded-[10px] border-2 border-surface-container-highest shadow-xl">
                  <ShieldCheck size={12} fill="currentColor" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">OGLAŠIVAČ</span>
              {profileUrl ? (
                <a href={profileUrl} className="text-lg font-bold text-white tracking-tight hover:text-secondary transition-colors">
                  {authorName || 'Anonimni Korisnik'}
                </a>
              ) : (
                <h3 className="text-lg font-bold text-white tracking-tight">{authorName || 'Anonimni Korisnik'}</h3>
              )}
              {isVerified && (
                <div className="flex items-center gap-1.5 mt-2 bg-[#0A1A0F]/80 border border-green-500/20 backdrop-blur-xl px-2 py-1 rounded-[4px] w-fit shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                  <span className="text-[7.5px] font-black tracking-[0.1em] uppercase text-green-400">Verifikovan</span>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Action Buttons */}
          <div className="space-y-3">
            {phone && (
              <div className="flex flex-col items-center justify-center gap-1 mb-4 py-3 border border-white/5 bg-white/[0.02] rounded-[10px]">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">BROJ TELEFONA</span>
                <span className="text-xl font-black text-white tracking-wider">{phone}</span>
              </div>
            )}
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCall}
              className="w-full bg-secondary hover:bg-secondary/90 !text-black py-5 rounded-[10px] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-secondary/5"
            >
              <Phone size={18} fill="currentColor" />
              POZOVI OGLAŠIVAČA
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onMessage}
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 py-4 rounded-[10px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
            >
              <MessageSquare size={16} />
              POŠALJI PORUKU
            </motion.button>

            <button 
              onClick={shareProfile}
              className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black text-white/30 hover:text-secondary uppercase tracking-widest transition-colors"
            >
              <Share2 size={14} />
              PODELI OGLAS
            </button>
          </div>
        </div>
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[80px] rounded-full -mr-16 -mt-16" />
      </div>

      {/* Safety Bento */}
      <div className="bg-surface-container-highest/30 border border-outline-variant/10 rounded-[10px] p-6">
        <div className="flex gap-4 items-start">
          <div className="p-3 rounded-[10px] bg-white/5 text-secondary">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">BEZBEDNA TRGOVINA</h4>
            <p className="text-[10px] text-white/40 leading-relaxed font-bold">Nikada ne uplaćujte novac unapred pre nego što se uverite u kvalitet usluge ili proizvoda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
