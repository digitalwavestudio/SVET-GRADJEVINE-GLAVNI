import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PropertyItem {
  icon: LucideIcon;
  label: string;
  value: string | number | undefined;
  highlight?: boolean;
}

interface PropertyGridProps {
  items: PropertyItem[];
}

export default function PropertyGrid({ items }: PropertyGridProps) {
  // Filtriramo stavke koje nemaju vrednost
  const validItems = items.filter(item => item.value !== undefined && item.value !== '');

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {validItems.map((item, index) => (
        <div 
          key={index}
          className={`p-6 rounded-[10px] flex flex-col gap-3 transition-all duration-300 group hover:translate-y-[-2px] ${
            item.highlight 
              ? 'bg-secondary/10 border border-secondary/20 shadow-[0_8px_32px_rgba(254,191,13,0.05)]' 
              : 'bg-surface-container-highest/30 border border-outline-variant/10'
          }`}
        >
          <div className={`p-2 rounded-[10px] w-fit ${item.highlight ? 'bg-secondary text-slate-950' : 'bg-surface-container-highest text-white/40'}`}>
            <item.icon size={18} className="group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <dt className="text-[10px] font-black text-white/20 uppercase tracking-widest">{item.label}</dt>
            <dd className={`text-base font-bold tracking-tight truncate ${item.highlight ? 'text-secondary' : 'text-white/90'}`}>
              {item.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
