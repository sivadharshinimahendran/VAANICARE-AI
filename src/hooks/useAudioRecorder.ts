import { useState, useRef, useCallback, useEffect } from 'react';
import { RecorderState, RecognitionResult, AppMode, LanguageCode } from '../types';
import { formatDate } from '../utils/audio';

// Extend window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface UseAudioRecorderOptions {
  mode: AppMode;
  selectedLanguage: LanguageCode;
  onSuccess?: (result: RecognitionResult) => void;
  onError?: (errorMessage: string) => void;
}

const MAX_SESSION_DURATION_SEC = 15; // 15 seconds maximum listening window
const SILENCE_TIMEOUT_MS = 3500; // 3.5 seconds silence after speech before automatically finalizing

export function useAudioRecorder({
  mode,
  selectedLanguage,
  onSuccess,
  onError,
}: UseAudioRecorderOptions) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [interimText, setInterimText] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Persistent single-instance refs
  const recognitionRef = useRef<any>(null);
  const isUserListeningRef = useRef<boolean>(false);
  const isOperationInProgressRef = useRef<boolean>(false);
  const currentLanguageRef = useRef<LanguageCode>(selectedLanguage);

  // Recognition accumulators
  const finalCollectedTranscriptRef = useRef<string>('');
  const hasReceivedAnySpeechRef = useRef<boolean>(false);
  const sessionStartTimeRef = useRef<number>(0);

  // Timer and watchdog refs
  const timerIntervalRef = useRef<number | null>(null);
  const maxSessionTimeoutRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);

  // Audio level animation during speech
  const animationFrameRef = useRef<number | null>(null);
  const simulatedAudioLevelRef = useRef<number>(0);

  // Synchronize language ref with selectedLanguage prop
  useEffect(() => {
    currentLanguageRef.current = selectedLanguage;
    if (recognitionRef.current && selectedLanguage !== 'auto') {
      try {
        recognitionRef.current.lang = selectedLanguage;
      } catch (e) {
        console.warn('Could not update recognition.lang dynamically:', e);
      }
    }
  }, [selectedLanguage]);

  // Visual pulse generator when user is speaking
  const startVisualPulse = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    const animate = () => {
      const time = Date.now() / 200;
      const base = 0.3 + 0.3 * Math.sin(time);
      const randomJitter = (Math.random() - 0.5) * 0.2;
      const level = Math.max(0.1, Math.min(1.0, base + randomJitter));
      simulatedAudioLevelRef.current = level;
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const stopVisualPulse = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Clear timers safely
  const clearSessionTimers = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (maxSessionTimeoutRef.current !== null) {
      clearTimeout(maxSessionTimeoutRef.current);
      maxSessionTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current !== null) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  // Comprehensive audio and recognition cleanup
  const cleanupAudioResources = useCallback(() => {
    // 1. Clear timers
    clearSessionTimers();

    // 2. Cancel speech synthesis to prevent audio engine lockup
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    // 3. Stop visualizer animation
    stopVisualPulse();

    // 4. Stop and destroy Web Speech recognition instance cleanly
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (err) {
        console.warn('Error aborting recognition:', err);
      }
      recognitionRef.current = null;
    }

    isUserListeningRef.current = false;
    isOperationInProgressRef.current = false;
    setInterimText('');
    setElapsedSeconds(0);
  }, [clearSessionTimers, stopVisualPulse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, [cleanupAudioResources]);

  // Finalize recognition and emit results
  const finalizeResult = useCallback(
    (langCode: string) => {
      clearSessionTimers();
      const wasActive = isUserListeningRef.current;
      cleanupAudioResources();
      setRecorderState('idle');

      const cleanResult = finalCollectedTranscriptRef.current.trim();

      if (cleanResult) {
        // Identify language label
        let detectedLangLabel = 'Tamil / Tanglish';
        if (langCode === 'en-IN') detectedLangLabel = 'English (India)';
        else if (langCode === 'ml-IN') detectedLangLabel = 'Malayalam';
        else if (langCode === 'hi-IN') detectedLangLabel = 'Hindi';
        else if (langCode === 'te-IN') detectedLangLabel = 'Telugu';
        else if (langCode === 'kn-IN') detectedLangLabel = 'Kannada';
        else if (langCode === 'ta-IN') detectedLangLabel = 'Tamil';

        const resultPayload: RecognitionResult = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          text: cleanResult,
          detectedLanguage: detectedLangLabel,
          languageCode: currentLanguageRef.current,
          confidence: 96,
          confidenceLevel: 'high',
          isUnclear: false,
          timestamp: formatDate(),
          mode,
        };

        onSuccess?.(resultPayload);
      } else if (wasActive && !hasReceivedAnySpeechRef.current) {
        const noSpeechNotice = 'No speech detected. Please speak clearly and try again.';
        setErrorMessage(noSpeechNotice);
        onError?.(noSpeechNotice);
      }
    },
    [cleanupAudioResources, clearSessionTimers, mode, onError, onSuccess]
  );

  // Stop listening gracefully
  const stopRecording = useCallback(() => {
    if (recorderState !== 'recording') return;

    setRecorderState('processing');
    isUserListeningRef.current = false;
    clearSessionTimers();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error calling recognition.stop():', e);
        finalizeResult(currentLanguageRef.current);
      }
    } else {
      finalizeResult(currentLanguageRef.current);
    }
  }, [clearSessionTimers, finalizeResult, recorderState]);

  // Start listening function
  const startRecording = useCallback(async () => {
    // Prevent multiple concurrent sessions or clicks while starting/processing
    if (isOperationInProgressRef.current || recorderState !== 'idle') {
      return;
    }

    setErrorMessage(null);
    setInterimText('');
    setElapsedSeconds(0);
    finalCollectedTranscriptRef.current = '';
    hasReceivedAnySpeechRef.current = false;
    isOperationInProgressRef.current = true;
    setRecorderState('starting');

    // Step 1: Cancel any active speech synthesis before touching microphone
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    // Step 2: Stop any prior recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Step 3: Check SpeechRecognition availability
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      const unsupportedMsg =
        'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
      setErrorMessage(unsupportedMsg);
      onError?.(unsupportedMsg);
      setRecorderState('idle');
      isOperationInProgressRef.current = false;
      return;
    }

    // Step 4: Microphone Permission test via getUserMedia (then immediately release tracks)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (permError: any) {
      console.error('Microphone permission error:', permError);
      const permMsg =
        'Microphone permission is required. Please allow microphone access in Chrome and try again.';
      setErrorMessage(permMsg);
      onError?.(permMsg);
      setRecorderState('idle');
      isOperationInProgressRef.current = false;
      return;
    }

    // Step 5: Initialize ONE clean SpeechRecognition instance
    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Determine correct language code
      let langCode = currentLanguageRef.current;
      if (langCode === 'auto') {
        langCode = 'ta-IN'; // Default Indian multilingual recognition engine
      }

      recognition.lang = langCode;
      // continuous = true allows the user to speak comfortably for up to 15 seconds without premature cutoff
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Event: onstart
      recognition.onstart = () => {
        isUserListeningRef.current = true;
        isOperationInProgressRef.current = false;
        setRecorderState('recording');
        startVisualPulse();

        // Start visible seconds elapsed timer (00:00 -> 00:01 -> ...)
        sessionStartTimeRef.current = Date.now();
        setElapsedSeconds(0);

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        timerIntervalRef.current = window.setInterval(() => {
          const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }, 250);

        // Enforce 15-second maximum session listening window
        if (maxSessionTimeoutRef.current) {
          clearTimeout(maxSessionTimeoutRef.current);
        }
        maxSessionTimeoutRef.current = window.setTimeout(() => {
          if (isUserListeningRef.current) {
            stopRecording();
          }
        }, MAX_SESSION_DURATION_SEC * 1000);
      };

      // Event: onresult
      recognition.onresult = (event: any) => {
        let interim = '';
        let fullAccumulated = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcriptChunk = item[0]?.transcript || '';
          if (item.isFinal) {
            fullAccumulated += transcriptChunk + ' ';
            hasReceivedAnySpeechRef.current = true;
          } else {
            interim += transcriptChunk;
          }
        }

        if (fullAccumulated.trim()) {
          finalCollectedTranscriptRef.current = fullAccumulated.trim();
        }

        // Show live speech feedback
        const liveDisplay = (fullAccumulated + (interim ? ' ' + interim : '')).trim();
        if (liveDisplay) {
          setInterimText(liveDisplay);
          hasReceivedAnySpeechRef.current = true;
        }

        // Reset silence timeout whenever user speaks: if they pause for 3.5s after saying words, stop comfortably
        if (hasReceivedAnySpeechRef.current) {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          silenceTimeoutRef.current = window.setTimeout(() => {
            if (isUserListeningRef.current) {
              stopRecording();
            }
          }, SILENCE_TIMEOUT_MS);
        }
      };

      // Event: onerror
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        console.error('Speech recognition message:', event.message);

        const errorType = event.error;

        // If the user deliberately clicked stop / abort, don't show an error
        if (errorType === 'aborted' && !isUserListeningRef.current) {
          cleanupAudioResources();
          setRecorderState('idle');
          return;
        }

        // If speech was already collected and error is no-speech, finalize with collected text
        if (errorType === 'no-speech' && finalCollectedTranscriptRef.current.trim()) {
          finalizeResult(langCode);
          return;
        }

        cleanupAudioResources();
        setRecorderState('idle');

        let userFriendlyMsg = '';

        switch (errorType) {
          case 'not-allowed':
            userFriendlyMsg = 'Microphone permission was denied. Please allow microphone access in Chrome.';
            break;
          case 'service-not-allowed':
            userFriendlyMsg = 'Speech recognition service is unavailable in this browser.';
            break;
          case 'audio-capture':
            userFriendlyMsg =
              'Chrome could not access your microphone. Check your microphone permissions or whether another application is using it.';
            break;
          case 'no-speech':
            userFriendlyMsg = 'No speech detected. Please speak clearly and try again.';
            break;
          case 'network':
            userFriendlyMsg =
              'Speech recognition could not connect. Please check your internet connection.';
            break;
          case 'language-not-supported':
            userFriendlyMsg = 'The selected language is not supported by this browser.';
            break;
          case 'aborted':
            userFriendlyMsg = 'Listening was stopped. Tap the microphone to try again.';
            break;
          default:
            userFriendlyMsg = `Speech recognition error (${errorType || 'unknown'}). Please tap to try again.`;
            break;
        }

        setErrorMessage(userFriendlyMsg);
        onError?.(userFriendlyMsg);
      };

      // Event: onend
      recognition.onend = () => {
        finalizeResult(langCode);
      };

      // Start recognition
      recognition.start();
    } catch (startErr: any) {
      console.error('Recognition start exception:', startErr);
      cleanupAudioResources();
      setRecorderState('idle');
      const startFailMsg = `Could not start speech recognition (${startErr?.message || 'system error'}). Please try again.`;
      setErrorMessage(startFailMsg);
      onError?.(startFailMsg);
    }
  }, [
    cleanupAudioResources,
    clearSessionTimers,
    finalizeResult,
    onError,
    recorderState,
    startVisualPulse,
    stopRecording,
  ]);

  // Double-click guarded toggle
  const toggleRecording = useCallback(() => {
    if (recorderState === 'idle') {
      startRecording();
    } else if (recorderState === 'recording') {
      stopRecording();
    }
    // Ignore clicks if state is 'starting' or 'processing'
  }, [recorderState, startRecording, stopRecording]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    recorderState,
    errorMessage,
    audioLevel,
    interimText,
    elapsedSeconds,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError,
    cleanupAudioResources,
  };
}
