// app/api/send-message/route.ts
// This is the route for sending a message
// It is used to send a message to a user
// Handles sending a message to a user

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMessage } from "@/lib/message";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { prayer, themeId } = await req.json();

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        phone: true,
        first_name: true
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!user.phone) {
      return NextResponse.json({ success: false, error: 'No phone number found' }, { status: 400 });
    }

    // Format the message
    const messageText = `Dear ${user.first_name || 'Friend'},\n\nHere is your generated prayer on ${themeId}:\n\n${prayer}\n\nMay this prayer bring you peace and guidance.\n\nBlessings,\nGod Messages`;

    // Send the message
    await sendMessage({
      to: user.phone,
      body: messageText
    });

    // Find and update the devotional
    const devotional = await prisma.daily_messages.findFirst({
      where: {
        author_id: user.id,
        message_content: prayer,
        message_type: 'AI Generated Prayer'

      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (devotional) {
      await prisma.daily_messages.update({
        where: { id: devotional.id },
        data: {

          delivery_status: 'SENT_SMS',
          updated_at: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    }, { status: 500 });
  }
} 