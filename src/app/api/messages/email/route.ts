import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { content, subject } = await request.json();

    const user = await prisma.users.findUnique({
      where: { 
        email: session.user.email || ''
      },
      select: { 
        id: true,
        email: true,
        first_name: true,
        raw_user_meta_data: true
      }
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Save to daily_messages
    const devotional = await prisma.daily_messages.create({
      data: {
        title: subject || 'AI Generated Message',
        content: content,
        message_content: content,
        scheduled_date: new Date(),
        author_id: user.id,
        message_type: 'AI ZoeGenerated',
        delivery_status: 'PENDING',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
    });

    // Format email content with HTML
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Message from Zoe</h2>
        <p>Dear ${user.first_name || 'Friend'},</p>
        <div style="margin: 20px 0; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          ${content}
        </div>
        <p style="color: #666; font-size: 14px;">
          This message was generated by the AI Assistant
        </p>
      </div>
    `;

    // Send email
    await sendEmail(
      user.email,
      subject || 'Message from Zoe',
      emailContent
    );

    // Update status
    await prisma.daily_messages.update({
      where: { id: devotional.id },
      data: { 
        delivery_status: 'SENT',
        sent_at: new Date()
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Email sent successfully"
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 