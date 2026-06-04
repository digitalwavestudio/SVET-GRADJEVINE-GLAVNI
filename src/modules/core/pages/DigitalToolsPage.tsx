import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Calculator, Layers, Layout, HardHat, FileCode, ExternalLink } from 'lucide-react';
import SeoHead from '@/src/components/SeoHead';

export default function DigitalToolsPage() {
  const categories = [
    {
      title: "Proračun & Estimacija",
      items: [
        { name: "Kalkulator Materijala", desc: "Precizni proračuni za ciglu, beton i armaturu", url: "#", icon: Calculator },
        { name: "Budget Planner", desc: "Upravljanje troškovima izgradnje", url: "#", icon: FileCode },
      ]
    },
    {
      title: "Dizajn & Planiranje",
      items: [
        { name: "3D Vizuelizacija", desc: "Alati za modelovanje i renderovanje", url: "#", icon: Layout },
        { name: "Project Management", desc: "Praćenje faza projekta u realnom vremenu", url: "#", icon: Layers },
        { name: "BIM Softver", desc: "Building Information Modeling rešenja", url: "#", icon: Cpu },
      ]
    }
  ];

  return (
    <div className="bg-[#050A0F] min-h-screen pt-32 pb-24">
      <SeoHead 
        title="Digitalni Alati | Svet Građevine"
        description="Besplatni i premium digitalni alati za efikasno upravljanje građevinskim projektima."
      />
      
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-secondary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic m-0">
              Digitalni <span className="text-secondary">Alati</span>
            </h1>
          </div>
          <p className="text-xl text-white/60 max-w-2xl font-medium leading-relaxed">
            Unapredite svoje poslovanje najmodernijim digitalnim alatima. Od kalkulatora do kompleksnih softverskih sistema.
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
