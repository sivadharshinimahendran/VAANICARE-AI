import { Sparkles, Edit3, Heart, Layers } from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenDemo: () => void;
  onOpenTypeInstead: () => void;
  historyCount: number;
}

export function Header({
  currentMode,
  onModeChange,
  onOpenDemo,
  onOpenTypeInstead,
  historyCount,
}: HeaderProps) {
  const modes: { id: AppMode; label: string; icon: string; desc: string }[] = [
    { id: 'standard', label: 'Voice', icon: '🎙️', desc: 'Standard recognition' },
    { id: 'child', label: 'Child Mode', icon: '🧸', desc: 'Playful & simple' },
    { id: 'elderly', label: 'Easy Read', icon: '👓', desc: 'High visibility' },
    { id: 'conversation', label: 'Conversation', icon: '💬', desc: 'Multi-turn speech' },
    { id: 'history', label: `History (${historyCount})`, icon: '📜', desc: 'Saved speech' },
  ];

  return (
    <header className="w-full pt-6 pb-4 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Brand & Subtitle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-pink-100/80 pb-5">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => onModeChange('standard')}>
            <span className="text-3xl sm:text-4xl animate-bounce">🎙️</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-1.5 tracking-tight">
              VaaniCare <Heart className="w-6 h-6 fill-pink-500 text-pink-500 inline-block animate-pulse" />
            </h1>
          </div>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <span>Every voice deserves to be heard.</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold">
              Voice-to-Text Only
            </span>
          </p>
        </div>

        {/* Action utility buttons: Demo & Type Instead */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200/80 text-purple-700 text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Try Demo</span>
          </button>

          <button
            type="button"
            onClick={onOpenTypeInstead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>Type instead</span>
          </button>
        </div>
      </div>

      {/* Mode navigation bar */}
      <nav className="mt-4 flex items-center justify-center sm:justify-start overflow-x-auto no-scrollbar py-1 gap-1.5 sm:gap-2">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-200 scale-102'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
