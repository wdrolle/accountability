import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma_demo';

const DEMO_USER_ID = "3509c6b9-c8d9-b406-b61d-4fed23d2fcbe";

interface ChatMessage {
  id: number;
  conversation_id: string;
  messages: string;
  created_at: Date;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // Get all spiritual guidance messages for demo user
    const analyses = await prisma.$queryRaw<ChatMessage[]>`
      SELECT cm.id, cm.conversation_id, cm.messages, cm.created_at
      FROM agents.chat_messages cm
      JOIN agents.chat_conversations cc ON cc.id = cm.conversation_id
      WHERE cc.user_id = ${DEMO_USER_ID}::uuid
      AND cc.title = ${type || 'Spiritual Guidance'}
      ORDER BY cm.created_at DESC
      LIMIT ${limit}
    `;

    // Format the response
    const formattedHistory = analyses.map(chat => {
      try {
        const messages = JSON.parse(chat.messages);
        return {
          id: chat.id,
          conversation_id: chat.conversation_id,
          content: messages,
          created_at: chat.created_at
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    return new NextResponse(
      JSON.stringify(formattedHistory),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return new NextResponse(
      JSON.stringify([]),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}  