import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { apiClient } from '@/src/lib/apiClient';
import { toast } from 'react-hot-toast';
import Spinner from '@/src/components/ui/Spinner';
import { SecuritySettingsTab } from '../components/settings/SecuritySettingsTab';
import { NotificationSettingsTab } from '../components/settings/NotificationSettingsTab';

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'security' | 'notifications' | 'deactivate'>('security');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    sms: false,
    marketing: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeactivate = async () => {
    if (confirmText !== 'DEAKTIVIRAJ') {
      toast.error("Molimo unesite tačnu reč za potvrdu.");
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.post('/users/deactivate', {});
      toast.success("Vaš profil je uspešno ugašen.");
      setShowConfirmModal(false);
      // Odjavi korisnika i preusmeri na prijavu
      await logout();
      window.location.href = '/prijava';
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Greška pri gašenju naloga.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 px-4 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">PODEŠAVANJA NALOGA</h1>
          <p className="text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">Upravljajte bezbednošću, notifikacijama i statusom naloga</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Navigation Sidebar */}
          <div className="space-y-2">
            {[
              { id: 'security', label: 'SIGURNOST I LOZINKA', icon: 'lock' },
              { id: 'notifications', label: 'NOTIFIKACIJE', icon: 'notifications' },
              { id: 'deactivate', label: 'UGASI PROFIL', icon: 'no_accounts' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as 'security' | 'notifications' | 'deactivate')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[6px] transition-all text-[10px] font-black tracking-widest uppercase ${
                  activeSection === section.id 
                    ? 'bg-secondary !text-black shadow-lg shadow-secondary/10' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[6px] p-6 md:p-10">
              {activeSection === 'security' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <SecuritySettingsTab />
                </motion.div>
              )}

              {activeSection === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <NotificationSettingsTab 
                    notifications={notifications}
                    toggleNotification={toggleNotification}
                  />
                </motion.div>
              )}

              {activeSection === 'deactivate' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="border border-red-500/20 bg-red-500/5 rounded-[6px] p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-500">
                      <span className="material-symbols-outlined text-2xl">warning</span>
                      <h4 className="text-sm font-black uppercase tracking-wider">Trajno gašenje profila</h4>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed uppercase font-bold tracking-wide">
                      Pažnja: Ova akcija je nepovratna. Gašenjem profila brišu se svi Vaši oglasi, biografije, upiti, poruke i istorija transakcija sa platforme.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-[4px] text-xs tracking-[0.25em] uppercase transition-all shadow-lg shadow-red-600/10"
                    >
                      UGASI PROFIL
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0D1216] border border-red-500/20 rounded-[6px] p-8 space-y-6 shadow-2xl z-10"
            >
              <div className="text-center space-y-2">
                <span className="material-symbols-outlined text-red-500 text-4xl">warning</span>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Potvrdite gašenje profila</h3>
                <p className="text-xs text-white/50 leading-relaxed uppercase font-bold tracking-wider">
                  Da biste ugasili nalog, upišite reč <span className="text-red-500 select-all font-black">DEAKTIVIRAJ</span> u polje ispod.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Upišite DEAKTIVIRAJ"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[4px] p-4 text-xs font-bold text-white uppercase tracking-widest text-center focus:border-red-500 outline-none transition-all"
                />

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmText('');
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-[4px] text-xs tracking-widest uppercase transition-all"
                  >
                    Odustani
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={isDeleting || confirmText !== 'DEAKTIVIRAJ'}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-[4px] text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting && <Spinner className="w-3.5 h-3.5" />}
                    {isDeleting ? 'GASI SE...' : 'POTVRDI'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
