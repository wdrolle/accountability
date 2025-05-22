export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

export interface TTSResponse {
  audio: ArrayBuffer;
  error?: string;
}

export interface STTResponse {
  text: string;
  error?: string;
}

export type KokoroVoice = 
  | 'af_bella' 
  | 'af_sarah'
  | 'am_adam'
  | 'am_michael'
  | 'bf_emma'
  | 'bf_isabella'
  | 'bm_george'
  | 'bm_lewis'
  | 'af_nicole'
  | 'af_sky'; 

