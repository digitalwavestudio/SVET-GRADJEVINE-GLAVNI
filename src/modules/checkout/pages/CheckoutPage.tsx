import { OptimizedImage } from '@/src/components/OptimizedImage';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '@/src/components/Footer';
import Navbar from '@/src/components/Navbar';
import { APP_CONFIG } from '@/src/constants/config';
import { useAuth } from '@/src/context/AuthContext';
import { checkoutService, CheckoutStatus } from '@/src/modules/checkout/services/checkoutService';
import { partnerService } from '@/src/services/partnerService';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Package pricing
  const packages: Record<string, { name: string, price: number }> = {
    standard: { name: 'STANDARD PAKET', price: 10 },
    business: { name: 'BUSINESS PAKET', price: 15 },
    premium: { name: 'PREMIUM PAKET', price: 25 },
  };

  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const packageId = searchParams.get('paket') || 'premium';
  const adId = searchParams.get('adId') || undefined;
  const paymentType = (searchParams.get('type') || 'package_purchase') as 'wallet_deposit' | 'package_purchase' | 'ad_payment';

  const selectedPackage = packages[packageId] || packages.premium;

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr' | 'invoice'>('card');
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [promoStatus, setPromoStatus] = useState<null | 'success' | 'error'>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  // Invoice Fields
  const [invoiceForm, setInvoiceForm] = useState({
    companyName: user?.displayName || '',
    pib: '',
    email: user?.email || '',
    address: ''
  });

  // Auto-apply promo from URL or Session
  useEffect(() => {
    // Session attribution takes precedence as the single source of truth for tracking
    const storedAffId = sessionStorage.getItem('affiliate_id');
    const storedCode = sessionStorage.getItem('affiliate_code');
    const promoFromUrl = searchParams.get('promo');
    
    if (storedAffId && storedCode) {
      setAffiliateId(storedAffId);
      setPromoCode(storedCode);
      applyPromoCode(storedCode); // validate and apply safely
    } else if (promoFromUrl) {
      setPromoCode(promoFromUrl);
      applyPromoCode(promoFromUrl);
    }

    if (searchParams.get('payment_error') === 'cancel') {
      alert("Plaćanje je otkazano. Možete ponovo pokušati ili izabrati drugi metod.");
    }
  }, []);

  const applyPromoCode = async (codeToApply = promoCode) => {
    const code = codeToApply.trim().toUpperCase();
    
    // VIP Hardcoded codes (30%)
    if (code === 'MARKO30' || code === 'ŽIKA30') {
      setDiscountApplied(0.3);
      setPromoStatus('success');
      return;
    } 
    
    // Check dynamic partners via DB
    if (code) {
      try {
        const partner = await partnerService.getPartnerByCode(code);
        if (partner && partner.id) {
          const timestamp = new Date().toISOString();
          // Explicit promo application overrides or sets the checkout session affiliate
          setAffiliateId(partner.id);
          sessionStorage.setItem('affiliate_id', partner.id);
          sessionStorage.setItem('affiliate_code', code);
          sessionStorage.setItem('affiliate_timestamp', timestamp);
          sessionStorage.setItem('affiliate_source', 'checkout_promo_input');
          
          setDiscountApplied(0.1); // Standard partner discount 10%
          setPromoStatus('success');
        } else {
          // Do not wipe the existing session affiliate id on a mistyped code
          setDiscountApplied(0);
          setPromoStatus('error');
        }
      } catch (err) {
        console.error("Partner validation error:", err);
        setPromoStatus('error');
      }
    }
  };

  const handleSuccessfulPayment = async (method: string) => {
    setIsProcessing(true);
    setCheckoutStatus('initiated');
    
    try {
      if (paymentMethod === 'card') {
        const { url } = await checkoutService.createStripeSession({
          packageId: packageId,
          packageName: selectedPackage.name,
          amount: currentTotal,
          type: paymentType,
          adId: adId,
        });
        
        if (url) {
          window.location.href = url;
          return;
        }
      }

      if (method === 'INVOICE/FAKTURA') {
        const pdfBlob = await checkoutService.generateInvoice({
          packageId: packageId,
          packageName: selectedPackage.name,
          amount: currentTotal,
          customerInfo: {
            name: invoiceForm.companyName,
            email: invoiceForm.email,
            pib: invoiceForm.pib,
            address: invoiceForm.address
          }
        });

        // Trigger download
        const url = window.URL.createObjectURL(new Blob([pdfBlob as any]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Predracun-${selectedPackage.name.replace(' ', '-')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        setCheckoutStatus('pending');
        setTimeout(() => {
          setCheckoutStatus('confirmed');
          alert(`PREDRAČUN GENERISAN! Molimo izvršite uplatu po primljenom dokumentu. Vaš paket će postati aktivan nakon potvrde uplate.`);
          navigate('/dashboard');
          setIsProcessing(false);
        }, 2000);
        return;
      }

      // Execute consolidated checkout flow for other methods

      // Update state to pending while waiting for simulated confirmation
      setCheckoutStatus('pending');

      // Note: Success redirection happens after simulated confirmation in service
      // For UX, we show success after a short wait if status confirms
      setTimeout(() => {
        setCheckoutStatus('confirmed');
        alert(`ZAHTEV ZA PLAĆANJE POSLAT (${method}). Hvala na poverenju!`);
        navigate('/poslovi');
        setIsProcessing(false);
      }, 2500);

    } catch (err) {
      console.error("Checkout process failed:", err);
      setCheckoutStatus('failed');
      setIsProcessing(false);
      alert("Došlo je do greške prilikom inicijalizacije plaćanja. Molimo pokušajte ponovo.");
    }
  };

  const basePrice = selectedPackage.price;
  const discountAmount = basePrice * discountApplied;
  const priceAfterDiscount = basePrice - discountAmount;
  const tax = priceAfterDiscount * 0.20; // 20% PDV
  const currentTotal = priceAfterDiscount + tax;

  return (
    <div className="bg-[#070B0F] min-h-screen text-white font-sans selection:bg-secondary selection:text-slate-950 flex flex-col">
      <Navbar />
      
      <div className="flex-1 my-10 max-w-7xl mx-auto w-full px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-32">
        {/* Left: Form */}        <div className="lg:col-span-7 bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 md:p-12 shadow-2xl relative overflow-hidden h-max">
          {/* subtle glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-8 relative z-10">
             <div className="w-12 h-12 rounded-[10px] bg-secondary/10 flex items-center justify-center border border-secondary/20">
               <span className="material-symbols-outlined text-secondary text-2xl">account_balance_wallet</span>
             </div>
             <div>
               <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">NAČIN PLAĆANJA</h1>
               <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">IZABERITE METOD TRANSAKCIJE</p>
             </div>
          </div>

          <div className="relative z-10">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              <button onClick={() => setPaymentMethod('card')} className={`py-4 px-2 rounded-[10px] border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-white/5 bg-white/5 text-on-surface-variant hover:bg-white/10'}`}>
                <span className="material-symbols-outlined text-2xl">credit_card</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center">Platna Kartica</span>
              </button>
              <button onClick={() => setPaymentMethod('qr')} className={`py-4 px-2 rounded-[10px] border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'qr' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-white/5 bg-white/5 text-on-surface-variant hover:bg-white/10'}`}>
                <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center">mBanking / QR</span>
              </button>
              <button onClick={() => setPaymentMethod('invoice')} className={`py-4 px-2 rounded-[10px] border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'invoice' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-white/5 bg-white/5 text-on-surface-variant hover:bg-white/10'}`}>
                <span className="material-symbols-outlined text-2xl">request_quote</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center">Faktura (Virmanski)</span>
              </button>
            </div>

            {/* Dynamic Content */}
            {paymentMethod === 'card' && (
              <div className="space-y-8 py-4">
                <div className="bg-secondary/5 border border-secondary/20 rounded-[10px] p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center text-secondary mb-4">
                    <span className="material-symbols-outlined text-3xl">safe</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">Sigurno Plaćanje Karticom</h3>
                  <p className="text-[10px] text-white/50 leading-relaxed font-bold max-w-sm uppercase tracking-widest">
                    Bićete preusmereni na siguran Stripe Checkout portal za unos podataka. Podržavamo Visa, Mastercard, AMEX i DinaCard.
                  </p>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleSuccessfulPayment('CARD')} 
                    className="w-full bg-secondary hover:bg-yellow-400 text-slate-950 font-black py-6 rounded-[10px] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-[0_0_30px_rgba(254,191,13,0.2)] hover:shadow-[0_0_50px_rgba(254,191,13,0.4)] disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="material-symbols-outlined relative z-10">{isProcessing ? 'sync' : 'payments'}</span>
                    <span className="tracking-[0.2em] uppercase text-sm relative z-10">
                      {isProcessing ? 'INICIJALIZACIJA...' : `NASTAVI NA PLAĆANJE (${(currentTotal).toFixed(2)} EUR)`}
                    </span>
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-8 opacity-20 mt-8 grayscale mix-blend-screen">
                   <div className="flex items-center gap-1 font-black text-xs italic tracking-tighter">VISA</div>
                   <div className="flex items-center gap-1 font-black text-xs italic tracking-tighter">mastercard</div>
                   <div className="flex items-center gap-1 font-black text-xs italic tracking-tighter">DinaCard</div>
                   <div className="flex items-center gap-1 font-black text-xs italic tracking-tighter">AMEX</div>
                </div>
              </div>
            )}
            
            {paymentMethod === 'qr' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-[10px] p-8 flex flex-col items-center text-center">
                  <div className="w-48 h-48 bg-white p-2 rounded-[10px] mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative">
                    <OptimizedImage 
                      src="" 
                      fallbackType="company" 
                      alt="IPS QR" 
                      className="w-full h-full object-cover opacity-30 grayscale" 
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-slate-200">
                      <span className="text-slate-900 font-black text-[10px]">IPS</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">IPS Skeniraj (mBanking)</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-medium max-w-sm">
                    Otvorite mBanking aplikaciju na Vašem telefonu i izaberite opciju <strong>"IPS Skeniraj"</strong>. Skenirajte QR kod za instant plaćanje.
                  </p>
                </div>
                
                <div className="pt-4">
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleSuccessfulPayment('QR/MBANKING')} 
                    className="w-full bg-[#0A0F14] border-2 border-secondary text-secondary hover:bg-secondary hover:text-slate-950 font-black py-5 rounded-[10px] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined animate-spin-slow">refresh</span>
                    <span className="tracking-[0.2em] uppercase text-sm">
                      {isProcessing ? 'PROVERA UPLATE...' : 'POTVRDI SKENIRANJE'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'invoice' && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-6 rounded-[10px] flex items-start gap-4 mb-6">
                  <span className="material-symbols-outlined shrink-0 text-blue-400">info</span>
                  <div className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                    Predračun će biti generisan i poslat na uneti email. Oglas postaje aktivan nakon evidentiranja uplate na našem računu.
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">NAZIV KOMPANIJE / PRAVNOG LICA</label>
                    <input 
                      value={invoiceForm.companyName}
                      onChange={(e) => setInvoiceForm({...invoiceForm, companyName: e.target.value})}
                      type="text" 
                      placeholder="Graditelj d.o.o." 
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] px-5 py-4 text-white text-sm font-bold outline-none focus:border-secondary/50 transition-colors hover:bg-white/[0.08]" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">PIB</label>
                      <input 
                        value={invoiceForm.pib}
                        onChange={(e) => setInvoiceForm({...invoiceForm, pib: e.target.value})}
                        type="text" 
                        placeholder="10XXXXXXX" 
                        className="w-full bg-white/5 border border-white/10 rounded-[10px] px-5 py-4 text-white text-sm font-bold outline-none focus:border-secondary/50 transition-colors font-mono hover:bg-white/[0.08]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">SEDIŠTE / ADRESA</label>
                      <input 
                        value={invoiceForm.address}
                        onChange={(e) => setInvoiceForm({...invoiceForm, address: e.target.value})}
                        type="text" 
                        placeholder="Ulica i broj, Grad" 
                        className="w-full bg-white/5 border border-white/10 rounded-[10px] px-5 py-4 text-white text-sm font-bold outline-none focus:border-secondary/50 transition-colors hover:bg-white/[0.08]" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">EMAIL ZA PRIJEM PREDRAČUNA</label>
                    <input 
                      value={invoiceForm.email}
                      onChange={(e) => setInvoiceForm({...invoiceForm, email: e.target.value})}
                      type="email" 
                      placeholder={`finansije@kompanija.${APP_CONFIG.DOMAIN}`} 
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] px-5 py-4 text-white text-sm font-bold outline-none focus:border-secondary/50 transition-colors hover:bg-white/[0.08]" 
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleSuccessfulPayment('INVOICE/FAKTURA')} 
                    className="w-full bg-white hover:bg-slate-200 text-slate-950 font-black py-6 rounded-[10px] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">receipt</span>
                    <span className="tracking-[0.2em] uppercase text-sm">
                      {isProcessing ? 'GENERISANJE...' : 'GENERIŠI PREDRAČUN'}
                    </span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-secondary/5 border border-secondary/20 rounded-[10px] p-8 md:p-10 relative overflow-hidden flex flex-col">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <h3 className="text-[10px] font-black text-secondary tracking-widest uppercase mb-6 pb-4 border-b border-secondary/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              PREGLED NARUDŽBINE
            </h3>
            
            <div className="space-y-6 mb-8 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xl font-black text-white uppercase tracking-tight">{selectedPackage.name}</div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">MESEČNA OGLASNA POZICIJA</div>
                </div>
                <div className={`text-xl font-black ${discountApplied > 0 ? 'text-white/40 line-through' : 'text-white'}`}>
                  {basePrice.toFixed(2)} €
                </div>
              </div>

              {discountApplied > 0 && (
                <div className="flex justify-between items-start text-emerald-400 bg-emerald-400/5 p-3 rounded-[10px] border border-emerald-400/20">
                  <div>
                    <div className="text-sm font-black uppercase tracking-tight">POPUST PARTNERA</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">KOD: {promoCode.toUpperCase()} (-{discountApplied * 100}%)</div>
                  </div>
                  <div className="text-sm font-black">-{discountAmount.toFixed(2)} €</div>
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-white/60 uppercase tracking-tight">PDV (20%)</div>
                </div>
                <div className="text-sm font-bold text-white/60">{tax.toFixed(2)} €</div>
              </div>
            </div>

            <div className="border-t border-secondary/20 pt-6">
              <div className="flex justify-between items-end">
                <div className="text-xs font-black text-white/60 tracking-widest uppercase mb-1">UKUPNO ZA NAPLATU</div>
                <div className="text-4xl font-black text-secondary flex items-start gap-1">
                  {currentTotal.toFixed(2)} <span className="text-xl mt-1">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Affiliate Promo Block */}
          <div className="bg-white/5 border border-white/10 rounded-[10px] p-6 md:p-8">
            <h4 className="text-[10px] font-black tracking-widest uppercase mb-4 text-white/60 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">local_offer</span> Imate Promo Kod?
            </h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoStatus(null);
                }}
                placeholder="Unesite kod..." 
                className="flex-1 bg-[#0A0F14] border border-white/10 rounded-[10px] px-4 py-3 text-white text-sm font-bold outline-none focus:border-secondary/50 placeholder:text-white/20 uppercase"
              />
              <button 
                onClick={() => applyPromoCode()}
                className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-3 rounded-[10px] transition-all text-xs tracking-widest uppercase"
              >
                Primeni
              </button>
            </div>
            {promoStatus === 'success' && (
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Kod uspešno primenjen!
              </p>
            )}
            {promoStatus === 'error' && (
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span> Nepostojeći promo kod.
              </p>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
