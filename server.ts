import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VaaniCare API' });
});

// Transcription endpoint
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm', mode, language } = req.body;

    if (!audioData || typeof audioData !== 'string') {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Speech recognition failed. Gemini API key is not configured.',
      });
    }

    const ai = aiClient || new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Strip data URL header if present (e.g. "data:audio/webm;base64,")
    const cleanBase64 = audioData.includes(',')
      ? audioData.split(',')[1]
      : audioData;

    // Normalize mimeType (strip codecs if any for API compatibility)
    let cleanMimeType = mimeType.split(';')[0].trim();
    if (!cleanMimeType || cleanMimeType === 'audio') {
      cleanMimeType = 'audio/webm';
    }

    const languageInstruction = language && language !== 'auto'
      ? `Target Language/Dialect: ${language} (e.g., ta-IN: Tamil/Tanglish, en-IN: Indian English, ml-IN: Malayalam, hi-IN: Hindi, te-IN: Telugu, kn-IN: Kannada). Transcribe in this spoken language without translation.`
      : 'Auto-detect spoken language. Transcribe exactly as spoken without translation.';

    const systemInstruction = `You are VaaniCare, an exact speech-to-text recognition system designed especially for children, elderly individuals, and everyday multilingual speakers.
${languageInstruction}

STRICT PRINCIPLES:
1. ONLY transcribe what the speaker actually said.
2. DO NOT TRANSLATE under any circumstances.
   - If the person speaks Tamil: Display Tamil or Tanglish as spoken.
   - If the person says "Enakku thanni venum", output "Enakku thanni venum", NOT "I want water".
   - If the person says "Amma water kondu va", output "Amma water kondu va", NOT "Mom, bring water".
   - If the person says "Enakku sapadu venum", output "Enakku sapadu venum", NOT "I want food".
   - If the person speaks English: Display English.
   - If the person speaks Tanglish or Tamil+English mixed: Preserve the exact mixed words and spelling.
   - If the person speaks Malayalam, Hindi, Telugu, or Kannada: Preserve the spoken words without translation.
3. DO NOT summarize, interpret, rewrite, or correct grammar.
4. DO NOT convert Tanglish into Tamil script (keep Romanized words if spoken in Tanglish/slang).
5. If speech is unclear, inaudible, or mumbled:
   - DO NOT invent or hallucinate words!
   - Represent unclear words with "..." (e.g., "Enakku ... venum").
   - Set isUnclear to true and unclearNote to "Some words were unclear."
6. If the audio is completely silent or only background noise without human voice:
   - Return empty text or "[No speech detected]" and set confidence to 0.
7. Estimate confidence realistically:
   - 85-98 for clear speech (level: "high")
   - 60-84 for medium clarity (level: "medium")
   - Below 60 for noisy or unclear speech (level: "low")`;

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: cleanBase64,
      },
    };

    const transcribePrompt = `${systemInstruction}\n\nTask: Transcribe this audio recording exactly as spoken without translation. Return a JSON object with:
"text": the exact words spoken (preserve Tamil/Tanglish/English/etc verbatim, never translate),
"detectedLanguage": language detected,
"confidence": integer 0-100,
"confidenceLevel": "high" | "medium" | "low",
"isUnclear": boolean,
"unclearNote": string.`;

    const textPart = {
      text: transcribePrompt,
    };

    let rawText = '';
    let lastError: any = null;

    // Strategy 1: gemini-3.5-transcribe (specialized audio transcribe model - does NOT support systemInstruction, prompt only)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: 'Transcribe this audio recording exactly as spoken without translation.' },
          ],
        },
      });
      const transcript = (response.text || '').trim();
      if (transcript) {
        rawText = JSON.stringify({
          text: transcript,
          detectedLanguage: 'Detected Speech',
          confidence: 90,
          confidenceLevel: 'high',
          isUnclear: false,
          unclearNote: '',
        });
      }
    } catch (transcribeErr: any) {
      console.warn('gemini-3.5-transcribe attempt note:', transcribeErr?.message || transcribeErr);
      lastError = transcribeErr;
    }

    // Strategy 2: If gemini-3.5-transcribe was empty or failed, use gemini-3.8-flash with JSON mode
    if (!rawText) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts: [audioPart, textPart] },
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });
        rawText = response.text || '';
      } catch (flashErr: any) {
        console.warn('gemini-3.8-flash JSON attempt note:', flashErr?.message || flashErr);
        lastError = flashErr;

        // Strategy 3: gemini-3.8-flash text mode fallback
        try {
          const rawResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: { parts: [audioPart, { text: 'Transcribe the spoken audio exactly as spoken. Do not translate. Return only the exact spoken words.' }] },
          });
          const textOnly = (rawResponse.text || '').trim();
          if (textOnly) {
            rawText = JSON.stringify({
              text: textOnly,
              detectedLanguage: 'Detected Speech',
              confidence: 85,
              confidenceLevel: 'high',
              isUnclear: false,
              unclearNote: '',
            });
          }
        } catch (rawErr: any) {
          console.error('All transcription strategies failed:', rawErr);
          lastError = rawErr;
        }
      }
    }

    if (!rawText) {
      throw lastError || new Error('No speech transcription received.');
    }

    let parsedResult;

    try {
      // Clean JSON string if wrapped in markdown formatting
      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsedResult = JSON.parse(cleanJson);
    } catch {
      // Fallback if parsing fails
      parsedResult = {
        text: rawText.replace(/```json/g, '').replace(/```/g, '').trim(),
        detectedLanguage: 'Detected Speech',
        confidence: 85,
        confidenceLevel: 'high',
        isUnclear: false,
        unclearNote: '',
      };
    }

    return res.json({
      success: true,
      text: parsedResult.text || '',
      detectedLanguage: parsedResult.detectedLanguage || 'Spoken language',
      confidence: typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 85,
      confidenceLevel: parsedResult.confidenceLevel || (parsedResult.confidence >= 80 ? 'high' : parsedResult.confidence >= 60 ? 'medium' : 'low'),
      isUnclear: Boolean(parsedResult.isUnclear),
      unclearNote: parsedResult.unclearNote || (parsedResult.isUnclear ? 'Some words were unclear.' : ''),
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      success: false,
      error: 'Speech recognition failed. Please try again.',
      details: error?.message || 'Unknown error occurred',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VaaniCare Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
