export interface TTSService {
  speak(text: string): Promise<{ audio: ArrayBuffer; error?: string }>;
  setVoice(voice: string): void;
}

export * from './kokoro';
export * from './polly'; 