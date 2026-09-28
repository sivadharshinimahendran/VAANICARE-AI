import { useState, FormEvent } from 'react';
import { X, Send, Edit3 } from 'lucide-react';
import { RecognitionResult } from '../types';
import { formatDate } from '../utils/audio';

interface TypeInsteadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTypedText: (result: RecognitionResult) => void;
}

export function TypeInsteadModal({
  isOpen,
  onClose,
  onSubmitTypedText,
}: TypeInsteadModalProps) {
  const [typedText, setTypedText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Spoken Speech / Tanglish');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!typedText.trim()) return;

    const result: RecognitionResult = {
      id: `typed-${Date.now()}`,
      text: typedText.trim(),
      detectedLanguage: selectedLanguage,
      confidence: 100,
      confidenceLevel: 'high',
      isUnclear: false,
      timestamp: formatDate(),
      mode: 'standard',
    };

    onSubmitTypedText(result);
    setTypedText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-pink-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-pink-500" />
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">
                Type Instead of Speaking
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Enter words manually if your microphone is unavailable
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Enter words (any language, dialect, or Tanglish)
            </label>
            <textarea
              rows={3}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="e.g. Enakku thanni venum or Amma water kondu va..."
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Language / Dialect tag
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-300 cursor-pointer"
            >
              <option value="Tamil / Tanglish">Tamil / Tanglish</option>
              <option value="Tanglish / Tamil-English mixed">Tanglish / Tamil-English mixed</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Telugu">Telugu</option>
              <option value="Kannada">Kannada</option>
              <option value="Typed Speech">Other / Custom</option>
            </select>
          </div>

          <p className="text-[11px] text-slate-400">
            *VaaniCare will display your text exactly as entered without any translation or alterations.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!typedText.trim()}
              className="px-5 py-2.5 rounded-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-pink-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Display Speech</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
