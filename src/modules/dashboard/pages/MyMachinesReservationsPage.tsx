import React from 'react';
import { DashboardLayout } from '@/src/modules/core';
import EmptyState from '@/src/components/ui/EmptyState';
import { CalendarClock } from 'lucide-react';

export default function MyMachinesReservationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter">REZERVACIJE MAŠINA</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
            Pregledajte sve upite i potvrđene rezervacije za iznajmljivanje vaše mehanizacije.
          </p>
        </div>

        <EmptyState 
          icon={CalendarClock}
          title="Nema aktivnih rezervacija"
          description="Trenutno nemate aktivnih rezervacija. Kada korisnici zatraže iznajmljivanje neke od vaših mašina, rezervacija će se pojaviti ovde."
          actionLabel="MOJA FLOTA"
          actionLink="/moj-profil/oglasi"
        />
      </div>
    </DashboardLayout>
  );
}
