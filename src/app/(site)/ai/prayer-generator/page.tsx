// app/admin/page.tsx
// This file is used to handle the admin page
// It is used to generate and send test messages to users

'use client'

import { useState } from 'react'
import { MESSAGE_THEMES, type MessageTheme } from '@/types/messageTypes'

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If it's a Spanish number (starts with 34)
  if (cleaned.startsWith('34')) {
    return '+' + cleaned
  }
  
  // If it already has a country code (starts with +)
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // Default to US number (+1)
  return '+1' + cleaned
}

function validatePhoneNumber(phone: string): boolean {
  // Basic validation: should start with + followed by country code and number
  const phoneRegex = /^\+(?:1|34)\d{10}$/  // Supports US (+1) and Spain (+34) numbers
  return phoneRegex.test(phone)
}

export default function AdminPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<MessageTheme>(MESSAGE_THEMES[0])
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateMessage = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: selectedTheme.prompt,
          themeId: selectedTheme.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate message');
      }
      
      if (!data.success || !data.message) {
        throw new Error('No message received from AI');
      }

      setGeneratedMessage(data.message);
    } catch (error) {
      console.error('Error generating message:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('')
    setError('')

    const formattedNumber = formatPhoneNumber(phoneNumber)
    
    if (!validatePhoneNumber(formattedNumber)) {
      setError('Invalid phone number format. Please use format: +1XXXXXXXXXX or +34XXXXXXXXX')
      return
    }

    if (!generatedMessage) {
      setError('Please generate a message first')
      return
    }

    setStatus('Sending...')

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: formattedNumber,
          message: generatedMessage,
          themeId: selectedTheme.id
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setStatus('Message sent successfully!')
        setPhoneNumber('')
        setGeneratedMessage('')
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (error) {
      setError('Error sending message')
      console.error(error)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin - Test Messages</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="theme" className="block mb-2">
            Message Theme
          </label>
          <select
            id="theme"
            value={selectedTheme.id}
            onChange={(e) => setSelectedTheme(MESSAGE_THEMES.find(t => t.id === e.target.value) || MESSAGE_THEMES[0])}
            className="w-full p-2 border rounded"
          >
            {MESSAGE_THEMES.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTheme.description}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={generateMessage}
            disabled={isGenerating}
            className="w-full bg-green-500 text-white dark:text-gray-800 p-2 rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed mb-4"
          >
            {isGenerating ? 'Generating...' : 'Generate New Message'}
          </button>

          {generatedMessage && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Generated Message:</h3>
              <p className="text-gray-800 dark:text-white">{generatedMessage}</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block mb-2">
            Test Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value)
              setError('')
              setStatus('')
            }}
            placeholder="+1 (917) 123-4567 or +34 612 345 678"
            className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Format: +1 (917) 123-4567 (US) or +34 612 345 678 (Spain)
          </p>
          {error && (
            <p className="mt-1 text-sm text-red-500">{error}</p>
          )}
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-gray-800 dark:text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={!generatedMessage || !!error || status === 'Sending...'}
        >
          {status === 'Sending...' ? 'Sending...' : 'Send Test Message'}
        </button>
      </form>

      {status && !error && (
        <div className="mt-4 p-4 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
          {status}
        </div>
      )}
    </div>
  )
} 