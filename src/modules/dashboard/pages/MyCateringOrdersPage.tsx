import React from 'react';
import { DashboardLayout } from '@/src/modules/core';
import EmptyState from '@/src/components/ui/EmptyState';
import { Receipt } from 'lucide-react';

export default function MyCateringOrdersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter">MOJE NARUDŽBINE</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
            Pregledajte sve pristigle narudžbine, status pripreme i istoriju završenih poslova.
          </p>
        </div>

        <EmptyState 
          icon={Receipt}
          title="Nema aktivnih narudžbina"
          description="Trenutno nemate nijednu novu ili aktivnu narudžbinu. Kada korisnici poruče hranu sa vašeg menija, ona će se pojaviti ovde."
          actionLabel="AŽURIRAJ MENI"
          actionLink="/postavi-oglas"
        />
      </div>
    </DashboardLayout>
  );
}
