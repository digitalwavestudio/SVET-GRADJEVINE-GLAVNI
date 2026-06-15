import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface ProfileHealthProps {
  score: number;
  missingItems?: string[];
  hideButton?: boolean;
}

export default function ProfileHealth({ score, hideButton }: ProfileHealthProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16"></div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">POPUNJEN PROFIL</h3>
          <div className="text-2xl font-black text-white tracking-tighter uppercase">
            {score}% <span className="text-blue-500">KOMPLETAN</span>
          </div>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={175.9}
              strokeDashoffset={175.9 - (175.9 * score) / 100}
              className="text-blue-500 transition-all duration-1000"
            />
          </svg>
        </div>
      </div>

      {!hideButton && (
        <Link 
          to="/moj-profil" 
          className="w-full mt-8 py-4 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          POPUNI PROFIL SADA
        </Link>
      )}
    </motion.div>
  );
}
