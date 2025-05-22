// This is the route for sending a prayer
// It is used to send a prayer to a user
// Handles sending a prayer
// Gets the user's ID from the database
// Saves the prayer to daily_devotionals with:
//  message_type: 'AI Generated Prayer'
//  delivery_status: 'SENT_EMAIL'.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assistantGeneratedResponse } from "@/lib/email";
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
        email: true,
        first_name: true
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ success: false, error: 'No email address found for user' }, { status: 400 });
    }

    try {
      // Send email
      await assistantGeneratedResponse({
        to: user.email,
        response: prayer,
        topic: themeId,
        firstName: user.first_name || 'Friend'
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
            delivery_status: 'SENT_EMAIL',
            updated_at: new Date()
          }
        });
      }

      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json({
        success: false,
        error: emailError instanceof Error ? emailError.message : 'Failed to send email'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-prayer:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 500 });
  }
} 