import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/components/email/EmailTemplate';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const faviconUrl = `${baseUrl}/images/favicon.ico`;

    // Create email content with favicon and design
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${faviconUrl}" alt="CStudios" style="width: 50px; height: 50px;" />
        </div>
        <div style="background: linear-gradient(to right, rgba(107, 70, 193, 0.2), rgba(74, 29, 150, 0.2)); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Message:</strong></p>
          <p style="line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="color: #a0aec0; font-size: 14px;">CStudios - Connecting through Faith</p>
        </div>
      </div>
    `;

    // Send email to info@email.2920.ai
    const emailResult = await sendEmail(
      'info@email.2920.ai',
      `New Contact Form Message: ${subject}`,
      emailContent
    );

    if (!emailResult.success) {
      console.error('Failed to send contact form email');
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Send notification email to whitney@iolence.com
    const notificationContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${faviconUrl}" alt="CStudios" style="width: 50px; height: 50px;" />
        </div>
        <div style="background: linear-gradient(to right, rgba(107, 70, 193, 0.2), rgba(74, 29, 150, 0.2)); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #ffffff;">New Contact Form Submission</h2>
        </div>
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="color: #a0aec0; font-size: 14px;">CStudios - Contact Form Notification</p>
        </div>
      </div>
    `;

    const notificationResult = await sendEmail(
      'whitney@iolence.com',
      `Contact Form Notification: ${subject}`,
      notificationContent
    );

    if (!notificationResult.success) {
      console.error('Failed to send notification email');
    }

    // Send confirmation email to the sender
    const confirmationContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${faviconUrl}" alt="CStudios" style="width: 50px; height: 50px;" />
        </div>
        <div style="background: linear-gradient(to right, rgba(107, 70, 193, 0.2), rgba(74, 29, 150, 0.2)); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #ffffff;">Thank You for Contacting Us</h2>
        </div>
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to us. We have received your message and will respond as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <p style="line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="color: #a0aec0; font-size: 14px;">CStudios - Connecting through Faith</p>
        </div>
      </div>
    `;

    const confirmationResult = await sendEmail(
      email,
      'We received your message - CStudios',
      confirmationContent
    );

    if (!confirmationResult.success) {
      console.error('Failed to send confirmation email');
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 