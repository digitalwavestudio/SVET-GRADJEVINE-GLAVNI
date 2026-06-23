import { OptimizedImage } from '@/src/components/OptimizedImage';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import logoImage from '@/src/assets/images/logo.webp';
import { useToast } from '@/src/context/ToastContext';
import { auth } from '@/src/lib/firebase';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { getErrorMessage } from '@/src/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithEmail, user, loading: authLoading } = useAuth();
  const { logoUrl } = useBrandLogo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { addToast } = useToast();

  // Set page title for mobile view
  useEffect(() => {
    document.title = "Prijava - Svet Građevine";
  }, []);

  // Handle redirect after login
  const from = location.state?.from?.pathname || '/kontrolna-tabla';
  const redirectError = location.state?.error;

  useEffect(() => {
    if (redirectError) {
      setError(redirectError);
    }
  }, [redirectError]);

  useEffect(() => {
    if (user && !authLoading) {
      if (user.emailVerified) {
        const isAdmin = user.role === 'admin' || user.isAdmin;
        if (isAdmin && from === '/moj-profil') {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError('Vaš email nije potvrđen. Molimo proverite inbox.');
        // Optionally logout or just keep them here
      }
    }
  }, [user, authLoading, navigate, from]);



  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      addToast('Link za reset lozinke je poslat na vaš email', 'success');
      setIsResetOpen(false);
      setResetEmail('');
    } catch (err: unknown) {
      addToast('Email za resetovanje je poslat na vašu adresu, pod uslovom da korisnik postoji.', 'success');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      setError("Prijavni podaci su netačni ili korisnik ne postoji.");
      console.error("Login Error:", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error('Google Login Error:', errorMsg);
      if (err?.code === 'auth/popup-blocked') {
        setError('Browser je blokirao popup. Dozvolite popup prozore za ovu stranicu i pokušajte ponovo.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Zatvorili ste popup pre završetka prijave. Pokušajte ponovo.');
      } else if (err?.code) {
        setError(`Greška pri Google prijavi (${err.code}): ${errorMsg}`);
      } else {
        setError(`Greška prilikom Google prijave: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary">
      {/* LEFT PANEL: Brand Narrative (60%) */}
      <section className="hidden md:flex md:w-3/5 relative items-center px-12 lg:px-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src="/assets/pattern-bg.png" 
            fallbackType="company" 
            alt="Siguran pristup platformi" 
            className="w-full h-full object-cover opacity-50 grayscale" 
            containerClassName="w-full h-full"
          /> 
            
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-12 h-1 bg-primary"></div>
            <span className="font-bold text-primary tracking-[0.2em] text-xs uppercase">Industrial Precision</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-headline font-black text-white tracking-tighter leading-[1.1] mb-6 uppercase">
            Povežite se sa vrhom industrije
          </h1>
          <p className="text-on-surface-variant text-lg lg:text-xl max-w-lg font-medium leading-relaxed">
            Pristupite ekskluzivnim projektima, najnovijim poslovima i bazi najboljih inženjera u regionu.
          </p>
        </div>
        {/* Technical Detail Ornament */}
        <div className="absolute bottom-12 left-12 lg:left-24 text-[10px] text-on-surface-variant/50 font-bold tracking-widest flex gap-8 uppercase">
          <span>COORD: 44.7866° N, 20.4489° E</span>
          <span>VER: 2.0.48_BUILD</span>
        </div>
      </section>

      {/* RIGHT PANEL: Login Form (40%) */}
      
      {isResetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-[10px] w-full max-w-md p-6 relative">
            <button onClick={() => setIsResetOpen(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Resetovanje lozinke</h3>
            <p className="text-sm text-on-surface-variant mb-6">Unesite email adresu vašeg naloga. Poslaćemo vam link za resetovanje lozinke.</p>
            <form onSubmit={handlePasswordReset}>
              <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Unesite email adresu" className="w-full bg-surface-container-low border border-outline-variant/20 rounded-[10px] px-4 py-3 text-white mb-4" />
              <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-[10px] hover:bg-primary/90 transition-colors">Pošalji link za reset</button>
            </form>
          </div>
        </div>
      )}
  
      <section className="w-full md:w-2/5 bg-surface-container-low flex flex-col justify-center items-center px-4 py-8 sm:px-8 sm:py-12 lg:px-16 min-h-screen border-l border-outline-variant/10 relative">
        
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-4 mb-8 group">
                {logoUrl ? (
                  <img width="800" height="600" decoding="async" src={logoUrl} alt="Svet Građevine" className="w-[180px] md:w-[220px] h-auto object-contain drop-shadow-md" loading="lazy" />
                ) : (
                  <img src={logoImage} alt="Svet Građevine" className="w-[180px] md:w-[220px] h-auto object-contain drop-shadow-md" loading="lazy" />
                )}
            </Link>
            <h2 className="text-3xl font-headline font-black text-on-surface mb-2 uppercase tracking-tight">Dobrodošli nazad</h2>
            <p className="text-on-surface-variant font-medium text-sm">Prijavite se na svoj nalog za pun pristup platformi.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-red-500 text-sm font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Google Login (Primary) */}
          <div className="mb-8">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-[10px] transition-all flex items-center justify-center gap-3 border border-slate-200 shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-sm tracking-wide">{loading ? 'Prijava...' : 'Nastavi sa Google-om'}</span>
            </button>
            <p className="text-center text-[10px] text-on-surface-variant mt-3">
              Prijavom prihvatate <Link to="/uslovi-koriscenja" className="underline hover:text-primary">Uslove korišćenja</Link> i <Link to="/politika-privatnosti" className="underline hover:text-primary">Politiku privatnosti</Link>.
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-8 flex items-center">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">ili putem emaila</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase ml-1">Email adresa</label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                  placeholder="unesite@email.com" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Lozinka</label>
                <button type="button" onClick={() => setIsResetOpen(true)} className="text-[10px] font-bold text-primary hover:underline transition-colors uppercase tracking-wider">Zaboravili ste lozinku?</button>
              </div>
              <div className="relative">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                  placeholder="••••••••" 
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface" type="button">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={UI_TOKENS.BTN_PRIMARY + " w-full font-black py-4 rounded-[10px] transition-all uppercase tracking-widest text-sm shadow-lg shadow-primary/20 disabled:opacity-50"} 
            >
              {loading ? 'Prijavljivanje...' : 'Prijavi se'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-on-surface-variant text-sm font-medium">
            Nemate nalog? 
            <Link to="/registracija" className="text-primary hover:underline font-bold transition-colors ml-1">Registrujte se besplatno</Link>
          </p>
        </div>

        {/* Mobile Footer Texture */}
        <div className="mt-auto pt-12 md:hidden">
          <span className="text-[10px] text-on-surface-variant/50 font-bold tracking-widest uppercase">© 2026 SVET GRAĐEVINE</span>
        </div>
      </section>
    </div>
  );
}
