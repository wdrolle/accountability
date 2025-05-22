import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { messages, conversationId } = await req.json()

    // Call Deepseek API via Ollama
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseekr1',
        messages,
        stream: false
      })
    })

    const responseData = await aiResponse.json()

    // Save AI response
    await prisma.chat_messages.create({
      data: {
        conversation_id: conversationId,
        messages: responseData.messages,
        role: 'assistant'
      }
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error in Deepseek chat:', error)
    return NextResponse.json({ error: 'Error processing chat' }, { status: 500 })
  }
} 