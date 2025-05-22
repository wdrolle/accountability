/**
 * RAID Analysis API Route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Environment variable for LLaMA API with fallback
const LLAMA_API_URL = process.env.LLAMA_API_URL || 'http://localhost:11434';

export async function POST(req: Request) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract request data
    const { transcript, analysis } = await req.json();
    if (!transcript || !analysis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate LLaMA API URL
    if (!LLAMA_API_URL) {
      console.error('LLAMA_API_URL is not configured');
      return NextResponse.json(
        { error: 'LLaMA API is not configured' },
        { status: 500 }
      );
    }

    // Construct context for LLaMA
    const context = `
Meeting Transcript:
${transcript.map((t: any) => `${t.text}`).join('\n')}

Current Analysis:
${JSON.stringify(analysis, null, 2)}
    `;

    try {
      // Call LLaMA API for validation
      const validationResponse = await fetch(`${LLAMA_API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `Given this meeting context, should the summary be updated? Answer only yes or no:\n\n${context}`,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 10
          }
        })
      });

      if (!validationResponse.ok) {
        throw new Error(`LLaMA API validation failed: ${validationResponse.statusText}`);
      }

      const { response: validationOutput } = await validationResponse.json();
      const needsUpdate = validationOutput.trim().toLowerCase() === 'yes';

      // Return existing analysis if no update needed
      if (!needsUpdate) {
        return NextResponse.json(analysis);
      }

      // Call LLaMA API for full analysis
      const analysisResponse = await fetch(`${LLAMA_API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `Analyze this meeting and provide a RAID analysis. Keep existing items and only add new ones:\n\n${context}`,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 2048
          }
        })
      });

      if (!analysisResponse.ok) {
        throw new Error(`LLaMA API analysis failed: ${analysisResponse.statusText}`);
      }

      const { response: analysisOutput } = await analysisResponse.json();
      
      // Parse and validate LLaMA output
      try {
        const matches = analysisOutput.match(/\{[\s\S]*\}/);
        if (!matches) {
          throw new Error('No JSON object found in response');
        }
        
        const jsonStr = matches[0];
        const updatedAnalysis = JSON.parse(jsonStr);
        
        // Ensure all required fields are present
        if (!updatedAnalysis.summary || !updatedAnalysis.risks || 
            !updatedAnalysis.actions || !updatedAnalysis.issues || 
            !updatedAnalysis.dependencies || !updatedAnalysis.decisions || 
            !updatedAnalysis.followups) {
          throw new Error('Missing required fields in analysis');
        }
        
        return NextResponse.json(updatedAnalysis);
      } catch (parseError) {
        console.error('Failed to parse LLaMA output:', parseError);
        console.error('Raw output:', analysisOutput);
        throw new Error('Failed to parse LLaMA response');
      }
    } catch (llamaError) {
      console.error('LLaMA API error:', llamaError);
      throw new Error('Failed to communicate with LLaMA API');
    }
  } catch (error) {
    console.error('Error in analyze_meetings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 