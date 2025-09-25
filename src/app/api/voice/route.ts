import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Environment validation
const openaiKey = process.env.OPENAI_API_KEY;

if (!openaiKey) {
  throw new Error('Missing OpenAI API key. Please check OPENAI_API_KEY environment variable.');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiKey,
});

// Logger for debugging (commented out to avoid unused variable warning)
// const logger = {
//   info: (message: string, data?: unknown) => console.log(`[VOICE-API] ${new Date().toISOString()} INFO: ${message}`, data),
//   error: (message: string, error?: unknown) => console.error(`[VOICE-API] ${new Date().toISOString()} ERROR: ${message}`, error),
//   warn: (message: string, data?: unknown) => console.warn(`[VOICE-API] ${new Date().toISOString()} WARN: ${message}`, data)
// };

export async function GET() {
  try {
    // Health check endpoint
    await openai.models.list();
    
    return NextResponse.json({
      status: 'healthy',
      service: 'hana-voice-service',
      tts_available: true,
      openai_connected: true,
      cache_available: false, // Will implement caching later
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        service: 'hana-voice-service',
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, voice, language, speed, audioData } = body;

    switch (action) {
      case 'generate-speech':
        // Text-to-speech generation
        if (!text) {
          return NextResponse.json(
            { error: 'Text is required for speech generation' },
            { status: 400 }
          );
        }

        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice || "nova",
          input: text,
          speed: speed || 0.95,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const base64Audio = buffer.toString('base64');

        return NextResponse.json({
          audio: base64Audio,
          format: 'mp3',
          duration: 'generated',
          language: language || "ar"
        });

      case 'transcribe':
        // Speech-to-text transcription
        if (!audioData) {
          return NextResponse.json(
            { error: 'Audio data is required for transcription' },
            { status: 400 }
          );
        }

        const audioBuffer = Buffer.from(audioData, 'base64');
        const transcription = await openai.audio.transcriptions.create({
          file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
          model: "whisper-1",
          language: language || "ar",
          response_format: "json",
        });

        return NextResponse.json({
          transcription: transcription.text,
          language: language || "ar",
          confidence: "high"
        });

      case 'process-survey':
        // Process complete voice survey
        if (!audioData || !body.surveyQuestions) {
          return NextResponse.json(
            { error: 'Audio data and survey questions are required' },
            { status: 400 }
          );
        }

        // First transcribe the audio
        const surveyAudioBuffer = Buffer.from(audioData, 'base64');
        const surveyTranscription = await openai.audio.transcriptions.create({
          file: new File([surveyAudioBuffer], 'survey.wav', { type: 'audio/wav' }),
          model: "whisper-1",
          language: language || "ar",
          response_format: "json",
        });

        // Then analyze the transcription with GPT
        const analysis = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a healthcare survey analyst. Analyze the transcribed responses and extract structured data."
            },
            {
              role: "user",
              content: `Survey Questions: ${JSON.stringify(body.surveyQuestions)}\n\nTranscribed Responses: ${surveyTranscription.text}\n\nPlease analyze and return structured responses.`
            }
          ],
          temperature: 0.3,
        });

        return NextResponse.json({
          transcription: surveyTranscription.text,
          analysis: analysis.choices[0].message.content,
          language: language || "ar"
        });

      case 'get-voices':
        // Get available TTS voices
        const voices = [
          { id: "alloy", name: "Alloy", language: "multilingual" },
          { id: "echo", name: "Echo", language: "multilingual" },
          { id: "fable", name: "Fable", language: "multilingual" },
          { id: "onyx", name: "Onyx", language: "multilingual" },
          { id: "nova", name: "Nova", language: "multilingual" },
          { id: "shimmer", name: "Shimmer", language: "multilingual" }
        ];

        return NextResponse.json({ voices });

      case 'get-languages':
        // Get supported languages
        const languages = [
          { code: "ar", name: "Arabic", native: "العربية" },
          { code: "en", name: "English", native: "English" },
          { code: "fr", name: "French", native: "Français" },
          { code: "es", name: "Spanish", native: "Español" },
          { code: "de", name: "German", native: "Deutsch" }
        ];

        return NextResponse.json({ languages });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Voice processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice request' },
      { status: 500 }
    );
  }
}
