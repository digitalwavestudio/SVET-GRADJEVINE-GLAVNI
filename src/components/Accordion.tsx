import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = `accordion-content-${title.replace(/\s+/g, '-')}`;
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex justify-between items-center px-4 py-3 bg-[#050A0F]/80 text-white hover:bg-[#070B0F]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={id} className="p-6 bg-[#050A0F]/60">
          {children}
        </div>
      )}
    </div>
  );
}
