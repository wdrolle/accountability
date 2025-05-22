// src/app/api/tts/route.ts

import { NextResponse } from 'next/server';
import { 
  PollyClient, 
  SynthesizeSpeechCommand,
  SynthesizeSpeechCommandInput,
  Engine,
  VoiceId,
  OutputFormat,
  TextType,
  LanguageCode
} from "@aws-sdk/client-polly";

// Configure Polly client
console.log('AWS Config:', {
  region: process.env.AWS_REGION || 'us-east-1',
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

const polly = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

// Voice data with complete information
const VOICES = [
  // Arabic
  { id: 'Zeina', language: 'Arabic', languageCode: 'arb' as LanguageCode, gender: 'Female', neural: false, standard: true },
  
  // Arabic (Gulf)
  { id: 'Hala', language: 'Arabic (Gulf)', languageCode: 'ar-AE' as LanguageCode, gender: 'Female', neural: true, standard: false },
  { id: 'Zayd', language: 'Arabic (Gulf)', languageCode: 'ar-AE' as LanguageCode, gender: 'Male', neural: true, standard: false },
  
  // English (British)
  { id: 'Amy', language: 'British English', languageCode: 'en-GB' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Emma', language: 'British English', languageCode: 'en-GB' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Brian', language: 'British English', languageCode: 'en-GB' as LanguageCode, gender: 'Male', neural: true, standard: true },
  { id: 'Arthur', language: 'British English', languageCode: 'en-GB' as LanguageCode, gender: 'Male', neural: true, standard: false },
  
  // English (US)
  { id: 'Danielle', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Female', neural: true, standard: false, generative: true },
  { id: 'Gregory', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Male', neural: true, standard: false },
  { id: 'Ivy', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Female', neural: true, standard: true, childVoice: true },
  { id: 'Joanna', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Kendra', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Kimberly', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Salli', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Joey', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Male', neural: true, standard: true },
  { id: 'Justin', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Male', neural: true, standard: false, childVoice: true },
  { id: 'Kevin', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Male', neural: true, standard: true, childVoice: true },
  { id: 'Matthew', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Male', neural: true, standard: false },
  { id: 'Ruth', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Female', neural: true, standard: false },
  { id: 'Stephen', language: 'US English', languageCode: 'en-US' as LanguageCode, gender: 'Male', neural: true, standard: false },
  
  // French
  { id: 'Léa', language: 'French', languageCode: 'fr-FR' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Rémi', language: 'French', languageCode: 'fr-FR' as LanguageCode, gender: 'Male', neural: true, standard: false },
  
  // German
  { id: 'Vicki', language: 'German', languageCode: 'de-DE' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Daniel', language: 'German', languageCode: 'de-DE' as LanguageCode, gender: 'Male', neural: true, standard: false },
  
  // Spanish
  { id: 'Lucia', language: 'Spanish', languageCode: 'es-ES' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Enrique', language: 'Spanish', languageCode: 'es-ES' as LanguageCode, gender: 'Male', neural: false, standard: true },
  
  // Spanish (Mexican)
  { id: 'Mia', language: 'Mexican Spanish', languageCode: 'es-MX' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Andrés', language: 'Mexican Spanish', languageCode: 'es-MX' as LanguageCode, gender: 'Male', neural: true, standard: false },
  
  // Portuguese (Brazilian)
  { id: 'Camila', language: 'Brazilian Portuguese', languageCode: 'pt-BR' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Vitória', language: 'Brazilian Portuguese', languageCode: 'pt-BR' as LanguageCode, gender: 'Female', neural: true, standard: true },
  { id: 'Thiago', language: 'Brazilian Portuguese', languageCode: 'pt-BR' as LanguageCode, gender: 'Male', neural: true, standard: false }
];

// Helper function to clean and wrap text in SSML
function prepareSSML(text: string): string {
  // Remove any existing SSML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Add prosody tag for speech rate and proper SSML tags
  return `<speak><prosody rate="100%">${text}</prosody></speak>`;
}

export async function POST(request: Request) {
  try {
    const { text, voice = 'Joanna' } = await request.json();
    console.log('TTS request received:', { voice, textLength: text?.length });
    
    if (!text) {
      console.log('TTS error: No text provided');
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Find voice details
    const voiceDetails = VOICES.find(v => v.id === voice);
    if (!voiceDetails) {
      console.log('TTS error: Invalid voice selected:', voice);
      return NextResponse.json({ error: 'Invalid voice selected' }, { status: 400 });
    }

    console.log('Using voice:', voiceDetails);

    const params: SynthesizeSpeechCommandInput = {
      Text: prepareSSML(text),
      TextType: "ssml" as TextType,
      OutputFormat: 'mp3' as OutputFormat,
      VoiceId: voice as VoiceId,
      Engine: voiceDetails.neural ? "neural" as Engine : "standard" as Engine,
      LanguageCode: voiceDetails.languageCode
    };

    console.log('Polly params:', {
      ...params,
      Text: params.Text ? params.Text.substring(0, 100) + '...' : 'No text' // Safe access with fallback
    });

    try {
      const command = new SynthesizeSpeechCommand(params);
      console.log('Sending request to Polly...');
      const response = await polly.send(command);
      console.log('Polly response received');

      if (!response.AudioStream) {
        console.error('No audio stream in Polly response');
        throw new Error('No audio stream returned');
      }

      const audioBuffer = Buffer.from(await response.AudioStream.transformToByteArray());
      console.log('Audio buffer created, size:', audioBuffer.length, 'bytes');

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });

    } catch (error: any) {
      console.error('Polly error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      
      // Handle specific Polly errors
      if (error.name === 'InvalidSsmlException') {
        return NextResponse.json({ 
          error: 'Invalid SSML format', 
          details: error.message 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Speech synthesis failed', 
        details: error.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Invalid request', 
      details: error.message 
    }, { status: 400 });
  }
}

export async function GET() {
  // Convert VOICES array into a structured format
  const voicesByLanguage: Record<string, { language: string, voices: Array<{ id: string, gender: string, neural: boolean }> }> = {};
  
  VOICES.forEach(voice => {
    if (!voicesByLanguage[voice.language]) {
      voicesByLanguage[voice.language] = {
        language: voice.language,
        voices: []
      };
    }
    voicesByLanguage[voice.language].voices.push({
      id: voice.id,
      gender: voice.gender,
      neural: voice.neural
    });
  });

  return NextResponse.json({ voices: voicesByLanguage });
} 