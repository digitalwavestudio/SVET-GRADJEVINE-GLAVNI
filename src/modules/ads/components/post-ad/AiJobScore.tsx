import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { gradeAdScoreFrontend } from '@/src/lib/aiService';

export function AiJobScore() {
  const { watch, getValues } = useFormContext();
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const opis = watch('opis');
  const plataMin = watch('plataMin');
  const plataMax = watch('plataMax');
  const benefits = watch('benefits');

  useEffect(() => {
    const data = getValues();
    if (!data.opis || data.opis.length < 20) {
      setScore(null);
      setFeedback(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await gradeAdScoreFrontend(data);
        if (res && typeof res.score === 'number') {
          setScore(res.score);
          setFeedback(res.feedback);
        }
      } catch (err) {
        console.error("AiJobScore error", err);
      } finally {
        setIsLoading(false);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [opis, plataMin, plataMax, benefits, getValues]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null ? circumference - (score / 100) * circumference : circumference;
  const colorClass = 'text-[#00d2ff]'; // Always blue as requested

  if (!score && !isLoading) return null;

  return (
    <div className="bg-gradient-to-br from-[#121b22] to-[#0a0f14] border border-[#00d2ff]/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_32px_rgba(0,210,255,0.1)] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d2ff]/10 rounded-full blur-[40px] pointer-events-none" />

      <div className="flex-1 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-[#00d2ff] drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]">
            military_tech
          </span>
          <h4 className="font-black uppercase text-sm tracking-wider text-[#00d2ff]">
            AI Ocena Oglasa
          </h4>
          {isLoading && <span className="text-xs text-[#00d2ff]/70 uppercase tracking-widest animate-pulse ml-2">Analiziram...</span>}
        </div>
        
        {!isLoading && feedback && (
          <p className="text-sm text-[#a2acb9] leading-relaxed max-w-2xl">
            <span className="text-white font-bold mr-1">Savet:</span>
            {feedback}
          </p>
        )}
      </div>

      {!isLoading && score !== null && (
        <div className="relative shrink-0 flex items-center justify-center z-10">
          <svg width="80" height="80" className="transform -rotate-90 drop-shadow-[0_0_10px_rgba(0,210,255,0.4)]">
            <circle 
              cx="40" cy="40" r={radius} 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="6" 
              className="text-[#00d2ff]/10" 
            />
            <circle 
              cx="40" cy="40" r={radius} 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="6" 
              className={`${colorClass} transition-all duration-1000 ease-out`}
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${colorClass} drop-shadow-[0_0_5px_rgba(0,210,255,0.8)]`}>{score}</span>
            <span className={`text-[10px] font-bold uppercase -mt-1 ${colorClass}`}>%</span>
          </div>
        </div>
      )}
    </div>
  );
}
