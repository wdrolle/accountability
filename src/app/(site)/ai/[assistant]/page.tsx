'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import React from 'react'
import VoiceSelectorPolly from '@/components/VoiceSelector/Polly'
import { Switch } from '@/components/ui/Switch'
import Breadcrumb from '@/components/Breadcrumb'
import { Assistant } from '@/services/ai/assistant'

interface PageProps {
  params: {
    assistant: string;
  };
}

export default function AIChatPage({ params }: PageProps) {
  const assistantName = params.assistant
  const [isListening, setIsListening] = useState(false)
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([])
  const [currentVoice, setCurrentVoice] = useState('Joanna')
  
  const { transcript, startListening, stopListening } = useSpeechRecognition()
  const { speak } = useTextToSpeech()

  // Initialize assistant with Polly voice
  const assistantRef = useRef<Assistant>(useMemo(() => {
    const assistant = new Assistant(assistantName)
    assistant.setVoice('Joanna')
    return assistant
  }, [assistantName]))

  // Start listening when page loads
  useEffect(() => {
    startListening()
    setIsListening(true)
  }, [])

  // Handle speech detection and auto-send
  useEffect(() => {
    if (transcript && isListening) {
      // Reset timer on new speech
      if (silenceTimer) clearTimeout(silenceTimer)
      
      // Set new timer for 1 second of silence
      const timer = setTimeout(() => {
        stopListening()
        setIsListening(false)
        // Send transcript to AI and get response
        handleSendMessage(transcript)
      }, 1000)
      
      setSilenceTimer(timer)
    }
  }, [transcript])

  const handleSendMessage = async (message: string) => {
    try {
      setMessages(prev => [...prev, { role: 'user', content: message }])
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          assistant: assistantName
        })
      })
      
      const data = await response.json()
      
      // Speak the AI response
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        speak(data.message)
        // Restart listening after response
        setTimeout(() => {
          startListening()
          setIsListening(true)
        }, 500)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleSpeechToggle = () => {
    if (isListening) {
      stopListening()
      setIsListening(false)
    } else {
      startListening()
      setIsListening(true)
    }
  }

  const handleVoiceChange = (voice: { id: string; languageCode: string }) => {
    setCurrentVoice(voice.id)
    assistantRef.current?.setVoice(voice.id)
  }

  return (
    <>
      <Breadcrumb pageTitle="AI Chat" />
      <div className="flex flex-col h-screen p-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
          <Switch
            label={isListening ? 'Listening (Click to stop)' : 'Click to start listening'}
            isSelected={isListening}
            onChange={handleSpeechToggle}
          />
          <VoiceSelectorPolly 
            onVoiceChange={handleVoiceChange}
            defaultVoiceId={currentVoice}
            className="w-64"
          />
        </div>
        <div className="status-message text-center p-2 bg-gray-100 rounded">
          {isListening ? 'Waiting for you to stop speaking, then I will respond...' : 'Processing...'}
        </div>
        
        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
              } max-w-[80%]`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </div>
    </>
  )
} 