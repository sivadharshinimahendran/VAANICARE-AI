import { ShieldCheck, Lock, EyeOff } from 'lucide-react';

export function PrivacyBanner() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-5 rounded-3xl bg-white/70 backdrop-blur-sm border border-pink-100 shadow-sm text-slate-600">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h4 className="font-bold text-slate-800 text-sm">
          🔒 Privacy &amp; Microphone Safety
        </h4>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        VaaniCare only uses your microphone when you tap the microphone button. We never continuously listen, record in the background, or store your voice audio on external servers. Spoken words are transcribed for you and preserved in your local browser history only.
      </p>

      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-slate-400" />
          No background listening
        </span>
        <span className="flex items-center gap-1">
          <EyeOff className="w-3 h-3 text-slate-400" />
          No audio stored
        </span>
        <span className="flex items-center gap-1">
          <span>✨</span>
          Strictly Voice-to-Text (No translation)
        </span>
      </div>
    </div>
  );
}
