import React, { useState, useRef } from 'react';

interface MessageInputProps {
  activeConversationId: string | null;
  onSendMessage: (text: string, type: 'text' | 'image' | 'offer') => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
}

export function MessageInput({
  activeConversationId,
  onSendMessage,
  onUploadImage
}: MessageInputProps) {
  const [newMessage, setNewMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;
    
    const messageToSend = newMessage;
    setNewMessage('');
    await onSendMessage(messageToSend, 'text');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeConversationId || !e.target.files?.length) return;
    const file = e.target.files[0];
    e.target.value = '';

    try {
      const url = await onUploadImage(file);
      if (url) {
        await onSendMessage(url, 'image');
      }
    } catch (err) {
      alert("Greška pri slanju slike");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 md:p-8 bg-[#070B0F]/50 backdrop-blur-xl border-t border-white/5 pb-8 md:pb-8">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-5 items-center max-w-5xl mx-auto">
        <div className="hidden md:flex gap-2">
          <button 
            type="button" 
            onClick={triggerFileInput}
            className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined">add_photo_alternate</span>
          </button>
          <button type="button" className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined">mood</span>
          </button>
        </div>
        <button 
            type="button" 
            onClick={triggerFileInput}
            className="md:hidden w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all shrink-0"
          >
            <span className="material-symbols-outlined">add_photo_alternate</span>
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={newMessage}
            onChange={handleInputChange}
            placeholder="PORUKA..." 
            className="w-full bg-white/[0.03] border border-white/10 rounded-[10px] md:rounded-[10px] py-4 md:py-5 px-4 md:px-8 text-[10px] md:text-xs font-black tracking-widest uppercase focus:border-secondary transition-all outline-none text-white placeholder:text-white/20"
          />
        </div>
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="w-12 h-12 md:w-14 md:h-14 bg-secondary text-slate-950 rounded-[10px] md:rounded-[10px] flex items-center justify-center hover:bg-yellow-400 transition-all shadow-2xl shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
        >
          <span className="material-symbols-outlined font-black group-hover:translate-x-1 transition-transform">send</span>
        </button>
      </form>
    </div>
  );
}
