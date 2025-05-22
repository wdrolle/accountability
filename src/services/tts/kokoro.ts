export class KokoroTTS {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = process.env.KOKORO_API_URL || 'http://localhost:5002'
  }

  async synthesize(text: string, voice?: string): Promise<Buffer> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: voice || 'af_bella' // Default to Bella if no voice specified
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Kokoro TTS Error:', error)
      throw error
    }
  }
} 