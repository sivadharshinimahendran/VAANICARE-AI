export type AppMode = 'standard' | 'child' | 'elderly' | 'conversation' | 'history';

export type RecorderState = 'idle' | 'starting' | 'recording' | 'processing';

export type LanguageCode =
  | 'auto'
  | 'ta-IN'
  | 'en-IN'
  | 'ml-IN'
  | 'hi-IN'
  | 'te-IN'
  | 'kn-IN';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Auto Detect', nativeLabel: 'Tamil / Tanglish / English', flag: '🌐' },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
  { code: 'en-IN', label: 'English (India)', nativeLabel: 'English', flag: '🇮🇳' },
  { code: 'ml-IN', label: 'Malayalam', nativeLabel: 'മലയാളം', flag: '🇮🇳' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export interface RecognitionResult {
  id: string;
  text: string;
  detectedLanguage: string;
  languageCode?: LanguageCode;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  isUnclear: boolean;
  unclearNote?: string;
  timestamp: string;
  mode: AppMode;
}

export interface DemoSample {
  id: string;
  text: string;
  language: string;
  confidence: number;
  description: string;
  isUnclear?: boolean;
}

