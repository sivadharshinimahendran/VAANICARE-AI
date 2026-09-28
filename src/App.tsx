/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, X, Shield } from 'lucide-react';
import { AppMode, RecognitionResult, LanguageCode } from './types';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { speakRecognizedText } from './utils/audio';
import { Header } from './components/Header';
import { VoiceRecorderButton } from './components/VoiceRecorderButton';
import { ResultCard } from './components/ResultCard';
import { LanguageSelector } from './components/LanguageSelector';
import { ChildModeView } from './components/ChildModeView';
import { ElderlyModeView } from './components/ElderlyModeView';
import { ConversationView } from './components/ConversationView';
import { HistoryView } from './components/HistoryView';
import { DemoModal } from './components/DemoModal';
import { TypeInsteadModal } from './components/TypeInsteadModal';
import { PrivacyBanner } from './components/PrivacyBanner';

const LOCAL_STORAGE_KEY = 'vaanicare_speech_history';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('standard');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('auto');
  const [history, setHistory] = useState<RecognitionResult[]>([]);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [conversationList, setConversationList] = useState<RecognitionResult[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Modals
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isTypeInsteadOpen, setIsTypeInsteadOpen] = useState(false);

  // Cancel any active SpeechSynthesis on unmount or mode change
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [currentMode]);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
  }, []);

  // Save history to localStorage
  const saveResultToHistory = useCallback((result: RecognitionResult) => {
    setHistory((prev) => {
      const updated = [result, ...prev.slice(0, 49)];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist history', e);
      }
      return updated;
    });
  }, []);

  // Handler for successful recognition: displays text immediately and speaks it aloud verbatim
  const handleSuccess = useCallback(
    (result: RecognitionResult) => {
      setLastResult(result);
      saveResultToHistory(result);

      if (currentMode === 'conversation') {
        setConversationList((prev) => [...prev, result]);
      }

      // Immediately speak the recognized text using browser SpeechSynthesis with the matching language
      const targetLang = result.languageCode || selectedLanguage || 'ta-IN';
      setIsSpeaking(true);
      speakRecognizedText(
        result.text,
        targetLang,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    },
    [currentMode, saveResultToHistory, selectedLanguage]
  );

  // Audio recorder hook with selected language and single-instance management
  const {
    recorderState,
    errorMessage,
    audioLevel,
    interimText,
    elapsedSeconds,
    toggleRecording,
    clearError,
  } = useAudioRecorder({
    mode: currentMode,
    selectedLanguage,
    onSuccess: handleSuccess,
  });

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your speech history?')) {
      setHistory([]);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const handleClearConversation = () => {
    setConversationList([]);
  };

  const handleResetCurrentResult = () => {
    setLastResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-pink-200">
      {/* Top Header */}
      <Header
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode);
          clearError();
        }}
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenTypeInstead={() => setIsTypeInsteadOpen(true)}
        historyCount={history.length}
      />

      {/* Main Body Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col justify-center">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="w-full max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  {errorMessage.includes('permission')
                    ? '🎤 Microphone permission required'
                    : errorMessage.includes('unavailable') || errorMessage.includes('could not be accessed')
                    ? '🎤 Microphone unavailable'
                    : errorMessage.includes('No speech')
                    ? '🔈 No speech detected'
                    : 'Notice'}
                </h4>
                <p className="text-xs sm:text-sm mt-0.5 text-rose-700">
                  {errorMessage}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearError}
              className="p-1 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Switcher based on current mode */}
        {currentMode === 'standard' && (
          <div className="w-full flex flex-col items-center">
            {/* Top info card */}
            <div className="text-center max-w-md mx-auto mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/80 text-pink-700 text-xs font-bold mb-2">
                <span>🎯</span> Voice Recognition (No Translation)
              </div>
              <p className="text-slate-500 text-xs sm:text-sm">
                Speak naturally in Tamil, English, Tanglish, Malayalam, Hindi, Telugu, or Kannada. VaaniCare displays exactly what you say.
              </p>
            </div>

            {/* Language Selector */}
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={(lang) => {
                setSelectedLanguage(lang);
                clearError();
              }}
              disabled={recorderState === 'recording' || recorderState === 'starting' || recorderState === 'processing'}
            />

            {/* Recorder Card */}
            <div className="w-full max-w-xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-pink-100 shadow-xl flex flex-col items-center">
              <VoiceRecorderButton
                state={recorderState}
                audioLevel={audioLevel}
                interimText={interimText}
                elapsedSeconds={elapsedSeconds}
                mode="standard"
                onToggle={toggleRecording}
                isSpeaking={isSpeaking}
              />
            </div>

            {/* Result Card */}
            {lastResult && (
              <div className="w-full mt-8 animate-fade-in">
                <ResultCard
                  result={lastResult}
                  mode="standard"
                  onReset={handleResetCurrentResult}
                  isSpeaking={isSpeaking}
                />
              </div>
            )}
          </div>
        )}

        {currentMode === 'child' && (
          <div className="w-full flex flex-col items-center">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={(lang) => {
                setSelectedLanguage(lang);
                clearError();
              }}
              disabled={recorderState === 'recording' || recorderState === 'starting' || recorderState === 'processing'}
            />
            <ChildModeView
              recorderState={recorderState}
              audioLevel={audioLevel}
              interimText={interimText}
              elapsedSeconds={elapsedSeconds}
              lastResult={lastResult}
              onToggleRecording={toggleRecording}
              onReset={handleResetCurrentResult}
              isSpeaking={isSpeaking}
            />
          </div>
        )}

        {currentMode === 'elderly' && (
          <div className="w-full flex flex-col items-center">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={(lang) => {
                setSelectedLanguage(lang);
                clearError();
              }}
              disabled={recorderState === 'recording' || recorderState === 'starting' || recorderState === 'processing'}
            />
            <ElderlyModeView
              recorderState={recorderState}
              audioLevel={audioLevel}
              interimText={interimText}
              elapsedSeconds={elapsedSeconds}
              lastResult={lastResult}
              onToggleRecording={toggleRecording}
              onReset={handleResetCurrentResult}
              isSpeaking={isSpeaking}
            />
          </div>
        )}

        {currentMode === 'conversation' && (
          <div className="w-full flex flex-col items-center">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={(lang) => {
                setSelectedLanguage(lang);
                clearError();
              }}
              disabled={recorderState === 'recording' || recorderState === 'starting' || recorderState === 'processing'}
            />
            <ConversationView
              conversationList={conversationList}
              recorderState={recorderState}
              audioLevel={audioLevel}
              interimText={interimText}
              elapsedSeconds={elapsedSeconds}
              onToggleRecording={toggleRecording}
              onClearConversation={handleClearConversation}
            />
          </div>
        )}

        {currentMode === 'history' && (
          <HistoryView
            history={history}
            onClearHistory={handleClearHistory}
            onDeleteItem={handleDeleteHistoryItem}
          />
        )}
      </main>

      {/* Footer with safety note */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-pink-50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-500">
            <Shield className="w-3.5 h-3.5 text-pink-500" />
            <span>VaaniCare Speech Platform • No audio stored permanently</span>
          </div>
          <div>Exact Speech Transcription for Children & Elderly • Pure Voice-to-Text</div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onSelectSample={(result: RecognitionResult) => {
          handleSuccess(result);
          setIsDemoOpen(false);
        }}
      />

      {/* Type Instead Modal */}
      <TypeInsteadModal
        isOpen={isTypeInsteadOpen}
        onClose={() => setIsTypeInsteadOpen(false)}
        onSubmitTypedText={(result: RecognitionResult) => {
          handleSuccess(result);
          setIsTypeInsteadOpen(false);
        }}
      />

      {/* Privacy Notice Banner */}
      <PrivacyBanner />
    </div>
  );
}
