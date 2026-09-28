import { Star } from 'lucide-react';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { ResultCard } from './ResultCard';
import { RecorderState, RecognitionResult } from '../types';

interface ChildModeViewProps {
  recorderState: RecorderState;
  audioLevel: number;
  interimText?: string;
  elapsedSeconds?: number;
  lastResult: RecognitionResult | null;
  onToggleRecording: () => void;
  onReset: () => void;
  isSpeaking?: boolean;
}

export function ChildModeView({
  recorderState,
  audioLevel,
  interimText,
  elapsedSeconds = 0,
  lastResult,
  onToggleRecording,
  onReset,
  isSpeaking = false,
}: ChildModeViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center font-child">
      {/* Playful greeting banner */}
      <div className="w-full bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 rounded-3xl p-5 mb-6 text-center border-2 border-pink-200/80 shadow-md">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Star className="w-6 h-6 text-amber-400 fill-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pink-600">
            Hello Little Star! 🌟
          </h2>
          <Star className="w-6 h-6 text-amber-400 fill-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <p className="text-purple-700 text-base sm:text-lg font-medium">
          Press the big pink button and say anything you want!
        </p>
      </div>

      {/* Main Microphone Action Card */}
      <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 border-2 border-pink-100 shadow-xl flex flex-col items-center">
        <VoiceRecorderButton
          state={recorderState}
          audioLevel={audioLevel}
          interimText={interimText}
          elapsedSeconds={elapsedSeconds}
          mode="child"
          size="large"
          onToggle={onToggleRecording}
          isSpeaking={isSpeaking}
        />

        {/* Fun child tips */}
        {recorderState === 'idle' && !lastResult && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700">
              🧸 You can say your favorite toy!
            </span>
            <span className="px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
              🥛 Say what you want to eat or drink!
            </span>
          </div>
        )}
      </div>

      {/* Child Result Card */}
      {lastResult && (
        <div className="w-full mt-6 animate-fade-in">
          <ResultCard
            result={lastResult}
            mode="child"
            onReset={onReset}
            isSpeaking={isSpeaking}
          />
        </div>
      )}
    </div>
  );
}
