import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendMessage } from "@/lib/message";

// Helper function to split text into chunks at sentence boundaries
function splitIntoChunks(text: string, maxLength: number = 1500): string[] {
  // First clean the content
  const cleanContent = text
    .replace(/<h1[^>]*>/gi, '\n\n')     // Replace headers with double newlines
    .replace(/<\/h1>/gi, '\n')
    .replace(/<h2[^>]*>/gi, '\n\n')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<h3[^>]*>/gi, '\n\n')
    .replace(/<\/h3>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')      // Replace paragraph starts with double newlines
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')      // Replace <br> with single newline
    .replace(/<blockquote[^>]*>/gi, '\n\n')  // Handle blockquotes
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<[^>]*>/g, '')            // Remove remaining HTML tags
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/\n\s+/g, '\n')            // Clean up spaces after newlines
    .replace(/\n{3,}/g, '\n\n')         // Limit consecutive newlines to 2
    .trim();

  const chunks: string[] = [];
  let currentChunk = '';

  // Split into sentences (handling multiple punctuation cases)
  const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [];

  for (const sentence of sentences) {
    // If adding this sentence would exceed the limit
    if ((currentChunk + sentence).length > maxLength) {
      // If current chunk is not empty, push it
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If single sentence is longer than maxLength, split it at word boundaries
      if (sentence.length > maxLength) {
        const words = sentence.split(' ');
        let tempChunk = '';
        
        for (const word of words) {
          if ((tempChunk + ' ' + word).length > maxLength) {
            chunks.push(tempChunk.trim());
            tempChunk = word;
          } else {
            tempChunk += (tempChunk ? ' ' : '') + word;
          }
        }
        
        if (tempChunk) {
          currentChunk = tempChunk;
        }
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk += sentence;
    }
  }

  // Add any remaining text
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    // Get user data from agents.user table
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email 
      },
      select: { 
        id: true,
        phone: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const phone = user.phone;

    if (!phone) {
      return NextResponse.json(
        { error: "No phone number found in your profile" },
        { status: 404 }
      );
    }

    // Save to daily_devotionals
    const devotional = await prisma.daily_devotionals.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        message_content: content,
        message_type: 'AI ZoeGenerated',
        delivery_status: 'AI-ZOE GENERATED',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
    });

    // Split content into proper chunks
    const messageChunks = splitIntoChunks(content);

    // Send each chunk as a separate message
    for (let i = 0; i < messageChunks.length; i++) {
      const chunk = messageChunks[i];
      const isLastChunk = i === messageChunks.length - 1;
      
      // Add part number if there are multiple chunks
      const messageBody = messageChunks.length > 1 
        ? `(${i + 1}/${messageChunks.length})\n\n${chunk}`
        : chunk;

      await sendMessage({
        to: phone,
        body: messageBody,
      });

      // Add a small delay between messages to maintain order
      if (!isLastChunk) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update status
    await prisma.daily_devotionals.update({
      where: { id: devotional.id },
      data: { 
        delivery_status: 'SENT',
        sent_at: new Date()
      },
    });

    return NextResponse.json({ 
      success: true,
      message: messageChunks.length > 1 
        ? `Message sent in ${messageChunks.length} parts`
        : 'Message sent successfully'
    });

  } catch (error) {
    console.error('Text send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send text message' },
      { status: 500 }
    );
  }
} 