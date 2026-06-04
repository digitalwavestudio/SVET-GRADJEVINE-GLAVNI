import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Link2, BookOpen, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
import SeoHead from '@/src/components/SeoHead';

export default function UsefulLinksPage() {
  const links = [
    {
      title: "Pravila i Uslovi",
      items: [
        { name: "Uslovi korišćenja", url: "/uslovi-koriscenja", icon: FileText },
        { name: "Politika privatnosti", url: "/privatnost", icon: ShieldCheck },
        { name: "Pravila oglašavanja", url: "/pravila-oglasavanja", icon: BookOpen },
      ]
    },
    {
      title: "Podrška i Kontakt",
      items: [
        { name: "Centar za pomoć", url: "/podrska", icon: HelpCircle },
        { name: "Kontaktirajte nas", url: "/kontakt", icon: ExternalLink },
        { name: "O nama", url: "/o-nama", icon: Link2 },
      ]
    }
  ];

  return (
    <div className="bg-[#050A0F] min-h-screen pt-32 pb-24">
      <SeoHead 
        title="Korisni Linkovi | Svet Građevine"
        description="Pronađite sve važne informacije, pravila i resurse na jednom mestu."
      />
      
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6 italic">
            Korisni <span className="text-secondary">Linkovi</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl font-medium leading-relaxed">
            Brzi pristup svim ključnim sekcijama platforme, pravnoj dokumentaciji i resursima za korisnike.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {links.map((group, idx) => (
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
                    <a
                      key={item.name}
                      href={item.url}
                      className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-secondary/10 hover:border-secondary/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-5 h-5 text-secondary" />
                        </div>
                        <span className="text-white font-bold uppercase tracking-tight group-hover:text-secondary transition-colors">
                          {item.name}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                    </a>
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
