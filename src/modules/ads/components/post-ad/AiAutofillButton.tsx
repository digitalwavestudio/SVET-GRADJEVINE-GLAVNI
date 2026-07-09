import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { processAiCommand } from '@/src/lib/aiService';

export function AiAutofillButton({ selectedCategory }: { selectedCategory: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getValues, setValue } = useFormContext();

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    const formData = getValues();
    const details: string[] = [];
    if (formData.profession) details.push(`Pozicija: ${formData.profession}`);
    if (formData.sector) details.push(`Sektor: ${formData.sector}`);
    if (formData.location) details.push(`Lokacija: ${formData.location}`);
    if (formData.plataMin || formData.plataMax) details.push(`Zarada: ${formData.plataMin || ''}${formData.plataMin && formData.plataMax ? ' - ' : ''}${formData.plataMax || ''} EUR`);
    if (formData.dinamikaIsplate) details.push(`Isplata: ${formData.dinamikaIsplate}`);
    if (formData.benefits?.length) details.push(`Benefiti: ${formData.benefits.join(', ')}`);

    const prompt = `Napiši KOMPLETAN opis oglasa za posao na sajtu Svet Građevine (srpski jezik).

Podaci koje OBAVEZNO moraš ugraditi u tekst:
${details.map(d => `- ${d}`).join('\n')}

Kategorija oglasa: ${selectedCategory}

KRUTA PRAVILA:
1. Nema uvodnog naslova — ne piši "Oglas za posao", "Pozicija:", "Opis posla:" niti bilo šta slično na početku.
2. Tekst počinje DIREKTNO rečenicom poput "Tražimo...".
3. Nema generičkih floskula poput "poznavanje tehnika građenja i materijala" — samo konkretne stvari.
4. Nema zagrada, nema [Placeholder].
5. Završi sa "Može se krenuti odmah sa radom!".
6. Na samom kraju dodaj: "Za sve ostale informacije i više detalja pozvati na broj telefona."
7. Samo tekst, nema markdown, nema bullet lista sa zvezdicama (*).`;

    try {
      const responseText = await processAiCommand(prompt);
      const cleanText = responseText.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '').trim();
      setValue('opis', cleanText, { shouldValidate: true, shouldDirty: true });
    } catch (err) {
      console.error("Greška pri generisanju opisa:", err);
      setError("Došlo je do greške prilikom generisanja opisa. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading}
        className="group flex w-full bg-[#121b22] border border-[#ffad3a]/30 hover:border-[#ffad3a]/70 hover:bg-[#1a252f] text-[#ffad3a] px-5 py-4 rounded-[10px] font-black transition-all duration-300 shadow-[0_4px_20px_rgba(255,173,58,0.1)] hover:shadow-[0_4px_25px_rgba(255,173,58,0.25)] text-xs md:text-sm uppercase tracking-widest items-center justify-center text-center hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed gap-3"
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined text-lg md:text-xl group-hover:animate-pulse">auto_awesome</span>
            <span>Generiši tekst oglasa pomoću AI</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg md:text-xl group-hover:animate-pulse">auto_awesome</span>
            <span>Generiši tekst oglasa pomoću AI</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-[10px] font-bold mt-2 ml-1 uppercase tracking-wider">{error}</p>
      )}
    </div>
  );
}
