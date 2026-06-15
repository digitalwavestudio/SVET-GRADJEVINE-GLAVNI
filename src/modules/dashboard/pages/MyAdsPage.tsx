import { useEffect, useState } from 'react';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useInView } from 'react-intersection-observer';
import { Megaphone } from 'lucide-react';
import { DashboardLayout } from '@/src/modules/core';
import EmptyState from '@/src/components/ui/EmptyState';
import { useAuth } from '@/src/context/AuthContext';
import { useMyAds, useMyAdsMutations } from '@/src/modules/dashboard/hooks/useMyAds';
import PromoteModal from '../components/PromoteModal';
import { MachineAdsList } from '../components/details/MachineAdsList';
import { PlotAdsList } from '../components/details/PlotAdsList';
import { OtherAdsList } from '../components/details/OtherAdsList';
import { MachineAdData } from '../types/ads';
import { AdsListSkeleton } from '../components/details/AdsListSkeleton';
import { DashboardConfirmDialog, DashboardConfirmDialogProps } from '../components/DashboardConfirmDialog';
import { DashboardAlertDialog, DashboardAlertDialogProps } from '../components/DashboardAlertDialog';
import { MyAdsHeader } from '../components/details/MyAdsHeader';

export default function MyAdsPage() {
  const { user } = useAuth();
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);

  const { 
    data: ads = [], 
    isLoading: loading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage, 
    refetch 
  } = useMyAds(user?.id, debouncedQuery);
  const adsData = ads as MachineAdData[];
  const { deleteAd, approveAd } = useMyAdsMutations(user?.id);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !loading) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, loading, fetchNextPage]);

  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteConfig, setPromoteConfig] = useState<{ entityId: string; collection: string; isUrgentCheck: boolean } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<(Omit<DashboardConfirmDialogProps, 'onCancel'> & { isOpen: boolean }) | null>(null);
  const [alertDialog, setAlertDialog] = useState<(Omit<DashboardAlertDialogProps, 'onClose'> & { isOpen: boolean }) | null>(null);

  const handleOpenPromote = (entityId: string, collection: string, isUrgentCheck: boolean) => {
    setPromoteConfig({ entityId, collection, isUrgentCheck });
    setPromoteModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'BRISANJE OGLASA',
      description: 'Da li ste sigurni da želite da obrišete ovaj oglas? Ova akcija je trajna i ne može se poništiti.',
      actionLabel: 'POTVRDI BRISANJE',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteAd({ id });
          setConfirmDialog(null);
          setAlertDialog({
            isOpen: true,
            title: 'OGLAS JE OBRISAN',
            description: 'Vaš oglas je uspešno uklonjen sa sistema.',
            type: 'success'
          });
        } catch {
          setConfirmDialog(null);
          setAlertDialog({
            isOpen: true,
            title: 'GREŠKA',
            description: 'Došlo je do greške prilikom brisanja vašeg oglasa.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleApprove = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'AKTIVACIJA OGLASA',
      description: 'Da li želite da aktivirate ostale parametre i oglas? (Ovo je simulacija uplate koja odmah odobrava oglas)',
      actionLabel: 'POTVRDI AKTIVACIJU',
      isDanger: false,
      onConfirm: async () => {
        try {
          await approveAd({ id });
          setConfirmDialog(null);
          setAlertDialog({
            isOpen: true,
            title: 'OGLAS JE AKTIVAN',
            description: 'Oglas je uspešno odobren i objavljen uživo na platformi.',
            type: 'success'
          });
        } catch {
          setConfirmDialog(null);
          setAlertDialog({
            isOpen: true,
            title: 'GREŠKA',
            description: 'Došlo je do greške prilikom aktivacije oglasa.',
            type: 'error'
          });
        }
      }
    });
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  const filteredAds = adsData.filter((ad) => {
    if (statusFilter === 'active') {
      return ad.status !== 'pending';
    }
    if (statusFilter === 'pending') {
      return ad.status === 'pending';
    }
    return true;
  });

  const plotAds = filteredAds.filter((ad) => ad.postType === 'plot');
  const machineAds = filteredAds.filter((ad) => ad.postType === 'machine');
  const otherAds = filteredAds.filter((ad) => ad.postType !== 'plot' && ad.postType !== 'machine');

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <MyAdsHeader 
          loading={loading}
          onRefetch={refetch}
          localQuery={localQuery}
          setLocalQuery={setLocalQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {loading && <AdsListSkeleton />}

        {!loading && filteredAds.length === 0 && (
          <EmptyState 
            icon={Megaphone}
            title={statusFilter === 'all' ? "Nemate aktivnih oglasa" : (statusFilter === 'active' ? "Nemate aktivnih oglasa u ovoj kategoriji" : "Nemate oglasa na čekanju")}
            description={statusFilter === 'all' ? "Kliknite na dugme iznad da postavite vaš prvi oglas i započnete poslovanje." : "Pokušajte da promenite filter ili kreirate novu objavu."}
            actionLabel={statusFilter === 'all' ? "POSTAVI OGLAS" : undefined}
            actionLink={statusFilter === 'all' ? "/postavi-oglas" : undefined}
          />
        )}

        {!loading && filteredAds.length > 0 && (
          <div className="space-y-12">
            
            {/* === GRAĐEVINSKE MAŠINE (PREMIUM B2B MANAGEMENT) === */}
            <MachineAdsList 
              ads={machineAds} 
              onPromote={handleOpenPromote}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
            
            {/* === PLACEVI / INVESTICIONE LOKACIJE === */}
            <PlotAdsList 
              ads={plotAds} 
              onPromote={handleOpenPromote}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />

            {/* === OSTALI OGLASI === */}
            <OtherAdsList
              ads={otherAds}
              showTitle={plotAds.length > 0 || machineAds.length > 0}
              onPromote={handleOpenPromote}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
            {/* === INFINITE SCROLL TRIGGER === */}
            {hasNextPage && (
              <div ref={ref} className="flex justify-center p-12 border-t border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-bounce"></div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-3">Učitavanje podataka...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {promoteConfig && (
        <PromoteModal
          isOpen={promoteModalOpen}
          onClose={() => setPromoteModalOpen(false)}
          entityId={promoteConfig.entityId}
          collection={promoteConfig.collection}
          isUrgentCheck={promoteConfig.isUrgentCheck}
          onSuccess={() => refetch()}
        />
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <DashboardConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          description={confirmDialog.description}
          actionLabel={confirmDialog.actionLabel}
          isDanger={confirmDialog.isDanger}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* CUSTOM ALERT FEEDBACK DIALOG MODAL */}
      {alertDialog && (
        <DashboardAlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          description={alertDialog.description}
          type={alertDialog.type}
          onClose={() => setAlertDialog(null)}
        />
      )}
    </DashboardLayout>
  );
}
