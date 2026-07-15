import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { parseAdIntentFrontend, processAiCommand } from '@/src/lib/aiService';

export function AiMagicInput({ 
  selectedCategory, 
  setStep 
}: { 
  selectedCategory: string;
  setStep?: (n: number) => void;
}) {
  const { setValue, getValues, register, watch } = useFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const opis = watch('opis') || '';

  const handleMagicSubmit = async () => {
    if (!opis.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // 1. Parse intent
      const parsed = await parseAdIntentFrontend(opis);
      
      if (parsed && !parsed._error) {
        // Set values
        if (parsed.sector) setValue('sector', parsed.sector, { shouldValidate: true, shouldDirty: true });
        if (parsed.profession) setValue('profession', parsed.profession, { shouldValidate: true, shouldDirty: true });
        if (parsed.location) setValue('location', parsed.location, { shouldValidate: true, shouldDirty: true });
        if (parsed.plataMin) setValue('plataMin', parsed.plataMin.toString(), { shouldValidate: true, shouldDirty: true });
        if (parsed.plataMax) setValue('plataMax', parsed.plataMax.toString(), { shouldValidate: true, shouldDirty: true });
        if (parsed.salaryType) setValue('salaryType', parsed.salaryType, { shouldValidate: true, shouldDirty: true });
        if (parsed.benefits && Array.isArray(parsed.benefits)) {
          setValue('benefits', parsed.benefits, { shouldValidate: true, shouldDirty: true });
        }
      }

      // 2. Generate description
      const details = [];
      const fd = getValues();
      if (fd.profession) details.push(`Pozicija: ${fd.profession}`);
      if (fd.location) details.push(`Lokacija: ${fd.location}`);
      if (fd.plataMin || fd.plataMax) details.push(`Zarada: ${fd.plataMin || ''}${fd.plataMin && fd.plataMax ? ' - ' : ''}${fd.plataMax || ''} EUR`);
      if (fd.benefits?.length) details.push(`Benefiti: ${fd.benefits.join(', ')}`);
      // Uvek šaljemo korisnikov tekst da bi AI video ručne izmene (npr. Radno vreme, Isplata)
      details.push(`Korisnikov tekst oglasa:\n${opis}`);

      const prompt = `Napiši tekst za oglas za posao na osnovu sledećih podataka. 

PODACI SA FORME I IZ TEKSTA:
${details.map(d => `- ${d}`).join('\n')}

Format mora biti TAČNO ovakav (ako podatak postoji u tekstu upiši ga, ako ne postoji upiši samo znak ? bez ikakvih zagrada):

NAZIV POZICIJE VELIKIM SLOVIMA (Samo naziv, npr. ZIDARI)

Mesto rada: ?
Satnica: ?
Isplata: ?
Radno vreme: ?

Smeštaj: ?
Prevoz: ?
Hrana: ?

PRAVILA:
1. NIKAKVE zagrade (kao što su [] ili {}) ne smeju da se nađu u tvom odgovoru! Ako nešto fali, ostavi isključivo samo znak ?
2. Naslov neka bude tačna pozicija koju korisnik traži (npr. ZIDARI). NEMOJ dodavati brojeve (npr. "2 ZIDARA") ako korisnik nije naveo tačan broj!
3. Nema nikakvih reči pre Naslova (nema "Evo oglasa", "Tražimo").
4. Ako korisnik navede neke specifične zahteve ili detalje u svom tekstu, dodaj ih na kraju ispod benefita.
5. Završi oglas isključivo ovom rečenicom: "Može se krenuti odmah sa radom! Za sve ostale informacije i više detalja pozvati na broj telefona."`;

      const responseText = await processAiCommand(prompt);
      let cleanText = responseText.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '').trim();
      const adStart = cleanText.match(/(Tražimo|Potreban|Potrebni|Pozivamo|Zaposljavamo|Trazimo)/i);
      if (adStart && adStart.index && adStart.index > 0) {
        cleanText = cleanText.slice(adStart.index);
      }
      setValue('opis', cleanText, { shouldValidate: true, shouldDirty: true });

    } catch (err) {
      console.error("Magic Input Error:", err);
      setError("Došlo je do greške pri obradi. Molimo vas da pokušate ponovo ili popunite formu ručno.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#121b22] to-[#0a0f14] border-y sm:border border-[#ffad3a]/20 rounded-none sm:rounded-2xl p-3 sm:p-6 shadow-[0_8px_32px_rgba(255,173,58,0.05)] relative overflow-hidden mb-8 -mx-4 sm:mx-0">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#ffad3a]/5 rounded-full blur-[50px] pointer-events-none" />
      
      <div className="flex items-center justify-center sm:justify-start gap-3 mb-4 relative z-10">
        <span className="material-symbols-outlined text-[#ffad3a] text-3xl animate-pulse drop-shadow-[0_0_8px_rgba(255,173,58,0.8)]">auto_awesome</span>
        <h3 className="text-xl font-black uppercase text-white tracking-wide text-center sm:text-left">AI Pametni Unos</h3>
      </div>
      
      <p className="text-sm text-[#a2acb9] mb-4 relative z-10 text-center sm:text-left">
        Nema potrebe za popunjavanjem forme! Samo nam napišite šta vam je potrebno svojim rečima, a naš AI će popuniti sva polja i napisati savršen oglas za vas.
      </p>

      <div className="relative z-10">
        <textarea
          {...register('opis')}
          placeholder="Npr: Tražim 2 armirača za rad u Beogradu, satnica je 8 eura, obezbeđen je smeštaj, prevoz, hrana i pauza za kafu..."
          className="w-full bg-black/40 border border-white/10 rounded-sm sm:rounded-xl p-4 sm:p-5 text-white min-h-[250px] focus:outline-none focus:border-[#ffad3a]/50 focus:bg-black/60 transition-all placeholder:text-white/20 resize-none leading-relaxed shadow-inner"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleMagicSubmit();
            }
          }}
        />
        
        {error && (
          <p className="text-red-400 text-xs font-bold mt-2 uppercase">{error}</p>
        )}

        <div className="mt-4 flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={handleMagicSubmit}
            disabled={isLoading || !opis.trim()}
            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-[#ffad3a] hover:bg-[#e59b34] text-black px-6 py-3 rounded-sm sm:rounded-lg font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_4px_15px_rgba(255,173,58,0.4)]"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                Obrada...
              </>
            ) : (
              <>
                Generiši Oglas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
