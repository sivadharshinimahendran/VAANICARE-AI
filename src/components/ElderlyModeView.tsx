import { VoiceRecorderButton } from './VoiceRecorderButton';
import { ResultCard } from './ResultCard';
import { RecorderState, RecognitionResult } from '../types';
import { ArrowDown } from 'lucide-react';

interface ElderlyModeViewProps {
  recorderState: RecorderState;
  audioLevel: number;
  interimText?: string;
  elapsedSeconds?: number;
  lastResult: RecognitionResult | null;
  onToggleRecording: () => void;
  onReset: () => void;
  isSpeaking?: boolean;
}

export function ElderlyModeView({
  recorderState,
  audioLevel,
  interimText,
  elapsedSeconds = 0,
  lastResult,
  onToggleRecording,
  onReset,
  isSpeaking = false,
}: ElderlyModeViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center font-easyread">
      {/* High-visibility guidance banner */}
      <div className="w-full bg-indigo-50 border-4 border-indigo-300 rounded-3xl p-6 mb-6 text-center shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 uppercase tracking-wide">
          EASY READ MODE
        </h2>
        <p className="text-lg sm:text-xl font-bold text-indigo-900 mt-2">
          Step 1: Tap the big button below.
          <br />
          Step 2: Speak clearly in any language.
        </p>
      </div>

      {/* Extra Large Button Card */}
      <div className="w-full bg-white rounded-3xl p-8 sm:p-10 border-4 border-slate-300 shadow-2xl flex flex-col items-center">
        <VoiceRecorderButton
          state={recorderState}
          audioLevel={audioLevel}
          interimText={interimText}
          elapsedSeconds={elapsedSeconds}
          mode="elderly"
          size="extra-large"
          onToggle={onToggleRecording}
          isSpeaking={isSpeaking}
        />

        <div className="mt-6 text-center">
          <p className="text-base sm:text-lg font-bold text-slate-700">
            {recorderState === 'recording'
              ? '🔴 SPEAK NOW — TAP WHEN FINISHED'
              : recorderState === 'starting'
              ? '✨ OPENING MICROPHONE...'
              : recorderState === 'processing'
              ? '✨ RECOGNIZING YOUR VOICE...'
              : '👇 TAP TO SPEAK'}
          </p>
        </div>
      </div>

      {/* Down arrow indicator if result exists */}
      {lastResult && (
        <div className="my-6 flex flex-col items-center text-indigo-600 animate-bounce">
          <ArrowDown className="w-10 h-10 stroke-[3]" />
          <span className="text-lg font-extrabold uppercase tracking-wide">
            Your Spoken Words Below
          </span>
        </div>
      )}

      {/* Result Display */}
      {lastResult && (
        <div className="w-full mt-4 animate-fade-in">
          <ResultCard
            result={lastResult}
            mode="elderly"
            onReset={onReset}
            isSpeaking={isSpeaking}
          />
        </div>
      )}
    </div>
  );
}
