import { X, Sparkles, ArrowRight } from 'lucide-react';
import { RecognitionResult, DemoSample } from '../types';
import { formatDate } from '../utils/audio';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (result: RecognitionResult) => void;
}

const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'demo-1',
    text: 'எனக்கு தண்ணி வேணும்',
    language: 'Tamil',
    confidence: 98,
    description: 'Tamil: "எனக்கு தண்ணி வேணும்" (spoken and displayed verbatim)',
  },
  {
    id: 'demo-2',
    text: 'I need some water',
    language: 'English (India)',
    confidence: 99,
    description: 'English: "I need some water" (spoken and displayed verbatim)',
  },
  {
    id: 'demo-3',
    text: 'എനിക്ക് വെള്ളം വേണം',
    language: 'Malayalam',
    confidence: 96,
    description: 'Malayalam: "എനിക്ക് വെള്ളം വേണം" (spoken and displayed verbatim)',
  },
  {
    id: 'demo-4',
    text: 'मुझे पानी चाहिए',
    language: 'Hindi',
    confidence: 97,
    description: 'Hindi: "मुझे पानी चाहिए" (spoken and displayed verbatim)',
  },
  {
    id: 'demo-5',
    text: 'Enakku thanni venum',
    language: 'Tamil / Tanglish',
    confidence: 95,
    description: 'Tanglish / Tamil: "Enakku thanni venum" (spoken verbatim without translation)',
  },
  {
    id: 'demo-6',
    text: 'Amma water kondu va',
    language: 'Tanglish / Tamil-English mixed',
    confidence: 94,
    description: 'Mixed Tamil-English: "Amma water kondu va" (mixed words kept intact)',
  },
];

export function DemoModal({ isOpen, onClose, onSelectSample }: DemoModalProps) {
  if (!isOpen) return null;

  const handlePick = (sample: DemoSample) => {
    const result: RecognitionResult = {
      id: `demo-${Date.now()}`,
      text: sample.text,
      detectedLanguage: sample.language,
      confidence: sample.confidence,
      confidenceLevel: sample.confidence >= 80 ? 'high' : sample.confidence >= 60 ? 'medium' : 'low',
      isUnclear: Boolean(sample.isUnclear),
      unclearNote: sample.isUnclear ? 'Some words were unclear.' : undefined,
      timestamp: formatDate(),
      mode: 'standard',
    };
    onSelectSample(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-pink-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-extrabold text-xl text-slate-800">
                Presentation Demo Mode
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Test speech recognition cards instantly without recording
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

        {/* Notice */}
        <div className="p-3 bg-pink-50/80 rounded-2xl border border-pink-100 mb-4 text-xs text-pink-900 font-medium">
          💡 Notice how VaaniCare displays the <strong>exact words spoken</strong> with detected language and confidence, without translating or interpreting!
        </div>

        {/* List of samples */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {DEMO_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handlePick(sample)}
              className="w-full text-left p-4 rounded-2xl border border-slate-200/80 hover:border-pink-300 hover:bg-pink-50/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-base group-hover:text-pink-600 transition-colors">
                    &ldquo;{sample.text}&rdquo;
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {sample.language}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {sample.description}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-600">
                  {sample.confidence}%
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
