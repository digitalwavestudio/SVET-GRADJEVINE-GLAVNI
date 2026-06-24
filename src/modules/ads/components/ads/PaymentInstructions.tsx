import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';

interface PaymentInstructions {
  amount: number;
  referenceNumber: string;
  targetName?: string;
}

export function PaymentInstructions({ amount, referenceNumber, targetName }: PaymentInstructions) {
  const { user } = useAuth();
  const [paymentTab, setPaymentTab] = useState<'uplatnica' | 'faktura'>('uplatnica');

  const uplatilac = targetName || user?.businessProfile?.companyName || user?.company || (user?.firstName + ' ' + (user?.lastName || ''));

  return (
    <div className="space-y-8">
      <div className="flex gap-2 bg-black/40 p-2 rounded-[10px]">
        <button 
          onClick={() => setPaymentTab('uplatnica')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[10px] transition-all flex items-center justify-center gap-2 ${paymentTab === 'uplatnica' ? 'bg-secondary !text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Uplatnica (Fizička lica)
        </button>
        <button 
          onClick={() => setPaymentTab('faktura')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[10px] transition-all flex items-center justify-center gap-2 ${paymentTab === 'faktura' ? 'bg-secondary !text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Predračun (Pravna lica)
        </button>
      </div>

      {paymentTab === 'uplatnica' ? (
        <div className="bg-[#FFF5F5] rounded-[10px] overflow-hidden p-6 text-black border border-red-200">
          <div className="border-b-2 border-red-500 pb-2 mb-4 flex justify-between items-end text-red-700 font-bold uppercase text-xs">
            <span>NALOG ZA UPLATU</span>
            <span className="text-[8px]">Obrazac br. 1</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-[10px] font-medium">
              <div>
                <label className="text-red-600 block mb-1">UPLATILAC</label>
                <div className="border border-red-300 p-2 bg-white min-h-[40px] uppercase font-bold">
                  {uplatilac}
                </div>
              </div>
              <div>
                <label className="text-red-600 block mb-1">SVRHA UPLATE</label>
                <div className="border border-red-300 p-2 bg-white min-h-[40px]">
                  USLUGE OGLAŠAVANJA NA PORTALU SVET GRAĐEVINE
                </div>
              </div>
              <div>
                <label className="text-red-600 block mb-1">PRIMALAC</label>
                <div className="border border-red-300 p-2 bg-white min-h-[40px] uppercase font-bold">
                  SG GROUP, Katarina Lancrat Tomanović PR<br/>Račanska 2, 11300 Smederevo
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="w-16 text-[10px]">
                  <label className="text-[8px] text-red-600 block mb-1 uppercase font-bold">šifra</label>
                  <div className="border border-red-300 p-2 bg-white text-center font-bold">189</div>
                </div>
                <div className="w-16 text-[10px]">
                  <label className="text-[8px] text-red-600 block mb-1 uppercase font-bold">valuta</label>
                  <div className="border border-red-300 p-2 bg-white text-center font-bold">RSD</div>
                </div>
                <div className="flex-1 text-[10px]">
                  <label className="text-[8px] text-red-600 block mb-1 uppercase font-bold text-right">iznos</label>
                  <div className="border border-red-300 p-2 bg-white text-right font-black">{`= ${amount.toLocaleString('sr-RS')},00`}</div>
                </div>
              </div>
              <div>
                <label className="text-[8px] text-red-600 block mb-1 uppercase font-bold">račun primaoca</label>
                <div className="border border-red-300 p-2 bg-white text-center font-bold text-md text-red-900">
                  265-1630310011188-16
                </div>
              </div>
              <div>
                <label className="text-[8px] text-red-600 block mb-1 uppercase font-bold">poziv na broj</label>
                <div className="border border-red-300 p-2 bg-white text-center font-black tracking-widest uppercase">
                  {referenceNumber}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] p-8 text-black shadow-2xl border border-blue-50">
          <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-100">
            <h3 className="text-2xl font-black text-blue-900 tracking-tighter">PREDRAČUN</h3>
            <div className="text-right text-[10px] font-bold text-gray-500 uppercase">
              Svet Građevine<br/>PIB: 114632588
            </div>
          </div>
          <div className="space-y-4 mb-8">
             <div className="flex justify-between text-xs">
                <span className="text-gray-400 uppercase font-black tracking-widest">Za uplatu:</span>
                <span className="font-black text-xl text-blue-900">{`${amount.toLocaleString('sr-RS')},00 RSD`}</span>
             </div>
             <div className="flex justify-between text-xs border-t border-gray-100 pt-4">
                <span className="text-gray-400 uppercase font-black tracking-widest">Model i poziv na broj:</span>
                <span className="font-black text-blue-900">{referenceNumber}</span>
             </div>
             <div className="flex justify-between text-xs border-t border-gray-100 pt-4">
                <span className="text-gray-400 uppercase font-black tracking-widest">Tekući račun:</span>
                <span className="font-black text-blue-900">265-1630310011188-16</span>
             </div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed text-center">
            Nakon evidentiranja uplate oglas će biti aktiviran i postavljen na vrh pretrage.
          </p>
        </div>
      )}
    </div>
  );
}
