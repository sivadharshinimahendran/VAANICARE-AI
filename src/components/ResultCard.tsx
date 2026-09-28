import { useState } from 'react';
import { Copy, Check, AlertCircle, RefreshCw, Volume2, Globe } from 'lucide-react';
import { RecognitionResult, AppMode } from '../types';
import { speakRecognizedText } from '../utils/audio';

interface ResultCardProps {
  result: RecognitionResult;
  mode: AppMode;
  onReset?: () => void;
  isSpeaking?: boolean;
}

export function ResultCard({ result, mode, onReset, isSpeaking = false }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePlayVoice = () => {
    const lang = result.languageCode || 'ta-IN';
    setLocalSpeaking(true);
    speakRecognizedText(
      result.text,
      lang,
      () => setLocalSpeaking(true),
      () => setLocalSpeaking(false)
    );
  };

  // Determine confidence badge color & text
  const getConfidenceInfo = (score: number, level: string) => {
    if (level === 'high' || score >= 80) {
      return {
        label: 'High confidence',
        dotColor: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: '🟢',
      };
    }
    if (level === 'medium' || score >= 60) {
      return {
        label: 'Medium confidence',
        dotColor: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: '🟡',
      };
    }
    return {
      label: 'Low confidence',
      dotColor: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: '🔴',
    };
  };

  const confidenceInfo = getConfidenceInfo(result.confidence, result.confidenceLevel);

  const isElderly = mode === 'elderly';
  const isChild = mode === 'child';

  return (
    <div
      className={`w-full max-w-xl mx-auto rounded-3xl transition-all duration-300 ${
        isElderly
          ? 'p-8 bg-white border-4 border-indigo-200 shadow-2xl text-left'
          : isChild
          ? 'p-7 bg-white/95 border-2 border-pink-200 shadow-xl'
          : 'p-6 md:p-8 bg-white/90 backdrop-blur-md border border-pink-100 shadow-xl'
      }`}
    >
      {/* Card Header: "🎧 You Said" */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl md:text-3xl">🎧</span>
          <div>
            <h3
              className={`font-bold tracking-tight text-slate-800 ${
                isElderly ? 'text-2xl md:text-3xl uppercase text-indigo-950' : isChild ? 'text-2xl font-child text-pink-600' : 'text-xl md:text-2xl'
              }`}
            >
              You Said
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Exact voice transcription (no translation)
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy transcription"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-pink-50 border border-slate-200 text-xs md:text-sm font-semibold text-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Main Recognized Speech Text */}
      <div className="my-5 py-4 px-5 rounded-2xl bg-gradient-to-br from-slate-50 to-pink-50/40 border border-slate-100">
        <p
          className={`leading-relaxed break-words font-medium text-slate-900 ${
            isElderly
              ? 'text-3xl md:text-4xl font-extrabold text-slate-950 py-2'
              : isChild
              ? 'text-2xl md:text-3xl font-child text-purple-900'
              : 'text-2xl md:text-3xl'
          }`}
        >
          &ldquo;{result.text}&rdquo;
        </p>
      </div>

      {/* Unclear Warning Notice (if applicable) */}
      {result.isUnclear && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            ⚠️ {result.unclearNote || 'Some words were unclear.'} (VaaniCare never invents words)
          </span>
        </div>
      )}

      {/* Metadata Badges: Language & Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs md:text-sm">
        {/* Detected Language */}
        <div className="flex items-center gap-2 text-slate-600">
          <Globe className="w-4 h-4 text-pink-500" />
          <span className="font-semibold text-slate-500">Detected Language:</span>
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
            {result.detectedLanguage}
          </span>
        </div>

        {/* Confidence Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Confidence:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${confidenceInfo.badgeBg}`}
          >
            <span>{confidenceInfo.icon}</span>
            <span>{result.confidence}%</span>
            <span className="text-[11px] opacity-75 hidden sm:inline">({confidenceInfo.label})</span>
          </span>
        </div>
      </div>

      {/* Confidence explanation footnote */}
      <p className="mt-3 text-[11px] text-slate-400 text-center">
        *Confidence is an automated estimate from the transcription system.
      </p>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handlePlayVoice}
          aria-label="Play spoken text"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm border transition-all cursor-pointer ${
            isSpeaking || localSpeaking
              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
              : 'bg-white hover:bg-pink-50 border-pink-200 text-pink-700 shadow-sm'
          }`}
        >
          <Volume2 className={`w-4 h-4 ${isSpeaking || localSpeaking ? 'text-rose-600 animate-bounce' : 'text-pink-600'}`} />
          <span>{isSpeaking || localSpeaking ? 'Speaking...' : 'Listen Again'}</span>
        </button>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm shadow-md shadow-pink-200 transition-all cursor-pointer hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Speak Again</span>
          </button>
        )}
      </div>
    </div>
  );
}
