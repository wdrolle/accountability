import { NextResponse } from 'next/server'
import { KokoroTTS } from '@/services/tts/kokoro'

export async function POST(request: Request) {
  try {
    const { text, voice } = await request.json()
    
    const kokoro = new KokoroTTS()
    
    // Get audio buffer from Kokoro
    const audioBuffer = await kokoro.synthesize(text, voice)
    
    // Return audio as response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('TTS Error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate speech' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 