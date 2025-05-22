'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import React from 'react'
import { KokoroVoiceSelector } from '@/components/VoiceSelector/Kokoro'
import { Switch } from '@/components/ui/Switch'
import Breadcrumb from '@/components/Breadcrumb'
import { Assistant } from '@/services/ai/assistant'
import ReactMarkdown from 'react-markdown'

export default function AIDemoPage() {
  const [isListening, setIsListening] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([])
  const [currentVoice, setCurrentVoice] = useState('af_bella')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition()
  const { speak } = useTextToSpeech()

  // Initialize assistant with Kokoro voice
  const assistantRef = useRef<Assistant>(useMemo(() => {
    const assistant = new Assistant('demo')
    assistant.setVoice('af_bella')
    return assistant
  }, []))

  // Handle real-time transcript updates
  useEffect(() => {
    if (transcript && isListening) {
      setCurrentTranscript(transcript)
    }
  }, [transcript, isListening])

  // Don't auto-start listening, let user control it
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return
    
    setIsProcessing(true)
    try {
      setMessages(prev => [...prev, { role: 'user', content: message }])
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          assistant: 'demo'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      if (data.message) {
        // Format the response as markdown
        const formattedMessage = formatAIResponse(data.message)
        
        // Add AI response to chat
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: typeof formattedMessage === 'string' ? formattedMessage : JSON.stringify(formattedMessage)
        }])

        // Speak the response - strip markdown for speech
        const textToSpeak = typeof formattedMessage === 'string' 
          ? formattedMessage.replace(/[#*`_~\n]/g, ' ').replace(/\s+/g, ' ').trim()
          : String(formattedMessage)
        
        await speak(textToSpeak, currentVoice)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your message.' 
      }])
    } finally {
      setIsProcessing(false)
      setCurrentTranscript("")
      resetTranscript()
      if (isListening) {
        startListening()
      }
    }
  }

  // Helper function to format AI response
  const formatAIResponse = (message: any): string => {
    try {
      // If message is already a string, return it
      if (typeof message === 'string') {
        // Check if it's a JSON string
        if (message.startsWith('{') && message.endsWith('}')) {
          const parsed = JSON.parse(message)
          return parsed.content || message
        }
        return message
      }
      
      // If message is an object, try to get content
      if (typeof message === 'object' && message !== null) {
        return message.content || JSON.stringify(message)
      }
      
      // Fallback to string conversion
      return String(message)
    } catch (error) {
      console.error('Error formatting message:', error)
      return String(message)
    }
  }

  const handleSpeechToggle = () => {
    if (isListening) {
      stopListening()
      setIsListening(false)
      if (currentTranscript.trim()) {
        handleSendMessage(currentTranscript)
      }
    } else {
      setCurrentTranscript("")
      resetTranscript()
      startListening()
      setIsListening(true)
    }
  }

  const handleVoiceChange = (voice: string) => {
    setCurrentVoice(voice)
    assistantRef.current?.setVoice(voice)
  }

  return (
    <>
      <Breadcrumb pageTitle="AI Demo" />
      <div className="flex flex-col h-[calc(100vh-64px)] p-4">
        <div className="flex items-center gap-4 light:text-black dark:text-black p-4 rounded-lg bg-gray-50 h-[72px]">
          <div className="flex-1">
            <Switch
              label={isListening ? 'Listening (Click to stop)' : 'Click to start listening'}
              isSelected={isListening}
              onChange={handleSpeechToggle}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Voice:</span>
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg">
              <KokoroVoiceSelector 
                onChange={handleVoiceChange}
                currentVoice={currentVoice}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-center h-[48px] my-2">
          <div 
            className={`status-message inline-block text-center light:text-black dark:text-black p-2 rounded
              ${isProcessing ? 'animate-pulse bg-yellow-100' : 
                isListening ? 'animate-pulse bg-blue-100' : 'bg-gray-100'}`}
          >
            {isProcessing ? 'Processing...' : 
             isListening ? (currentTranscript || 'Listening...') : 
             'Click to start listening'}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}
              style={{ marginBottom: '0.5rem', lineHeight: '1.2' }}
            >
              <div 
                className={`rounded-lg inline-block max-w-full ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 dark:bg-blue-900 ml-auto px-4 py-2 mr-2' 
                    : 'bg-gray-100 dark:bg-gray-800 pl-4 pr-4 py-2 ml-2'
                }`}
                style={{
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                }}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    className="max-w-none"
                    components={{
                      p: ({ children }) => (
                        <p className="whitespace-pre-wrap overflow-wrap-break-word pl-1 pr-1 pt-0 pb-0 text-justify">
                          {children}
                        </p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold pl-10 pr-10 py-10 pb-1 my-0.5 text-justify">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-bold pl-2 pr-2 pb-1 py-1 my-0.5 text-justify">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-bold pl-2 pr-2 pb-1 py-1 my-0.5 text-justify">
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-8 pr-2 pt-0 pb-0 my-0.1 text-justify">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-8 pr-0 pt-0 pb-0 my-0.1 text-justify">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="list-item pl-8 pr-0 pt-0 pb-0 my-0.1 text-justify">
                          {children}
                        </li>
                      ),
                      code: ({ className, children }) => (
                        <code className={`${className || ''} block p-1 bg-gray-800 rounded my-0.1 text-white`}>
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap overflow-wrap-break-word my-0.1 text-justify">
                    {typeof msg.content === 'string' && msg.content.startsWith('{"role"') 
                      ? JSON.parse(msg.content).content 
                      : msg.content}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
} 