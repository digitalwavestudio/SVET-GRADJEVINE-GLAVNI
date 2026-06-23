
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { getLazyAuth } from '@/src/lib/firebase';

export const VerificationBanner: React.FC = () => {
  const { user, loading, isInitializing } = useAuth();
  const [sent, setSent] = React.useState(false);
  const [loadingResend, setLoadingResend] = React.useState(false);

  // Prevent flash while auth is loading or initializing
  if (loading || isInitializing) return null;

  // If no user or email is already verified, don't show
  if (!user || user.role === 'admin' || user.emailVerified) return null;

  const handleResend = async () => {
    const authInst = await getLazyAuth();
    if (!authInst.currentUser) return;
    setLoadingResend(true);
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(authInst.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error("Verification resend error:", error);
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-100 overflow-hidden transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Vaš email nije verifikovan. Verifikacija je obavezna za postavljanje oglasa i komunikaciju.
          </p>
        </div>
        
        <button
          onClick={handleResend}
          disabled={loadingResend || sent}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all
            ${sent 
              ? 'bg-green-100 text-green-700' 
              : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm active:scale-95'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {sent ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Poslato! Proverite inbox
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              {loadingResend ? 'Slanje...' : 'Pošalji link ponovo'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
