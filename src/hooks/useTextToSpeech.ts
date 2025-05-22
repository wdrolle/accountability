'use client'

import { useCallback } from 'react'

export function useTextToSpeech() {
  const speak = useCallback(async (text: string, voice?: string) => {
    try {
      const response = await fetch('/api/tts/kokoro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          voice // Pass the voice parameter
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get audio')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      await audio.play()
      
      // Cleanup URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
      }
    } catch (error) {
      console.error('Error playing TTS:', error)
    }
  }, [])

  return { speak }
} 