import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useBotDetector } from '@/src/hooks/useBotDetector';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  path: string;
  icon: string;
  roles?: string[];
  action?: () => void;
}

export default function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const isBot = useBotDetector();

  const isEmployer = user?.role === 'poslodavac';
  const isMaster = false;

  // O-O (Oauth-Obfuscation) & Skeleton Indexing: Botovima nije potreban Command Center
  if (isBot) return null;

  const commands: CommandItem[] = useMemo(() => [
    // Navigacija
    { id: '1', label: 'MOJ PROFIL', category: 'NAVIGACIJA', path: '/moj-profil', icon: 'person' },
    { id: '2', label: 'PORUKE', category: 'KOMUNIKACIJA', path: '/poruke', icon: 'chat' },
    { id: '3', label: 'PODEŠAVANJA', category: 'SISTEM', path: '/podesavanja', icon: 'settings' },
    
    // Employer Specific
    { id: 'e1', label: 'POSTAVI NOVI OGLAS', category: 'AKCIJE', path: '/postavi-oglas', icon: 'add_circle', roles: ['poslodavac'] },
    { id: 'e2', label: 'PRETRAŽI MAJSTORE', category: 'AKCIJE', path: '/moj-profil/baza-majstora', icon: 'person_search', roles: ['poslodavac'] },
    { id: 'e3', label: 'MOJI OGLASI', category: 'UPRAVLJANJE', path: '/moj-profil/oglasi', icon: 'campaign', roles: ['poslodavac'] },
    { id: 'e4', label: 'KANDIDATI', category: 'UPRAVLJANJE', path: '/moj-profil/kandidati', icon: 'group', roles: ['poslodavac'] },
    
    // Master Specific

    
    // General
    { id: 'g1', label: 'NOVČANIK', category: 'FINANSIJE', path: '/novcanik', icon: 'account_balance_wallet' },
    { id: 'g2', label: 'DOKUMENTI', category: 'ARHIVA', path: '/moj-profil/dokumenti', icon: 'folder' },
    { id: 'g3', label: 'KALENDAR', category: 'PLANIRANJE', path: '/moj-profil/kalendar', icon: 'calendar_today' },
    { id: 'g4', label: 'PODRŠKA', category: 'POMOĆ', path: '/podrska', icon: 'help' },
    { id: 'logout', label: 'ODJAVI SE', category: 'SISTEM', path: '/prijava', icon: 'logout', action: logout },
  ], [logout]);

  const filteredCommands = useMemo(() => {
    return commands.filter(cmd => {
      const matchesSearch = cmd.label.toLowerCase().includes(search.toLowerCase()) ||
                           cmd.category.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !cmd.roles || (user && cmd.roles.includes(user.role));
      return matchesSearch && matchesRole;
    });
  }, [commands, search, user?.role]);

  const selectedIndexRef = useRef(selectedIndex);
  const filteredCommandsRef = useRef(filteredCommands);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    filteredCommandsRef.current = filteredCommands;
    isOpenRef.current = isOpen;
  }, [selectedIndex, filteredCommands, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if (isOpenRef.current) {
        const cmds = filteredCommandsRef.current;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % cmds.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + cmds.length) % cmds.length);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const selected = cmds[selectedIndexRef.current];
          if (selected) handleAction(selected);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleAction = (cmd: CommandItem) => {
    if (cmd.action) {
      cmd.action();
    }
    navigate(cmd.path);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-[#0A0F14] border border-white/10 rounded-[10px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10"
          >
            {/* Search Input */}
            <div className="p-8 border-b border-white/5 flex items-center gap-6 bg-white/[0.02]">
              <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl">terminal</span>
              </div>
              <input 
                ref={inputRef}
                placeholder="KOMANDNI CENTAR: UNESITE KOMANDU..."
                className="bg-transparent border-none outline-none text-white font-black uppercase tracking-[0.1em] text-lg w-full placeholder:text-white/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-[10px]">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">ESC</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[450px] overflow-y-auto no-scrollbar p-6">
              {filteredCommands.length > 0 ? (
                <div className="space-y-8">
                  {Array.from(new Set(filteredCommands.map(c => c.category))).map(cat => (
                    <div key={cat}>
                      <div className="px-4 mb-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-4">
                        {cat}
                        <div className="h-px flex-1 bg-white/5"></div>
                      </div>
                      <div className="space-y-1">
                        {filteredCommands.filter(c => c.category === cat).map((cmd) => {
                          const isSelected = filteredCommands[selectedIndex]?.id === cmd.id;
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleAction(cmd)}
                              onMouseEnter={() => setSelectedIndex(filteredCommands.indexOf(cmd))}
                              className={`w-full flex items-center gap-4 p-4 rounded-[10px] transition-all group relative ${
                                isSelected ? 'bg-secondary shadow-lg shadow-secondary/10' : 'hover:bg-white/5'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all ${
                                isSelected ? 'bg-slate-950 text-secondary' : 'bg-white/5 text-white/20 group-hover:text-secondary group-hover:bg-secondary/10'
                              }`}>
                                <span className="material-symbols-outlined text-xl">{cmd.icon}</span>
                              </div>
                              <div className="flex flex-col items-start">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${
                                  isSelected ? '!text-black' : 'text-white/60 group-hover:text-white'
                                }`}>
                                  {cmd.label}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-tighter ${
                                  isSelected ? '!text-black/40' : 'text-white/20'
                                }`}>
                                  {cmd.category}
                                </span>
                              </div>
                              {isSelected && (
                                <motion.div 
                                  layoutId="active-indicator"
                                  className="ml-auto flex items-center gap-2"
                                >
                                  <span className="text-[9px] font-black !text-black/60 uppercase tracking-widest">POKRENI</span>
                                  <span className="material-symbols-outlined !text-black text-sm">keyboard_return</span>
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-[10px] flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-white/10">search_off</span>
                  </div>
                  <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">NEMA REZULTATA ZA "{search}"</p>
                  <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest mt-2">PROBAJTE DRUGAČIJI TERMIN</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-white/40">keyboard_arrow_up</span>
                  </div>
                  <div className="w-5 h-5 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-white/40">keyboard_arrow_down</span>
                  </div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">NAVIGACIJA</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                    <span className="text-[9px] font-black text-white/40">ENTER</span>
                  </div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">IZABERI</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">SVET GRAĐEVINE OS v1.0</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
