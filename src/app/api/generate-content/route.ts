import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { checkUserUsage, incrementUsage } from "@/lib/userUsage";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { prompt, apiKey } = body;

  // If user is not logged in and no API key provided, return error
  if (!session?.user?.email && !apiKey) {
    return new Response(
      JSON.stringify({ error: "Please log in or provide an API key" }),
      { status: 401 }
    );
  }

  // If user is logged in, check their usage
  if (session?.user?.email) {
    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (user) {
      const usage = await checkUserUsage(user.id);
      if (!usage.canUse && !apiKey) {
        return new Response(
          JSON.stringify({ 
            error: `Daily limit reached. You have used ${usage.total - usage.remaining}/${usage.total} requests. 
            Upgrade your plan or use your own API key to continue.`
          }),
          { status: 429 }
        );
      }
    }
  }

  // Use provided API key or fall back to environment variable
  const openai = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: prompt,
      model: "gpt-3.5-turbo",
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const generatedContent = chatCompletion.choices[0].message?.content;

    // If using our API key, increment usage
    if (!apiKey && session?.user?.email) {
      await incrementUsage(session.user.email);
    }

    return new Response(JSON.stringify(generatedContent));
  } catch (error: any) {
    return new Response(JSON.stringify(error.error.message), { status: 500 });
  }
}
