import React from 'react';
import { motion } from 'motion/react';

interface NotificationSettingsTabProps {
  notifications: {
    email: boolean;
    browser: boolean;
    sms: boolean;
    marketing: boolean;
  };
  toggleNotification: (key: "email" | "browser" | "sms" | "marketing") => void;
}

export function NotificationSettingsTab({ notifications, toggleNotification }: NotificationSettingsTabProps) {
  const items = [
    { key: 'email', label: 'EMAIL NOTIFIKACIJE', desc: 'PRIMAJTE OBAVEŠTENJA O NOVIM PORUKAMA I PRIJAVAMA NA EMAIL.' },
    { key: 'browser', label: 'BROWSER NOTIFIKACIJE', desc: 'DOZVOLITE APLIKACIJI DA ŠALJE OBAVEŠTENJA DOK JE OTVORENA.' },
    { key: 'sms', label: 'SMS OBAVEŠTENJA', desc: 'PRIMAJTE HITNA OBAVEŠTENJA PUTEM SMS PORUKA.' },
    { key: 'marketing', label: 'MARKETING I PONUDE', desc: 'PRIMAJTE INFORMACIJE O NOVIM PAKETIMA I PROMOCIJAMA.' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[10px]">
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{item.label}</h4>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{item.desc}</p>
          </div>
          <button 
            onClick={() => toggleNotification(item.key as "email" | "browser" | "sms" | "marketing")}
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
  );
}
