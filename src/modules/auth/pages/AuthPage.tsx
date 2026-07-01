import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import logoImage from '@/src/assets/images/logo.webp';
import { useToast } from '@/src/context/ToastContext';
import { getLazyAuth } from '@/src/lib/firebase';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { getErrorMessage } from '@/src/lib/utils';
import { passwordRegex } from '@svet-gradjevine/shared';

type AuthTab = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithEmail, user, loading: authLoading } = useAuth();
  const { logoUrl } = useBrandLogo();
  const { addToast } = useToast();
  const [tab, setTab] = useState<AuthTab>('register');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = "Prijava / Registracija - Svet Građevine";
  }, []);

  const from = location.state?.from?.pathname || '/kontrolna-tabla';

  useEffect(() => {
    if (user && !authLoading) {
      if (user.emailVerified) {
        const isAdmin = user.role === 'admin' || user.isAdmin;
        if (isAdmin && from === '/moj-profil') {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { state: tab === 'register' ? { welcome: true } : undefined, replace: true });
        }
      } else if (tab === 'login') {
        setError('Vaš email nije potvrđen. Molimo proverite inbox.');
      }
    }
  }, [user, authLoading, navigate, from, tab]);

  if (authLoading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span>
      </div>
    );
  }

  // === LOGIN HANDLERS ===
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      const authInst = await getLazyAuth();
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(authInst, resetEmail);
      addToast('Link za reset lozinke je poslat na vaš email', 'success');
      setIsResetOpen(false);
      setResetEmail('');
    } catch {
      addToast('Email za resetovanje je poslat na vašu adresu.', 'success');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(loginEmail, loginPassword);
    } catch {
      setError("Prijavni podaci su netačni ili korisnik ne postoji.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setError('Browser je blokirao popup. Dozvolite popup prozore za ovu stranicu i pokušajte ponovo.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Zatvorili ste popup pre završetka prijave. Pokušajte ponovo.');
      } else {
        setError(`Greška: ${getErrorMessage(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // === REGISTER HANDLERS ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setError('Lozinke se ne podudaraju.');
      return;
    }
    if (!passwordRegex.test(regPassword)) {
      setError('Lozinka mora imati barem 8 karaktera, velika i mala slova, i barem jednu cifru.');
      return;
    }
    if (!termsAccepted) {
      setError('Morate prihvatiti uslove korišćenja.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { createUserWithEmailAndPassword, sendEmailVerification: _sendEmailVerification } = await import('firebase/auth');
      const authInst = await getLazyAuth();
      const userCred = await createUserWithEmailAndPassword(authInst, regEmail, regPassword);
      const user = userCred.user;
      const emailPrefix = regEmail.split('@')[0];
      const defaultName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

      const userDoc = {
        firstName: '', lastName: '', name: defaultName, role: 'standard',
        isVerified: false, displayName: defaultName, email: user.email, uid: user.uid,
        status: 'active', isPremiumProfile: false, photoURL: '', viewsCount: 0, freeAdsCount: 1500
      };

      const token = await user.getIdToken();
      let res;
      let retries = 3;
      while (retries > 0) {
        try {
          res = await fetch('/api/users/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(userDoc)
          });
          if (res.ok) break;
        } catch { /* retry */ }
        retries--;
        if (retries > 0) await new Promise(r => setTimeout(r, 1000));
      }
      if (!res || !res.ok) throw new Error('Greška prilikom formiranja profila.');

      try { await _sendEmailVerification(user); } catch { /* ignore */ }

      addToast('Uspešna registracija! Proverite email za potvrdu naloga.', 'success');
      navigate('/kontrolna-tabla', { state: { welcome: true } });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('Ova email adresa je već u upotrebi.');
      else if (err.code === 'auth/invalid-email') setError('Neispravan format email adrese.');
      else if (err.code === 'auth/weak-password') setError('Lozinka je previše slaba.');
      else setError(err.message || 'Greška prilikom registracije.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle('standard');
    } catch {
      setError('Greška prilikom Google registracije. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex justify-center mb-8">
          {logoUrl ? (
            <img width="800" height="600" decoding="async" src={logoUrl} alt="Svet Građevine" className="w-[180px] md:w-[220px] h-auto object-contain drop-shadow-md" loading="lazy" />
          ) : (
            <img src={logoImage} alt="Svet Građevine" className="w-[180px] md:w-[220px] h-auto object-contain drop-shadow-md" loading="lazy" />
          )}
        </Link>

        {/* Tabs */}
        <div className="flex mb-8 bg-surface-container-low rounded-[10px] p-1 border border-outline-variant/10">
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[8px] transition-all ${tab === 'register' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-white'}`}
          >
            Registracija
          </button>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[8px] transition-all ${tab === 'login' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-white'}`}
          >
            Prijava
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-red-500 text-sm font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Google CTA (zajednički) */}
        <div className="mb-8">
          <button
            onClick={tab === 'login' ? handleGoogleLogin : handleGoogleRegister}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-[10px] transition-all flex items-center justify-center gap-3 border border-slate-200 shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="text-sm tracking-wide">
              {loading ? 'Obrada...' : tab === 'login' ? 'Nastavi sa Google-om' : 'Registruj se sa Google-om'}
            </span>
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

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase ml-1">Email adresa</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required
                className="w-full bg-surface border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                placeholder="unesite@email.com" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Lozinka</label>
                <button type="button" onClick={() => setIsResetOpen(true)} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">Zaboravili ste?</button>
              </div>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required
                className="w-full bg-surface border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className={UI_TOKENS.BTN_PRIMARY + " w-full font-black py-4 rounded-[10px] transition-all uppercase tracking-widest text-sm shadow-lg shadow-primary/20 disabled:opacity-50"}>
              {loading ? 'Prijavljivanje...' : 'Prijavi se'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email adresa</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required
                className="w-full bg-surface border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                placeholder="marko@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Lozinka</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required
                  className="w-full bg-surface border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  placeholder="Minimalno 8 karaktera" />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-on-surface text-[20px]"
                  onClick={() => setShowPassword(p => !p)}>{showPassword ? "visibility_off" : "visibility"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Potvrdite lozinku</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required
                  className="w-full bg-surface border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  placeholder="Ponovite lozinku" />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-on-surface text-[20px]"
                  onClick={() => setShowConfirmPassword(p => !p)}>{showConfirmPassword ? "visibility_off" : "visibility"}</span>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer" />
              <span className="text-xs text-on-surface-variant leading-relaxed select-none">
                Prihvatam <Link to="/uslovi-koriscenja" className="text-primary hover:underline font-bold">Uslove korišćenja</Link> i <Link to="/politika-privatnosti" className="text-primary hover:underline font-bold">Politiku privatnosti</Link>.
              </span>
            </label>
            <button type="submit" disabled={loading}
              className={UI_TOKENS.BTN_PRIMARY + " w-full py-4 font-black uppercase tracking-widest text-sm rounded-[10px] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"}>
              {loading ? 'Registrovanje...' : 'Registruj se'}
            </button>
          </form>
        )}

        {/* Footer link */}
        <p className="mt-8 text-center text-on-surface-variant text-sm font-medium">
          {tab === 'login' ? (
            <>Nemate nalog? <button onClick={() => { setTab('register'); setError(''); }} className="text-primary font-bold hover:underline ml-1">Registrujte se besplatno</button></>
          ) : (
            <>Već imate nalog? <button onClick={() => { setTab('login'); setError(''); }} className="text-primary font-bold hover:underline ml-1">Prijavite se</button></>
          )}
        </p>
      </div>

      {/* Password Reset Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-[10px] w-full max-w-md p-6 relative">
            <button onClick={() => setIsResetOpen(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Resetovanje lozinke</h3>
            <p className="text-sm text-on-surface-variant mb-6">Unesite email adresu vašeg naloga.</p>
            <form onSubmit={handlePasswordReset}>
              <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Unesite email adresu"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-[10px] px-4 py-3 text-white mb-4" />
              <button type="submit"
                className="w-full bg-primary text-white font-bold py-3 rounded-[10px] hover:bg-primary/90 transition-colors">
                Pošalji link za reset
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
