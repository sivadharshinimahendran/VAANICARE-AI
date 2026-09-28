import { useState } from 'react';
import { Trash2, Copy, Check, Search, Calendar, Globe, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import { RecognitionResult } from '../types';
import { speakRecognizedText } from '../utils/audio';

interface HistoryViewProps {
  history: RecognitionResult[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export function HistoryView({ history, onClearHistory, onDeleteItem }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // copy failed
    }
  };

  const handleSpeak = (id: string, text: string, languageCode?: string) => {
    setSpeakingId(id);
    speakRecognizedText(
      text,
      languageCode || 'ta-IN',
      () => setSpeakingId(id),
      () => setSpeakingId(null)
    );
  };

  const filteredHistory = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.text.toLowerCase().includes(term) ||
      item.detectedLanguage.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col">
      {/* Top Bar with Search & Clear */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-md mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recognized words or languages..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-800"
          />
        </div>

        {/* Clear History Button */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-pink-100 shadow-sm">
          <span className="text-4xl block mb-3">📜</span>
          <h3 className="text-lg font-bold text-slate-700">
            {searchTerm ? 'No matching speech found' : 'No speech history recorded yet'}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchTerm
              ? 'Try searching with another word or language.'
              : 'Words recognized via microphone will automatically be saved here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white/95 rounded-3xl p-6 border border-pink-100 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎧</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Mode: {item.mode}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSpeak(item.id, item.text, item.languageCode)}
                    aria-label="Listen to recognized speech"
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      speakingId === item.id
                        ? 'text-pink-600 bg-pink-100 animate-pulse'
                        : 'text-slate-500 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                    title="Listen with sweet voice"
                  >
                    <Volume2 className={`w-4 h-4 ${speakingId === item.id ? 'animate-bounce text-pink-600' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.text)}
                    aria-label="Copy recognized words"
                    className="p-2 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                    title="Copy text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label="Delete history item"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Spoken words */}
              <div className="my-3">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              {item.isUnclear && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>⚠️ Some words were unclear in this recording</span>
                </div>
              )}

              {/* Bottom metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                    {item.detectedLanguage}
                  </span>
                  <span className="text-slate-500 font-medium">
                    Confidence: {item.confidence}%
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
