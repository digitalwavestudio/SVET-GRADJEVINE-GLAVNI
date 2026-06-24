import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { walletService } from '@/src/modules/checkout/services/walletService';
import { toast } from 'react-hot-toast';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<'invoice'>('invoice');
  const [invoiceRequested, setInvoiceRequested] = useState<{referenceNumber: string, amount: number} | null>(null);

  const presetAmounts = [1000, 2000, 5000, 10000];

  const handleDeposit = async () => {
    if (amount < 500) {
      toast.error('Minimalan iznos je 500 Kredita (500 RSD)');
      return;
    }

    try {
      setLoading(true);
      const res = await walletService.createManualDeposit(amount);
      setInvoiceRequested(res);
      toast.success("Uputstvo za uplatu je generisano!");
    } catch (err: any) {
      toast.error(err.message || 'Greška pri kreiranju uplate');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInvoiceRequested(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="relative bg-[#0A0F14] border border-white/10 rounded-[10px] p-8 w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {invoiceRequested ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">receipt_long</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Uputstvo za uplatu
              </h2>
              <p className="text-white/60 text-sm font-medium">
                Molimo vas da izvršite uplatu prema sledećim instrukcijama. Vaša sredstva će biti na raspolaganju nakon što naš tim evidentira uplatu.
              </p>

              <div className="bg-white/5 border border-white/10 p-6 rounded-[10px] text-left space-y-4">
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Primalac</div>
                  <div className="font-bold text-white uppercase text-sm">SG GROUP</div>
                  <div className="text-white/80 text-xs">Račanska 2, 11300 Smederevo</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Iznos (RSD)</div>
                  <div className="font-black text-xl text-green-400">{invoiceRequested.amount.toLocaleString('sr-RS')} RSD</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Broj Tekućeg Računa</div>
                  <div className="font-black text-white font-mono text-lg bg-black/50 p-2 rounded inline-block">265-1630310011188-16</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Poziv na Broj</div>
                  <div className="font-black text-secondary font-mono text-lg bg-secondary/10 p-2 rounded border border-secondary/20 inline-block">{invoiceRequested.referenceNumber}</div>
                  <p className="text-xs text-red-400 font-bold mt-2">OBAVEZNO unesite tačan poziv na broj inače sistem neće automatski prepoznati uplatu!</p>
                </div>
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Firma</div>
                  <div className="font-bold text-white uppercase text-sm">SG Group</div>
                  <div className="text-white/80 text-xs">PIB: 114632588</div>
                  <div className="text-white/80 text-xs">Tekući račun: 265-1630310011188-16</div>
                  <div className="text-white/80 text-xs">Telefon: +381 66 27 55 32</div>
                </div>
              </div>

              <button 
                onClick={handleClose}
                className="w-full py-4 rounded-[10px] bg-secondary !text-black font-black uppercase tracking-widest hover:bg-yellow-400 transition-all"
              >
                Razumeo sam / U redu
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                  Dopuna Novčanika
                </h2>
                <p className="text-white/60 text-sm font-medium">
                  Izaberite iznos za dopunu i metodu plaćanja.
                </p>
              </div>

              <div className="mb-6 flex p-1 bg-white/5 rounded-[12px]">
                <div className="flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[10px] transition-all flex items-center justify-center gap-2 bg-secondary !text-black shadow-md transform scale-[1.02]">
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span> Faktura / uplatnica
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`py-3 rounded-[10px] border font-black tracking-widest transition-all ${
                      amount === preset 
                        ? 'bg-secondary !text-black border-secondary' 
                        : 'bg-white/5 text-white border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {preset.toLocaleString()} KREDITA
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest pl-4 mb-2">Drugi iznos kredita (1 Kredit = 1 RSD)</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black text-xl placeholder-white/20 focus:outline-none focus:border-secondary transition-colors"
                  placeholder="npr. 1500"
                />
              </div>

              <button 
                onClick={handleDeposit}
                disabled={loading || amount < 500}
                className={`w-full py-4 rounded-[10px] font-black uppercase tracking-widest transition-all ${
                  loading || amount < 500
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-secondary !text-black hover:bg-yellow-400'
                }`}
              >
                {loading ? 'PRIČEKAJTE...' : `GENERIŠI UPLATNICU ZA ${amount.toLocaleString()} RSD`}
              </button>

              <button 
                onClick={handleClose}
                className="w-full mt-4 py-3 text-white/40 font-black uppercase tracking-widest text-xs hover:text-white transition-all"
              >
                Odustani
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
