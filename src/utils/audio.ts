/**
 * Convert a Blob into a base64 encoded string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts any audio Blob (WebM, Ogg, MP4, etc.) to a standard PCM 16-bit Mono WAV Blob (16kHz).
 */
export async function convertBlobToWav(audioBlob: Blob): Promise<{ blob: Blob; mimeType: string }> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return { blob: audioBlob, mimeType: audioBlob.type || 'audio/webm' };
    }

    const audioCtx = new AudioCtx();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (decodeErr) {
      console.warn('decodeAudioData failed, falling back to original blob:', decodeErr);
      await audioCtx.close();
      return { blob: audioBlob, mimeType: audioBlob.type || 'audio/webm' };
    }

    const targetSampleRate = 16000;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetSampleRate), targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    await audioCtx.close();

    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    return { blob: wavBlob, mimeType: 'audio/wav' };
  } catch (err) {
    console.error('convertBlobToWav error, falling back:', err);
    return { blob: audioBlob, mimeType: audioBlob.type || 'audio/webm' };
  }
}

function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const channelData = audioBuffer.getChannelData(0);
  const dataLength = channelData.length * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM audio data (Float32 to Int16)
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    const sample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date = new Date()): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return `Today, ${formatTimestamp(date)}`;
  }

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${formatTimestamp(date)}`;
}

// Cached voices list with voiceschanged listener
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
      }
    } catch {
      // ignore
    }
  };

  updateVoices();
  window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
}

/**
 * Finds the most sweet, soft, natural, and friendly female voice for the target language.
 * Prefers natural/neural female voices and Indian regional voices (en-IN, ta-IN, ml-IN, hi-IN, te-IN, kn-IN).
 */
export function getBestNaturalVoice(targetLang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  let voices = cachedVoices;
  if (!voices || voices.length === 0) {
    try {
      voices = window.speechSynthesis.getVoices() || [];
      if (voices.length > 0) {
        cachedVoices = voices;
      }
    } catch {
      voices = [];
    }
  }

  if (voices.length === 0) {
    return null;
  }

  const normalizedTarget = (targetLang || 'ta-IN').toLowerCase();
  const langPrefix = normalizedTarget.split('-')[0];

  // Candidates matching exact language tag (e.g. 'ta-in' or 'en-in')
  const exactLangVoices = voices.filter(
    (v) => v.lang.toLowerCase() === normalizedTarget
  );

  // Candidates matching language prefix (e.g. 'ta', 'ml', 'hi', 'te', 'kn', 'en')
  const prefixLangVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith(langPrefix)
  );

  const pool = exactLangVoices.length > 0 ? exactLangVoices : prefixLangVoices.length > 0 ? prefixLangVoices : voices;

  // Female voice heuristic keywords (sweet, warm, friendly natural female names & tags)
  const femaleKeywords = [
    'female',
    'woman',
    'girl',
    'natural',
    'neural',
    'google',
    'zira',
    'samantha',
    'karen',
    'veena',
    'vani',
    'kalpana',
    'lekha',
    'priya',
    'heera',
    'sangeeta',
    'ananya',
    'pallavi',
    'swara',
    'neerja',
    'geeta',
    'shruti',
    'vidya',
    'kavya',
    'meera',
    'divya',
    'shreya',
  ];

  // 1. Check for natural/neural female voices in pool
  const naturalFemaleVoice = pool.find((v) => {
    const nameLower = v.name.toLowerCase();
    const isFemale = femaleKeywords.some((kw) => nameLower.includes(kw));
    const isNatural = nameLower.includes('natural') || nameLower.includes('online') || nameLower.includes('google');
    return isFemale && isNatural;
  });
  if (naturalFemaleVoice) return naturalFemaleVoice;

  // 2. Check for any female voice in pool
  const femaleVoice = pool.find((v) => {
    const nameLower = v.name.toLowerCase();
    return femaleKeywords.some((kw) => nameLower.includes(kw));
  });
  if (femaleVoice) return femaleVoice;

  // 3. Fallback to first voice in exactLangVoices
  if (exactLangVoices.length > 0) return exactLangVoices[0];

  // 4. Fallback to first voice in prefixLangVoices
  if (prefixLangVoices.length > 0) return prefixLangVoices[0];

  // 5. Default browser voice
  return pool[0] || null;
}

/**
 * Native Browser Text-to-Speech Playback using SpeechSynthesis.
 * Produces a SWEET, SOFT, WARM, FRIENDLY, and NATURAL voice for elderly people and children.
 * 
 * Specs:
 * - rate: 0.85 (calm, gentle, crystal clear pace)
 * - pitch: 1.15 (warm, friendly, soft female tone - not excessively high pitched)
 * - volume: 1.0 (clear audible comfort)
 * - window.speechSynthesis.cancel() beforehand so output never overlaps
 * - Speaks ONLY the recognized text (no translation, no alteration)
 */
export function speakRecognizedText(
  text: string,
  languageCode: string,
  onStart?: () => void,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  // Cancel any active speech beforehand so voice output never overlaps
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.warn('speechSynthesis.cancel error:', err);
  }

  if (!text || !text.trim()) {
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(text.trim());

  // Determine target language tag
  let targetLang = languageCode || 'ta-IN';
  if (targetLang === 'auto') {
    targetLang = 'ta-IN';
  }
  utterance.lang = targetLang;

  // Requested sweet, soft, natural vocal settings
  utterance.rate = 0.85;   // approximately 0.85
  utterance.pitch = 1.15;  // approximately 1.15
  utterance.volume = 1.0;  // 1.0

  // Choose the best natural, sweet female voice for the language
  const bestVoice = getBestNaturalVoice(targetLang);
  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis playback note:', e);
    onEnd?.();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (speakErr) {
    console.error('speechSynthesis.speak error:', speakErr);
    onEnd?.();
  }

  return utterance;
}
