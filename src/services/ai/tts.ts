import { TTSResponse } from './types';

export class KokoroTTS {
  private baseUrl: string;
  private voice: string;

  constructor(voice: string = 'af_bella') {
    this.baseUrl = 'http://localhost:8880';
    this.voice = voice;
  }

  async speak(text: string): Promise<TTSResponse> {
    try {
      console.log('Sending TTS request:', {
        text,
        voice: this.voice,
        url: `${this.baseUrl}/api/tts`
      });

      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: this.voice,
          speed: 1.0
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS error response:', errorText);
        throw new Error(`TTS request failed: ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('TTS response received, buffer size:', audioBuffer.byteLength);

      return { audio: audioBuffer };
    } catch (error) {
      console.error('TTS error:', error);
      return { audio: new ArrayBuffer(0), error: 'TTS failed' };
    }
  }

  setVoice(voice: string) {
    console.log('Setting voice to:', voice);
    this.voice = voice;
  }
} 