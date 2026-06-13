import React from 'react';
import { DashboardLayout } from '@/src/modules/core';
import EmptyState from '@/src/components/ui/EmptyState';
import { Truck } from 'lucide-react';

export default function MyCateringDeliveryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter">DOSTAVA</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
            Upravljajte statusom trenutnih dostava, pratite isporuke i koordinirajte vozače.
          </p>
        </div>

        <EmptyState 
          icon={Truck}
          title="Nema isporuka u toku"
          description="Trenutno nemate aktivnih isporuka. Kada se potvrde i obrade nove narudžbine, ovde ćete moći da pratite status njihove dostave do klijenta."
          actionLabel="NAZAD NA KONTROLNU TABLU"
          actionLink="/kontrolna-tabla"
        />
      </div>
    </DashboardLayout>
  );
}
