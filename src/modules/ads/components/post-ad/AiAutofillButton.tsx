import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { generateAdData } from '@/src/lib/aiService';

export function AiAutofillButton({ selectedCategory }: { selectedCategory: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filledFields, setFilledFields] = useState<string[] | null>(null);
  const formContext = useFormContext();
  const setValue = formContext?.setValue;

  const handleGenerate = async () => {
    if (!description.trim() || !setValue) return;
    setIsLoading(true);
    setFilledFields(null);

    const result = await generateAdData(description, selectedCategory);
    const filled: string[] = [];

    Object.entries(result).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'opis') {
          setValue('opis', value as string);
          filled.push('opis');
        } else if (key === 'location') {
          setValue('location', value as string);
          filled.push('lokacija');
        } else if (key === 'benefits' && Array.isArray(value)) {
          setValue('benefits', value);
          filled.push('benefits');
        } else if (key === 'amenities' && Array.isArray(value)) {
          setValue('amenities', value);
          filled.push('amenities');
        } else if (key === 'companyMainCats' && Array.isArray(value)) {
          setValue('companyMainCats', value);
          filled.push('kategorije');
        } else if (key === 'plotInfrastructure' && typeof value === 'object') {
          setValue('plotInfrastructure', value);
          filled.push('infrastruktura');
        } else {
          setValue(key, value);
          filled.push(key);
        }
      }
    });

    setFilledFields(filled);
    setIsLoading(false);

    if (filled.length > 0) {
      setTimeout(() => {
        setIsOpen(false);
        setFilledFields(null);
        setDescription('');
      }, 2500);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-secondary/10 border border-secondary/30 rounded-[10px] text-secondary text-xs font-black uppercase tracking-wider hover:bg-secondary/20 hover:border-secondary/50 transition-all group"
      >
        <span className="material-symbols-outlined text-lg group-hover:animate-pulse">auto_awesome</span>
        AI Autofill
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!isLoading) { setIsOpen(false); setFilledFields(null); } }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0B1219] border border-white/10 rounded-[10px] p-8 max-w-lg w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight font-headline">AI Autofill</h3>
                  <p className="text-xs text-white/40">Opiši oglas, AI popunjava formu</p>
                </div>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Npr: Potreban tesar za rad u Beogradu, plata 1000e mesecno, pocetak odmah, puno radno vreme"
                className="w-full h-32 bg-white/5 border border-white/10 rounded-[10px] p-4 text-white text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-secondary/50 transition-colors"
                disabled={isLoading}
              />

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setFilledFields(null); }}
                  className="flex-1 px-4 py-3 rounded-[10px] text-sm font-black uppercase tracking-wider border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all"
                  disabled={isLoading}
                >
                  Odustani
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading || !description.trim()}
                  className="flex-1 px-4 py-3 rounded-[10px] text-sm font-black uppercase tracking-wider bg-secondary text-black hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      Generišem...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      Generiši
                    </>
                  )}
                </button>
              </div>

              {filledFields && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-[10px] flex items-start gap-2"
                >
                  <span className="material-symbols-outlined text-green-500 text-base mt-0.5">check_circle</span>
                  <div>
                    <p className="text-sm text-green-400 font-bold">Popunjeno {filledFields.length} polje/a</p>
                    <p className="text-xs text-white/40">{filledFields.join(', ')}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
