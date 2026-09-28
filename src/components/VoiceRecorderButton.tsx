import { Mic, Square, Sparkles, Volume2 } from 'lucide-react';
import { RecorderState, AppMode } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface VoiceRecorderButtonProps {
  state: RecorderState;
  audioLevel: number;
  mode: AppMode;
  interimText?: string;
  elapsedSeconds?: number;
  onToggle: () => void;
  size?: 'normal' | 'large' | 'extra-large';
  isSpeaking?: boolean;
}

export function VoiceRecorderButton({
  state,
  audioLevel,
  mode,
  interimText,
  elapsedSeconds = 0,
  onToggle,
  size = 'normal',
  isSpeaking = false,
}: VoiceRecorderButtonProps) {
  const isIdle = state === 'idle';
  const isStarting = state === 'starting';
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  // Format seconds to mm:ss format e.g. 00:01, 00:02
  const formattedTimer = `00:${String(Math.min(15, elapsedSeconds)).padStart(2, '0')}`;

  // Size styling
  let buttonSize = 'w-32 h-32 md:w-36 md:h-36';
  let iconSize = 'w-12 h-12 md:w-14 md:h-14';

  if (size === 'large' || mode === 'child') {
    buttonSize = 'w-36 h-36 md:w-44 md:h-44';
    iconSize = 'w-14 h-14 md:w-16 md:h-16';
  } else if (size === 'extra-large' || mode === 'elderly') {
    buttonSize = 'w-44 h-44 md:w-52 md:h-52';
    iconSize = 'w-16 h-16 md:w-20 md:h-20';
  }

  // Color schemes based on mode and state
  let buttonStyle = 'bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-400 text-white shadow-xl shadow-pink-200/60 hover:shadow-pink-300 hover:scale-105';

  if (isRecording) {
    buttonStyle = 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-2xl shadow-rose-300 ring-8 ring-rose-200 animate-pulse';
  } else if (isStarting || isProcessing) {
    buttonStyle = 'bg-gradient-to-tr from-purple-400 to-indigo-400 text-white shadow-lg cursor-not-allowed opacity-90';
  } else if (mode === 'child') {
    buttonStyle = 'bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-300 text-white shadow-xl shadow-pink-200 hover:scale-105 active:scale-95';
  } else if (mode === 'elderly') {
    buttonStyle = 'bg-gradient-to-tr from-indigo-700 to-blue-600 text-white shadow-2xl hover:scale-105 active:scale-95 ring-4 ring-indigo-200';
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Status Heading */}
      <div className="mb-4 min-h-[4.5rem] flex flex-col items-center justify-center">
        {isIdle && !isSpeaking && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <span className="text-2xl">🎙️</span> Speak to VaaniCare
            </h2>
            <p className="text-slate-500 text-sm md:text-base mt-1 font-medium">
              Tap the microphone to start.
            </p>
          </div>
        )}

        {isIdle && isSpeaking && (
          <div className="animate-pulse">
            <h2 className="text-xl md:text-2xl font-bold text-pink-600 flex items-center justify-center gap-2">
              <Volume2 className="w-6 h-6 text-pink-500 animate-bounce" />
              🔊 Speaking your words...
            </h2>
            <p className="text-pink-500 text-sm md:text-base mt-1 font-semibold">
              Playing recognized speech aloud
            </p>
          </div>
        )}

        {isStarting && (
          <div className="animate-pulse">
            <h2 className="text-xl md:text-2xl font-bold text-purple-600 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500 animate-spin" />
              Opening microphone...
            </h2>
            <p className="text-purple-500 text-sm md:text-base mt-1 font-medium">
              Preparing recognition session...
            </p>
          </div>
        )}

        {isRecording && (
          <div className="animate-fade-in flex flex-col items-center">
            <h2 className="text-xl md:text-2xl font-bold text-rose-600 flex items-center justify-center gap-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping mr-1" />
              🎤 Listening...
            </h2>
            {/* Visible Session Timer requested by user: 00:01, 00:02, ... */}
            <div className="mt-1 flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono font-bold text-sm tracking-wider shadow-sm border border-rose-200">
                {formattedTimer}
              </span>
              <span className="text-xs text-rose-500 font-medium">
                (up to 15s)
              </span>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="animate-pulse">
            <h2 className="text-xl md:text-2xl font-bold text-purple-700 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500 animate-spin" />
              ✨ Recognizing speech...
            </h2>
            <p className="text-purple-600 text-sm md:text-base mt-1 font-medium">
              Transcribing your exact words...
            </p>
          </div>
        )}
      </div>

      {/* Main Microphone Button */}
      <div className="relative my-2">
        {/* Pulsing rings when recording */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-rose-400 opacity-30 animate-ping" />
            <div className="absolute -inset-3 rounded-full bg-rose-300 opacity-20 animate-pulse" />
          </>
        )}

        <button
          type="button"
          onClick={onToggle}
          disabled={isStarting || isProcessing}
          aria-label={
            isRecording
              ? 'Stop listening'
              : isStarting
              ? 'Starting microphone'
              : isProcessing
              ? 'Processing speech'
              : 'Start listening'
          }
          className={`relative rounded-full flex flex-col items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-pink-300 cursor-pointer ${buttonSize} ${buttonStyle}`}
        >
          {isIdle && (
            <>
              <Mic className={`${iconSize} drop-shadow-sm`} />
              <span className="text-xs md:text-sm font-bold mt-1 tracking-wide uppercase">
                {mode === 'elderly' ? 'TAP TO SPEAK' : 'Tap to Speak'}
              </span>
            </>
          )}

          {isStarting && (
            <div className="flex flex-col items-center">
              <Sparkles className={`${iconSize} animate-spin`} />
              <span className="text-xs font-semibold mt-1">Starting...</span>
            </div>
          )}

          {isRecording && (
            <>
              <Square className={`${iconSize} fill-white drop-shadow-md`} />
              <span className="text-xs md:text-sm font-bold mt-1 tracking-wide uppercase">
                {mode === 'elderly' ? 'TAP TO STOP' : 'Stop'}
              </span>
            </>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center">
              <Sparkles className={`${iconSize} animate-bounce`} />
              <span className="text-xs font-semibold mt-1">Recognizing...</span>
            </div>
          )}
        </button>
      </div>

      {/* Live Interim Transcript Display during recording */}
      {isRecording && interimText && (
        <div className="mt-3 max-w-md px-4 py-2 bg-pink-50 border border-pink-200 rounded-2xl text-pink-900 font-medium text-sm animate-fade-in">
          <span className="text-xs text-pink-500 font-bold block mb-0.5">Hearing:</span>
          "{interimText}"
        </div>
      )}

      {/* Audio Wave Visualizer during active recording */}
      <div className="mt-4 min-h-[64px] flex items-center justify-center">
        {isRecording ? (
          <AudioVisualizer isRecording={isRecording} audioLevel={audioLevel} mode={mode} />
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-1.5 py-1 px-3 bg-white/60 rounded-full border border-slate-100">
            <span>🔒</span>
            <span>Microphone active only when tapped</span>
          </div>
        )}
      </div>
    </div>
  );
}
