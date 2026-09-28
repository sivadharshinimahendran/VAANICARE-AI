import { useRef, useEffect } from 'react';
import { Trash2, MessageSquare, Mic, Square, Sparkles } from 'lucide-react';
import { RecognitionResult, RecorderState } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface ConversationViewProps {
  conversationList: RecognitionResult[];
  recorderState: RecorderState;
  audioLevel: number;
  interimText?: string;
  elapsedSeconds?: number;
  onToggleRecording: () => void;
  onClearConversation: () => void;
}

export function ConversationView({
  conversationList,
  recorderState,
  audioLevel,
  interimText,
  elapsedSeconds = 0,
  onToggleRecording,
  onClearConversation,
}: ConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const formattedTimer = `00:${String(Math.min(15, elapsedSeconds)).padStart(2, '0')}`;

  // Auto-scroll to latest recognized speech
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationList, interimText]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-white/90 backdrop-blur-md rounded-3xl border border-pink-100 shadow-xl overflow-hidden">
      {/* Top Header of Conversation */}
      <div className="px-6 py-4 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50/60 to-purple-50/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-500" />
          <h2 className="font-bold text-slate-800 text-base sm:text-lg">
            Speech Conversation Stream
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold">
            {conversationList.length} turns
          </span>
        </div>

        {conversationList.length > 0 && (
          <button
            type="button"
            onClick={onClearConversation}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {conversationList.length === 0 && !interimText ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <span className="text-4xl mb-3">💬</span>
            <p className="font-bold text-slate-600 text-base">
              No speech recorded yet in this conversation
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
              Tap the microphone below and speak. Each spoken phrase will appear here in sequence without translation.
            </p>
          </div>
        ) : (
          <>
            {conversationList.map((item, index) => (
              <div
                key={item.id || index}
                className="flex flex-col bg-white p-4 rounded-2xl border border-pink-100/80 shadow-sm animate-fade-in"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-bold text-purple-700">
                    Turn #{index + 1} • {item.detectedLanguage}
                  </span>
                  <span>{item.timestamp}</span>
                </div>

                <div className="text-slate-900 text-base sm:text-lg font-medium leading-relaxed">
                  "{item.text}"
                </div>
              </div>
            ))}

            {recorderState === 'recording' && interimText && (
              <div className="flex flex-col bg-pink-50/80 p-4 rounded-2xl border border-pink-200 animate-pulse">
                <span className="text-xs font-bold text-pink-600 mb-1">
                  Listening right now...
                </span>
                <div className="text-pink-950 text-base sm:text-lg italic font-medium">
                  "{interimText}"
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom Floating Microphone Bar */}
      <div className="p-4 bg-white/95 border-t border-pink-100 flex items-center justify-between gap-4">
        <div className="flex-1">
          {recorderState === 'recording' ? (
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-rose-600">
                    🎤 Listening...
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-700 font-mono text-[11px] font-bold">
                    {formattedTimer}
                  </span>
                </div>
                <div className="h-6">
                  <AudioVisualizer isRecording={true} audioLevel={audioLevel} mode="conversation" />
                </div>
              </div>
            </div>
          ) : recorderState === 'starting' ? (
            <span className="text-xs sm:text-sm font-semibold text-purple-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-spin" />
              Opening microphone...
            </span>
          ) : recorderState === 'processing' ? (
            <span className="text-xs sm:text-sm font-semibold text-purple-600 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              ✨ Recognizing speech...
            </span>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              Tap mic to speak the next turn
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleRecording}
          disabled={recorderState === 'starting' || recorderState === 'processing'}
          className={`px-5 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-md transition-all cursor-pointer ${
            recorderState === 'recording'
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
          }`}
        >
          {recorderState === 'recording' ? (
            <>
              <Square className="w-4 h-4 fill-white" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Speak</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
