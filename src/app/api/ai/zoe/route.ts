import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's first name from Prisma database
    let userName = 'friend';
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          first_name: true,
        },
      });

      if (user?.first_name) {
        userName = user.first_name;
      }
    }

    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        prompt: `You are an advanced AI assistant focused on productivity and organization. Your capabilities include managing calendars, handling emails, task management, and providing clear information.
        Address the user by their first name: ${userName}
        
        Format your response using this structure:
        1. Start with "Hello ${userName}," ONLY ONCE at the beginning
        2. Use proper HTML/Markdown formatting:
           - <br> for line breaks
           - <h1> for the main title (20px, bold)
           - <h2> for major sections (18px, bold)
           - <h3> for subsections (16px, semibold)
           - <p> for regular paragraphs (14px)
           - <strong> for bold text
           - <em> for italics
           - <ol> with <li> for numbered lists
           - <ul> with <li> for bullet points
           - <hr> for section breaks
           - <span class="highlight"> for important concepts
           - <div class="action-items"> for tasks and next steps
        
        Example format:
        Hello ${userName},
        
        <h1>Response Topic</h1>
        <p>Clear explanation with <strong>key points</strong> and <em>important details</em>.</p>
        
        <h2>Suggested Actions</h2>
        <p>Here's what you can do...</p>
        
        <h3>Key Points</h3>
        <ol>
          <li>First action item</li>
          <li>Second point with <span class="highlight">highlighted concept</span></li>
        </ol>
        
        <ul>
          <li>Additional consideration</li>
          <li>Related information</li>
        </ul>
        
        <hr>
        
        <div class="action-items">Next steps and reminders...</div>
        
        Keep responses clear, practical, and actionable.
        Focus on helping users be more productive and organized.
        
        User says: ${prompt}
        
        Provide a helpful response:`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          num_predict: 500
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama error:', errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: "The model is not installed. Please run 'ollama pull deepseek-r1:8b' first." },
          { status: 404 }
        );
      }
      
      if (response.status === 503) {
        return NextResponse.json(
          { error: "Ollama service is not running. Please start Ollama with 'ollama serve'" },
          { status: 503 }
        );
      }

      throw new Error(`Ollama error: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error('No response from Ollama');
    }

    // Format the response for better speech synthesis while preserving markdown
    const formattedResponse = data.response
      .trim()
      // Remove HTML tags and clean up for speech
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*/g, '$1 ')
      // Clean up markdown
      .replace(/[""]([^""]+)[""]/g, '$1')
      // Final cleanup
      .trim();

    // Format markdown for display
    const markdownResponse = data.response
      .trim()
      // Add CSS classes
      .replace(/<h1>/g, '<h1 class="text-2xl font-bold mb-4 text-primary">')
      .replace(/<h2>/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-primary">')
      .replace(/<h3>/g, '<h3 class="text-lg font-semibold mt-4 mb-2">')
      .replace(/<p>/g, '<p class="mb-4 leading-relaxed">')
      .replace(/<blockquote>/g, '<blockquote class="pl-4 border-l-4 border-primary/50 my-4 italic text-primary/80">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-4 space-y-2">')
      .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4 space-y-2">')
      .replace(/<li>/g, '<li class="ml-2">')
      .replace(/<hr>/g, '<hr class="my-6 border-t border-primary/20">')
      .replace(/<div class="prayer">/g, '<div class="prayer bg-primary/5 p-4 rounded-lg mt-6 text-primary/80 italic">')
      // Clean up any remaining tags
      .replace(/(<[^>]+>)\s+/g, '$1')
      .replace(/\s+(<\/[^>]+>)/g, '$1');

    // Add this after processing the response
    const conversation = await prisma.chat_conversations.create({
      data: {
        user_id: session.user.id,
        title: 'Conversation with Zoe',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await prisma.chat_messages.create({
      data: {
        conversation_id: conversation.id,
        messages: prompt,
        created_at: new Date()
      },
    });

    await prisma.chat_messages.create({
      data: {
        conversation_id: conversation.id,
        messages: data.response,
        created_at: new Date()
      },
    });

    return NextResponse.json({ 
      command: formattedResponse,
      markdown: markdownResponse
    });

  } catch (error) {
    console.error('Zoe API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
} 