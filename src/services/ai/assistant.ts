import { KokoroTTS } from './tts/kokoro';
import { PollyTTS } from './tts/polly';
import { AIBrain } from './brain';
import { AIMessage } from './types';
import { Memory } from './memory';

export class Assistant {
  private brain: AIBrain;
  private kokoroTTS: KokoroTTS;
  private pollyTTS: PollyTTS;
  private memory: Memory;
  private context: AIMessage[];
  private currentTTS: 'kokoro' | 'polly';
  private voice: string;
  private assistantName: string;

  constructor(assistantName: string) {
    this.assistantName = assistantName;
    this.voice = 'Joanna';
    console.log('Initializing Assistant with voice:', this.voice);
    this.brain = new AIBrain('deepseek-r1:8b');
    this.kokoroTTS = new KokoroTTS(this.voice);
    this.pollyTTS = new PollyTTS('Joanna');
    this.memory = new Memory();
    this.context = [];
    this.currentTTS = this.voice.startsWith('af_') || this.voice.startsWith('am_') || this.voice.startsWith('bf_') || this.voice.startsWith('bm_') 
      ? 'kokoro' 
      : 'polly';
  }

  async processWithKokoro(text: string): Promise<ArrayBuffer> {
    console.log('Processing with Kokoro TTS');
    const { audio, error } = await this.kokoroTTS.speak(text);
    if (error) throw new Error(error);
    return audio;
  }

  async processWithPolly(text: string): Promise<ArrayBuffer> {
    console.log('Processing with Polly TTS');
    const { audio, error } = await this.pollyTTS.speak(text);
    if (error) throw new Error(error);
    return audio;
  }

  async process(message: string) {
    try {
      const response = await fetch(`/api/ai/${this.assistantName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        audio: data.audio
      };
    } catch (error) {
      console.error('Error in Assistant.process:', error);
      throw error;
    }
  }

  setVoice(voice: string) {
    this.voice = voice;
    console.log('Assistant setting voice to:', this.voice);
    // Determine which TTS service to use based on voice prefix
    if (this.voice.startsWith('af_') || this.voice.startsWith('am_') || this.voice.startsWith('bf_') || this.voice.startsWith('bm_')) {
      this.currentTTS = 'kokoro';
      this.kokoroTTS.setVoice(this.voice);
    } else {
      this.currentTTS = 'polly';
      this.pollyTTS.setVoice(this.voice);
    }
    console.log('Using TTS service:', this.currentTTS);
  }

  clearContext() {
    this.context = [];
  }
} 