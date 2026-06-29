import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import logoImage from '@/src/assets/images/logo.webp';
import { useToast } from '@/src/context/ToastContext';
import { getLazyAuth } from '@/src/lib/firebase';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { passwordRegex } from '@svet-gradjevine/shared';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { logoUrl } = useBrandLogo();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    _honeypot: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = "Registracija - Svet Građevine";
  }, []);

  // Handle redirect after registration
  const from = location.state?.from?.pathname || '/kontrolna-tabla';

  useEffect(() => {
    if (user && !authLoading) {
      if (user.emailVerified) {
        const isAdmin = user.role === 'admin' || user.isAdmin;
        if (isAdmin && from === '/moj-profil') {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    }
  }, [user, authLoading, navigate, from]);

  if (authLoading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData._honeypot && formData._honeypot.length > 0) {
      setError('Bot detected.');
      return;
    }
    if (!formData.termsAccepted) {
      setError('Morate prihvatiti uslove korišćenja.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Lozinke se ne podudaraju. Molimo proverite ponovni unos.');
      return;
    }
    if (!passwordRegex.test(formData.password)) {
      setError('Lozinka mora imati barem 8 karaktera, uključujući velika i mala slova i barem jednu cifru.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { createUserWithEmailAndPassword, sendEmailVerification: _sendEmailVerification } = await import('firebase/auth');
      const authInst = await getLazyAuth();
      const userCred = await createUserWithEmailAndPassword(authInst, formData.email, formData.password);
      const user = userCred.user;
      const emailPrefix = formData.email.split('@')[0];
      const defaultName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      
      const userDoc = {
        firstName: '',
        lastName: '',
        name: defaultName,
        role: 'standard',
        isVerified: false,
        displayName: defaultName,
        email: user.email,
        uid: user.uid,
        status: 'active',
        isPremiumProfile: false,
        photoURL: '',
        viewsCount: 0,
        freeAdsCount: 3
      };

      const token = await user.getIdToken();
      let res;
      let retries = 3;
      while (retries > 0) {
        try {
          res = await fetch('/api/users/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({...userDoc, _honeypot: formData._honeypot})
          });
          if (res.ok) break;
        } catch (err) {
          console.warn('Network error during init, retrying...');
        }
        retries--;
        if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!res || !res.ok) {
          throw new Error('Greška prilikom formiranja profila na serveru nakon više pokušaja.');
      }
      
      try {
        await _sendEmailVerification(user);
        addToast('Poslali smo vam email za potvrdu, proverite inbox', 'success');
      } catch (e) {
        console.error('Error sending verification', e);
      }
      
      addToast('Uspešna registracija! Potvrdite email pre prijave.', 'success');
      navigate('/prijava');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Ova email adresa je već u upotrebi.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Neispravan format email adrese.');
      } else if (err.code === 'auth/weak-password') {
        setError('Lozinka je previše slaba.');
      } else {
        setError(err.message || 'Greška prilikom registracije. Molimo pokušajte ponovo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle('standard');
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'auth/popup-blocked') {
        setError('Browser je blokirao popup. Dozvolite popup prozore za ovu stranicu i pokušajte ponovo.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setError('Zatvorili ste popup pre završetka prijave. Pokušajte ponovo.');
      } else {
        setError('Greška prilikom Google registracije. Pokušajte ponovo ili koristite email registraciju.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased overflow-x-hidden min-h-screen flex flex-col selection:bg-secondary selection:text-on-secondary">
      <main className="flex flex-1 flex-col md:flex-row">
        {/* Left Side: Visual Anchor (60%) */}
        <section className="hidden md:block relative w-full md:w-[60%] min-h-[409px] md:min-h-screen overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
          </div>
          <div className="relative z-10 h-full flex items-center justify-center p-8 md:p-16">
            <div className="bg-surface-container-low/60 backdrop-blur-[20px] border border-outline-variant/20 max-w-xl p-8 md:p-12 rounded-[10px] border-l-4 border-l-primary shadow-2xl">
              <h1 className="font-headline text-3xl md:text-5xl font-black text-white leading-tight mb-8 uppercase tracking-tight">
                Pridruži se eliti koja gradi budućnost
              </h1>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary mt-1">verified</span>
                  <div>
                    <h3 className="font-bold text-lg text-white">Pristup ekskluzivnim poslovima</h3>
                    <p className="text-on-surface-variant text-sm">Direktan kontakt sa investitorima i uvid u zatvorene tendere.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary mt-1">precision_manufacturing</span>
                  <div>
                    <h3 className="font-bold text-lg text-white">Najveća baza mehanizacije</h3>
                    <p className="text-on-surface-variant text-sm">Pronađite ili ponudite opremu u realnom vremenu bez posrednika.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary mt-1">handshake</span>
                  <div>
                    <h3 className="font-bold text-lg text-white">B2B umrežavanje</h3>
                    <p className="text-on-surface-variant text-sm">Povežite se sa proverenim podizvođačima i kompanijama.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Right Side: Registration Form (40%) */}
        <section className="w-full md:w-[40%] bg-surface-container-low flex flex-col justify-center items-center px-4 py-8 sm:p-8 md:p-12 min-h-screen border-l border-outline-variant/10 relative">
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Brand Logo */}
            <div className="flex flex-col items-center gap-4 mb-8">
                <Link to="/" className="inline-flex items-center gap-4 group">
                  {logoUrl ? (
                    <img width="800" height="600" decoding="async" src={logoUrl} alt="Svet Građevine" className="w-[180px] md:w-[220px] h-auto object-contain drop-shadow-md" loading="lazy" />
                  ) : (
                    <img src={logoImage} alt="Svet Građevine" className="w-[180px] md:w-[220px] h-auto object-contain drop-shadow-md" loading="lazy" />
                  )}
                </Link>
                <h2 className="font-headline text-3xl font-black text-on-surface mb-2 uppercase tracking-tight text-center">KREIRAJTE NALOG</h2>
                <p className="text-on-surface-variant text-sm font-medium text-center">Pridružite se najvećoj građevinskoj mreži u Srbiji</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-red-500 text-sm font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {/* Google Signup (Primary) */}
            <div className="mb-8 w-full">
              <button 
                onClick={handleGoogleRegister}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-[10px] transition-all flex items-center justify-center gap-3 border border-slate-200 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                </svg>
                <span className="text-sm tracking-wide">{loading ? 'Registracija...' : 'Registruj se sa Google-om'}</span>
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
            {/* Bot-Trap Honeypot */}
            <input 
              type="text" 
              name="_honeypot" 
              id="website_url_trap"
              style={{ display: 'none' }} 
              value={formData._honeypot}
              onChange={(e) => setFormData({...formData, _honeypot: e.target.value})}
              autoComplete="off"
            />

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email adresa</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-outline-variant/20 text-black placeholder:text-gray-500 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  placeholder="marko@email.com" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Lozinka</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-outline-variant/20 text-black placeholder:text-gray-500 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                    placeholder="Minimalno 8 karaktera" 
                  />
                  <span 
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors text-[20px]"
                    onClick={() => setShowPassword(prev => !prev)}
                  >{showPassword ? "visibility_off" : "visibility"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Potvrdite lozinku</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-outline-variant/20 text-black placeholder:text-gray-500 px-4 py-4 rounded-[10px] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                    placeholder="Ponovite lozinku" 
                  />
                  <span 
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors text-[20px]"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                  >{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                </div>
              </div>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed select-none">
                  Prihvatam <Link to="/uslovi-koriscenja" className="text-primary hover:underline font-bold">Uslove korišćenja</Link> i <Link to="/politika-privatnosti" className="text-primary hover:underline font-bold">Politiku privatnosti</Link>.
                </span>
              </label>

              <button 
                type="submit"
                disabled={loading}
                className={UI_TOKENS.BTN_PRIMARY + " w-full py-4 font-black uppercase tracking-widest text-sm rounded-[10px] transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"} 
              >
                {loading ? 'Registrovanje...' : 'Registruj se'}
              </button>
            </form>

            <p className="mt-10 text-center text-on-surface-variant text-sm font-medium">
              Već imate nalog? <Link to="/prijava" className="text-primary font-bold hover:underline ml-1">Prijavite se</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

