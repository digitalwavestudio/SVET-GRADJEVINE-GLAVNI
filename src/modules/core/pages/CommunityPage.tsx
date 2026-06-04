import React from 'react';
import { motion } from 'motion/react';
import { Users, Youtube, Facebook, Instagram, MessageSquare, ExternalLink, GraduationCap } from 'lucide-react';
import SeoHead from '@/src/components/SeoHead';

export default function CommunityPage() {
  const categories = [
    {
      title: "YouTube & Edukacija",
      items: [
        { name: "Građevinski Kanali", desc: "Najbolji video tutorijali i prikazi gradilišta", url: "#", icon: Youtube },
        { name: "Majstorske Tajne", desc: "Praktični saveti iskusnih majstora", url: "#", icon: GraduationCap },
      ]
    },
    {
      title: "Društvene Mreže & Grupe",
      items: [
        { name: "Facebook Zajednica", desc: "Diskusije, saveti i razmena iskustava", url: "#", icon: Facebook },
        { name: "Instagram Inspiracija", desc: "Prikazi modernih enterijera i eksterijera", url: "#", icon: Instagram },
        { name: "Viber/WhatsApp Info", desc: "Brze informacije o tržištu i materijalima", url: "#", icon: MessageSquare },
      ]
    }
  ];

  return (
    <div className="bg-[#050A0F] min-h-screen pt-32 pb-24">
      <SeoHead 
        title="Preporuke & Zajednica | Svet Građevine"
        description="Povežite se sa najboljim stručnjacima i pratite relevantan sadržaj iz sveta građevine."
      />
      
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic m-0">
              Preporuke & <span className="text-secondary">Zajednica</span>
            </h1>
          </div>
          <p className="text-xl text-white/60 max-w-2xl font-medium leading-relaxed">
            Platforme i influenseri koji oblikuju modernu građevinsku industriju u regionu. Čitajte, učite i povežite se.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((group, idx) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-8"
            >
              <h2 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4">
                {group.title}
              </h2>
              <div className="space-y-4">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-secondary/10 hover:border-secondary/20 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <span className="text-white font-bold uppercase tracking-tight group-hover:text-secondary transition-colors block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-white/30 uppercase font-bold tracking-wider">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
