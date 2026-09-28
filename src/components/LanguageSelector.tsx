import { Globe } from 'lucide-react';
import { LanguageCode, SUPPORTED_LANGUAGES } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-5">
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600">
        <Globe className="w-4 h-4 text-pink-600" />
        <span>Spoken Language:</span>
      </div>

      <div className="flex items-center flex-wrap justify-center gap-1.5 bg-white/80 p-1.5 rounded-2xl border border-pink-100 shadow-sm">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={disabled}
              onClick={() => onLanguageChange(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm scale-102 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-pink-50/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code !== 'auto' && (
                <span className={`text-[10px] font-normal ${isSelected ? 'text-pink-100' : 'text-slate-400'}`}>
                  ({lang.nativeLabel})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
