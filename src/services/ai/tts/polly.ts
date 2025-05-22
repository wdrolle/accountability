import { TTSService } from './index';

export class PollyTTS implements TTSService {
  private voice: string;

  constructor(voice: string = 'Joanna') {
    this.voice = voice;
  }

  async speak(text: string): Promise<{ audio: ArrayBuffer; error?: string }> {
    try {
      console.log('Sending Polly TTS request:', {
        text,
        voice: this.voice
      });

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: this.voice
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Polly TTS error response:', errorText);
        throw new Error(`TTS request failed: ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('Polly TTS response received, buffer size:', audioBuffer.byteLength);

      return { audio: audioBuffer };
    } catch (error) {
      console.error('Polly TTS error:', error);
      return { audio: new ArrayBuffer(0), error: 'TTS failed' };
    }
  }

  setVoice(voice: string) {
    console.log('Setting Polly voice to:', voice);
    this.voice = voice;
  }
} 