// src/utils/pollyService.ts

import { PollyClient, SynthesizeSpeechCommand, Engine, OutputFormat, TextType, SynthesizeSpeechCommandInput, VoiceId, LanguageCode } from "@aws-sdk/client-polly";
import { Readable } from 'stream';

export class PollyService {
  private client: PollyClient;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    console.log('Initializing Polly client with region:', region);
    
    this.client = new PollyClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
  }

  private wrapTextInSSML(text: string): string {
    // Remove any existing SSML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Escape special characters
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Add proper SSML tags
    return `<speak>${text}</speak>`;
  }

  async synthesizeSpeech(text: string, voiceId: string = "Joanna") {
    console.log('Synthesizing speech with params:', {
      text: text.substring(0, 100) + '...', // Log first 100 chars
      voiceId,
      engine: "neural",
      format: "mp3"
    });

    const ssmlText = this.wrapTextInSSML(text);
    console.log('SSML formatted text:', ssmlText.substring(0, 100) + '...');

    const input: SynthesizeSpeechCommandInput = {
      Engine: "neural" as Engine,
      LanguageCode: "en-US" as LanguageCode,
      OutputFormat: "mp3" as OutputFormat,
      Text: ssmlText,
      TextType: "ssml" as TextType,
      VoiceId: voiceId as VoiceId,
    };

    try {
      console.log('Sending request to AWS Polly...');
      const command = new SynthesizeSpeechCommand(input);
      const response = await this.client.send(command);
      console.log('Received response from AWS Polly:', {
        hasAudioStream: !!response.AudioStream,
        contentType: response.ContentType,
        requestId: response.$metadata.requestId
      });
      
      // Convert the audio stream to a Buffer
      if (response.AudioStream instanceof Readable) {
        console.log('Processing Readable audio stream...');
        const chunks: Buffer[] = [];
        for await (const chunk of response.AudioStream) {
          chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        console.log('Audio buffer created, size:', buffer.length, 'bytes');
        return buffer;
      } else if (response.AudioStream instanceof Uint8Array) {
        console.log('Processing Uint8Array audio stream...');
        const buffer = Buffer.from(response.AudioStream);
        console.log('Audio buffer created, size:', buffer.length, 'bytes');
        return buffer;
      }
      throw new Error("No audio stream returned");
    } catch (error) {
      console.error("Error synthesizing speech:", error);
      // Log AWS specific error details if available
      if (error && typeof error === 'object' && '$metadata' in error) {
        const awsError = error as { $metadata: { requestId?: string; cfId?: string; httpStatusCode?: number } };
        console.error('AWS Error Metadata:', {
          requestId: awsError.$metadata?.requestId,
          cfId: awsError.$metadata?.cfId,
          httpStatusCode: awsError.$metadata?.httpStatusCode
        });
      }
      throw error;
    }
  }
} 