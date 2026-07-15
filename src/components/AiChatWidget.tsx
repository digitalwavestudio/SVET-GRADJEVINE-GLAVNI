import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const STORAGE_KEY = 'sg_ai_chat_history';

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Učitavanje iz localStorage pri inicijalizaciji
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([{ role: 'model', content: 'Dobar dan! Ja sam SG Asistent. Kako mogu da Vam pomognem danas?' }]);
      }
    } else {
      setMessages([{ role: 'model', content: 'Dobar dan! Ja sam SG Asistent. Kako mogu da Vam pomognem danas?' }]);
    }
  }, []);

  // Čuvanje u localStorage kad god se poruke promene
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const data = await response.json();
      
      if (data && data.response) {
        setMessages([...newMessages, { role: 'model', content: data.response }]);
      } else {
        setMessages([...newMessages, { role: 'model', content: 'Izvinite, došlo je do greške.' }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'model', content: 'Server je trenutno nedostupan. Pokušajte ponovo kasnije.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-[110px] right-4 md:bottom-24 md:right-8 z-50 w-14 h-14 rounded-full bg-secondary text-surface shadow-[0_0_20px_rgba(254,191,13,0.4)] flex items-center justify-center hover:scale-110 transition-transform duration-300 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-label="Otvori AI Asistenta"
      >
        <span className="material-symbols-outlined text-3xl font-light">smart_toy</span>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:bottom-24 md:right-8 z-50 md:w-[380px] md:h-[600px] h-[85vh] bg-[#0c1e3d]/95 backdrop-blur-xl border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#10274f] to-[#0c1e3d] border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary">smart_toy</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">SG Asistent</h3>
                  <p className="text-secondary/80 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#050f1a]/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-secondary text-[#050f1a] rounded-tr-sm font-medium'
                        : 'bg-[#1a2f4c] text-white/90 rounded-tl-sm border border-white/5 shadow-inner'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex w-full justify-start">
                  <div className="bg-[#1a2f4c] rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0c1e3d] border-t border-white/10 shrink-0">
              <div className="relative flex items-end gap-2 bg-[#050f1a] rounded-2xl border border-white/10 p-1 pl-4 shadow-inner focus-within:border-secondary/50 focus-within:ring-1 focus-within:ring-secondary/50 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pitajte asistenta..."
                  className="w-full bg-transparent text-white placeholder-white/30 text-sm md:text-base resize-none outline-none py-3 max-h-[120px] custom-scrollbar"
                  rows={1}
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 shrink-0 rounded-xl bg-secondary text-[#050f1a] flex items-center justify-center hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5"
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>send</span>
                </button>
              </div>
              <p className="text-center text-[10px] text-white/40 mt-2">
                AI može praviti greške. Proverite važne informacije.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
