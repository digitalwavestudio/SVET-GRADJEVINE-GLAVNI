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
    const prompt = `Generiši profesionalan i detaljan opis za oglas na sajtu Svet Građevine u kategoriji "${selectedCategory}". 
Evo podataka koje je korisnik do sada uneo:
${JSON.stringify(formData, null, 2)}

Tvoj zadatak je da napišeš SAMO tekst opisa (bez ikakvih uvodnih poruka poput "Evo opisa", samo gotov tekst koji ide direktno u polje za opis). 
Tekst treba da bude ubedljiv, čitljiv, gramatički ispravan, u profesionalnom tonu, formatiran sa novim redovima. Ne dodaji Markdown formatiranje osim novih redova.`;

    try {
      const responseText = await processAiCommand(prompt);
      // Clean up potential markdown code blocks if the AI hallucinates them
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
