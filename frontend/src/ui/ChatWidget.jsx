import React, { useState } from 'react';
import { audioManager } from '../audio/AudioManager';

export default function ChatWidget({ onSendCommand }) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendCommand(inputText);
    setInputText('');
  };

  const handleVoiceToggle = () => {
    // Just a visual toggle for now, actual voice is handled globally by VoiceListener
    setIsListening(true);
    audioManager.playSummon();
    setTimeout(() => setIsListening(false), 8000); // Mock listening state duration
  };

  return (
    <div className="absolute bottom-6 right-6 pointer-events-auto">
      <div className="bg-black/40 backdrop-blur-xl border border-neon-blue/40 rounded-xl p-3 shadow-[0_0_30px_rgba(0,243,255,0.15)] ring-1 ring-white/10 w-80">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <button 
            type="button" 
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg border transition-all ${isListening ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan animate-pulse shadow-[0_0_10px_#00f3ff]' : 'border-neon-blue/30 bg-black/50 text-neon-blue/70 hover:text-neon-cyan hover:border-neon-cyan/50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
          
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-black/50 border border-neon-blue/30 rounded-lg px-3 py-2 text-sm text-neon-cyan font-mono outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all placeholder:text-neon-blue/40"
          />
          
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"/>
              <path d="M22 2 11 13"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
