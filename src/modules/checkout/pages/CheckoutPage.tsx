import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '@/src/components/Footer';
import Navbar from '@/src/components/Navbar';
import { APP_CONFIG } from '@/src/constants/config';
import { useAuth } from '@/src/context/AuthContext';
import { getLazyAuth } from '@/src/lib/firebase';
import { partnerService } from '@/src/services/partnerService';

type CheckoutStatus = 'initiated' | 'pending' | 'confirmed' | 'failed';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Package pricing
  const packages: Record<string, { name: string, price: number }> = {
    starter: { name: 'STARTER PAKET', price: 29 },
    pro: { name: 'PRO PAKET', price: 79 },
    enterprise: { name: 'ENTERPRISE PAKET', price: 199 },
  };

  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const packageId = searchParams.get('paket') || 'pro';
  const adId = searchParams.get('adId') || undefined;
  const paymentType = (searchParams.get('type') || 'package_purchase') as 'wallet_deposit' | 'package_purchase' | 'ad_payment';

  const selectedPackage = packages[packageId] || packages.pro;

  const paymentMethod = 'invoice';
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
      if (method === 'INVOICE/FAKTURA') {
        const token = await (await getLazyAuth()).currentUser?.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/checkout/generate-proforma`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            packageId: packageId,
            packageName: selectedPackage.name,
            amount: currentTotal,
            customerInfo: {
              name: invoiceForm.companyName,
              email: invoiceForm.email,
              pib: invoiceForm.pib,
              address: invoiceForm.address,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate invoice');
        }

        const pdfBlob = await response.blob();

        const url = window.URL.createObjectURL(new Blob([pdfBlob]));
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
    <div className="bg-[#070B0F] min-h-screen text-white font-sans selection:bg-secondary selection:!text-black flex flex-col">
      <Navbar />
      
      <div className="flex-1 my-10 max-w-7xl mx-auto w-full px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-32">
        {/* Left: Form */}        <div className="lg:col-span-7 bg-[#0A0F14] border border-white/5 rounded-[10px] p-4 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden h-max">
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
                    className="w-full bg-white hover:bg-slate-200 !text-black font-black py-6 rounded-[10px] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
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
