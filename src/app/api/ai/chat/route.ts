import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';
import { message_role_enum } from '@prisma/client';

interface ConversationResult {
  id: string;
}

async function getAIResponse(model: string, messages: any[]) {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`${model} API error:`, error);
      throw new Error(`${model} API error: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data || !data.message || !data.message.content) {
      throw new Error(`${model} returned invalid response format`);
    }

    return data.message.content;
  } catch (error) {
    console.error(`Error in getAIResponse for ${model}:`, error);
    throw new Error(`Failed to get response from ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function saveMessage(conversationId: string, message: any) {
  console.log('[DEBUG] saveMessage - conversationId:', conversationId, 'message:', message);
  try {
    const result = await prisma.chat_messages.create({
      data: {
        conversation_id: conversationId,
        role: message.role as message_role_enum,
        messages: {
          content: message.content,
          agent: message.agent || 'user',
          hidden: message.hidden || false,
          title: message.title
        }
      }
    });
    console.log('[DEBUG] Message saved:', result);
    return result;
  } catch (error) {
    console.error('[DEBUG] Error in saveMessage:', error);
    throw error;
  }
}

async function getOrCreateConversation(userId: string) {
  console.log('[DEBUG] getOrCreateConversation - userId:', userId);
  try {
    // Try to find an active conversation using Prisma query instead of raw
    const existingConv = await prisma.chat_conversations.findFirst({
      where: {
        user_id: userId
      },
      select: { 
        id: true 
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('[DEBUG] Existing conversation:', existingConv);

    if (existingConv) {
      return existingConv.id;
    }

    console.log('[DEBUG] Creating new conversation');
    // Create new conversation if none exists
    const newConv = await prisma.chat_conversations.create({
      data: {
        user_id: userId,
        title: 'New Conversation'
      },
      select: { id: true }
    });

    console.log('[DEBUG] Created new conversation:', newConv);
    return newConv.id;
  } catch (error) {
    console.error('[DEBUG] Error in getOrCreateConversation:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    console.log('[DEBUG] Starting chat route');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[DEBUG] No session found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[DEBUG] Session user:', session.user);

    let body;
    try {
      body = await req.json();
      console.log('[DEBUG] Request body:', body);
    } catch (error) {
      console.log('[DEBUG] Failed to parse request body:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body?.messages?.length) {
      console.log('[DEBUG] Invalid messages array:', body);
      return new Response(JSON.stringify({ error: 'Invalid or empty messages array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { messages, conversationId } = body;
    console.log('[DEBUG] Processing messages for conversation:', conversationId);

    try {
      // Get or create conversation
      const activeConversationId = conversationId || await getOrCreateConversation(session.user.id);
      console.log('[DEBUG] Active conversation ID:', activeConversationId);

      if (!activeConversationId) {
        throw new Error('Failed to get or create conversation');
      }

      // First, save the user's message
      const userMessage = messages[messages.length - 1];
      console.log('[DEBUG] Saving user message:', userMessage);
      await saveMessage(activeConversationId, {
        ...userMessage,
        agent: 'user'
      });

      // Get previous messages for context
      const previousMessages = await prisma.chat_messages.findMany({
        where: {
          conversation_id: activeConversationId
        },
        select: {
          role: true,
          messages: true
        },
        orderBy: {
          created_at: 'asc'
        }
      });

      // Create context with previous messages
      const contextMessages = [
        ...previousMessages.map(msg => ({
          role: msg.role,
          content: (msg.messages as any).content,
          agent: (msg.messages as any).agent
        })),
        userMessage
      ];

      // Get Llama response
      console.log('[DEBUG] Getting Llama response');
      const llamaResponse = await getAIResponse('llama3.2', contextMessages);
      if (!llamaResponse) {
        throw new Error('Failed to get Llama response');
      }

      // Save Llama's analysis
      console.log('[DEBUG] Saving Llama response');
      await saveMessage(activeConversationId, {
        role: 'assistant',
        content: llamaResponse,
        agent: 'llama3',
        hidden: true,
        title: 'Llama Analysis'
      });

      // Get DeepSeek's review
      console.log('[DEBUG] Getting DeepSeek review');
      const deepseekPrompt = `Review and enhance this code implementation:
${llamaResponse}

Original request: ${messages[messages.length - 1].content}

Your response MUST follow this exact format:

### Project Structure
\`\`\`
root-directory/
├── file1.ext
├── file2.ext
└── subdirectory/
    └── file3.ext
\`\`\`

### Implementation

First, provide the setup automation script:

For Unix/Linux/MacOS:
\`\`\`bash:setup.sh
#!/bin/bash
# Setup script for the application
# Usage: chmod +x setup.sh && ./setup.sh

# Add setup commands here
\`\`\`

For Windows:
\`\`\`batch:setup.bat
@echo off
REM Setup script for the application
REM Usage: setup.bat

REM Add setup commands here
\`\`\`

Then, provide each implementation file using this format:
\`\`\`language:path/to/file
// code content here
\`\`\`

Example:
\`\`\`python:src/main.py
def main():
    print("Hello World")
\`\`\`

### Setup Instructions
1. Download and extract all files
2. For Unix/Linux/MacOS:
   \`\`\`bash
   chmod +x setup.sh
   ./setup.sh
   \`\`\`
   
   For Windows:
   \`\`\`batch
   setup.bat
   \`\`\`

3. Additional setup steps (if any)...

### Analysis
Explain the implementation and any improvements made.

Important Requirements:
1. ALWAYS include the Project Structure section with the complete file tree
2. ALWAYS include setup automation scripts for both Unix and Windows
3. ALWAYS use the exact code block format: \`\`\`language:path/to/file
4. Include ALL files mentioned in the structure
5. Maintain consistent file paths between structure and code blocks
6. Ensure each file has the correct language identifier
7. Setup scripts should handle:
   - Directory creation
   - Dependency installation
   - Environment setup
   - Database initialization (if applicable)
   - Any necessary build steps

If the implementation needs improvement:
1. Point out what needs to be fixed
2. Provide corrected code for ALL files
3. Explain your changes to each code block

If the implementation is good:
1. Enhance it with additional features
2. Add error handling
3. Improve code quality
4. Ensure ALL files are included in your response`;

      const deepseekResponse = await getAIResponse('deepseek-r1:8b', [{ role: 'user', content: deepseekPrompt }]);

      // Check if code needs revision and store Llama's analysis
      const needsRevision = deepseekResponse.toLowerCase().includes('needs improvement') || 
                           deepseekResponse.toLowerCase().includes('should be fixed');

      let finalResponse = deepseekResponse;
      let llamaRevision = null;
      let llamaAnalysis = llamaResponse; // Store Llama's initial analysis

      if (needsRevision) {
        console.log('[DEBUG] Code needs revision, getting Llama revision');
        const llamaRevisionPrompt = `Please revise the code based on this feedback:
${deepseekResponse}

Original request: ${messages[messages.length - 1].content}

Provide the complete revised implementation and include all the files that were generated for this request.
Format your response with markdown code blocks, including all the filenames like: \`\`\`language:filename\`\`\``;

        llamaRevision = await getAIResponse('llama3.2', [{ role: 'user', content: llamaRevisionPrompt }]);
        llamaAnalysis = llamaRevision; // Update analysis with revision details
      }

      // Save the final response
      console.log('[DEBUG] Saving final response');
      await saveMessage(activeConversationId, {
        role: 'assistant',
        content: finalResponse,
        agent: 'deepseek',
        title: 'Final Response'
      });

      console.log('[DEBUG] Sending response to client');
      return new Response(JSON.stringify({
        choices: [{
          message: {
            role: 'assistant',
            content: finalResponse
          }
        }],
        debug: {
          initial_response: llamaResponse,
          llama_feedback: {
            needsRevision,
            analysis: typeof llamaAnalysis === 'string' ? llamaAnalysis : JSON.stringify(llamaAnalysis, null, 2),
            summary: needsRevision ? 'Code needed revision' : 'Code was good',
            explanation: needsRevision 
              ? 'Llama detected issues that needed to be addressed. See analysis for details.'
              : 'Llama found the implementation to be well-structured and complete. See analysis for details.'
          },
          deepseek_review: deepseekResponse,
          llama_revision: llamaRevision,
          final_response: finalResponse
        },
        conversationId: activeConversationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('[DEBUG] AI processing error:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process AI response'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('[DEBUG] Chat route error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process request'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 