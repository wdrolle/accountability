// app/api/generate-message/route.ts
// This is the route for generating a message
// It is used to generate a message for a user
// Handles generating a message

import { NextResponse } from "next/server";

export const runtime = 'edge';

// Fallback responses for when Llama is unavailable
const FALLBACK_RESPONSES = [
  {
    message: "Trust in the Lord with all your heart and lean not on your own understanding. In all your ways submit to him, and he will make your paths straight. - Proverbs 3:5-6\n\nRemember that God's wisdom surpasses our human understanding. When we place our trust in Him, He guides us along the right path.",
  },
  {
    message: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go. - Joshua 1:9\n\nTake comfort in knowing that God's presence is always with you, providing strength and courage for whatever challenges you face.",
  },
  {
    message: "Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken. - Psalm 55:22\n\nGod invites us to bring all our worries and concerns to Him. He is faithful to support and uphold us through every situation.",
  }
];

export async function POST(req: Request) {
  try {
    const { prompt, themeId } = await req.json();

    try {
      // Try Llama first
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-r1:8b",
          prompt: prompt,
          system: "You are a helpful assistant that can answer questions and help with tasks.",
          temperature: 0.3,
          max_tokens: 2000,
          stream: false
        })

      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          // Format the response with proper spacing for markdown headers
          const formattedResponse = data.response.replace(/###/g, '\n\n###');
          return NextResponse.json({
            success: true,
            message: formattedResponse
          });
        }
      }

      // If DeepSeek fails, use fallback
      console.log('DeepSeek API unavailable, using fallback response');
      const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
      
      return NextResponse.json({
        success: true,
        message: fallbackResponse.message,
        isFallback: true
      });

    } catch (llamaError) {
      // If DeepSeek fails, use fallback
      console.error('DeepSeek API error:', llamaError);
      const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
      
      return NextResponse.json({
        success: true,
        message: fallbackResponse.message,
        isFallback: true
      });
    }

  } catch (error) {
    console.error('Error in generate-message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate message'
    }, { status: 500 });
  }
} 