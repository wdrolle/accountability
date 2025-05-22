import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, context } = await req.json();

    // Return empty response if no text provided
    if (!text?.trim()) {
      return NextResponse.json({
        response: '',
        suggestions: [],
        followUpQuestions: [],
        tasks: []
      });
    }

    try {
      // Try to connect to Poly API
      const polyResponse = await fetch('http://localhost:1337/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an advanced AI personal assistant focused on productivity and organization. Your capabilities include:
                - Managing calendars and scheduling
                - Handling email organization and responses
                - Task management and reminders
                - Information retrieval and summarization
                - General assistance with day-to-day queries
                
                You provide clear, actionable responses and practical suggestions. You're efficient, professional, and focused on helping users optimize their time and workflow.`
            },
            {
              role: 'user',
              content: `
                Please analyze and respond to the following:

                User's input: "${text}"
                
                Previous context: "${context}"

                Please provide:
                1. A clear and actionable response
                2. Specific suggestions for implementation or next steps
                3. Related tasks or reminders to consider

                Format the response as a JSON object with these categories:
                {
                  "response": "main response text",
                  "suggestions": ["actionable step 1", "actionable step 2", ...],
                  "followUpQuestions": ["question1", "question2", ...],
                  "tasks": ["potential task 1", "potential task 2", ...]
                }
              `
            }
          ],
          temperature: 0.7,
          max_tokens: 10000
        }),
      });

      if (!polyResponse.ok) {
        return NextResponse.json({
          response: '',
          suggestions: [],
          followUpQuestions: [],
          tasks: []
        });
      }

      const polyResult = await polyResponse.json();
      let analysis;

      try {
        // Extract JSON from Poly's response
        const jsonMatch = polyResult.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('Error parsing Poly response:', parseError);
        analysis = {
          response: '',
          suggestions: [],
          followUpQuestions: [],
          tasks: []
        };
      }

      return NextResponse.json(analysis);
    } catch (polyError) {
      console.warn('Poly API unavailable:', polyError);
      return NextResponse.json({
        response: '',
        suggestions: [],
        followUpQuestions: [],
        tasks: []
      });
    }
  } catch (error) {
    console.warn('Analysis error:', error);
    return NextResponse.json({
      response: '',
      suggestions: [],
      followUpQuestions: [],
      tasks: []
    });
  }
} 