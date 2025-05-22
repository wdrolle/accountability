import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Get user from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { verse_id, note, recipients, verse_reference, sender_name } = await request.json();

    if (!verse_id || !note || !recipients || !verse_reference) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Send email to each recipient
    const emailPromises = recipients.map(async (recipient: string) => {
      try {
        await resend.emails.send({
          from: 'CStudios <info.email@2920.ai>',
          to: recipient,
          subject: `${sender_name} shared a agents verse note with you`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New agents Verse Note Shared</h2>
              <p style="color: #666;">Hi there,</p>
              <p style="color: #666;">${sender_name} has shared a note about ${verse_reference} with you:</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #333; margin: 0;">"${note}"</p>
              </div>
              <p style="color: #666;">You can view this note and more by logging into your CStudios account.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                <p>This email was sent from CStudios. If you don't want to receive these emails, you can update your notification settings in your account.</p>
              </div>
            </div>
          `,
        });
      } catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);
        throw error;
      }
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
} 