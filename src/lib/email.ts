// src/lib/email.ts

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  console.log('Sending email with:', { to, subject });
  
  try {
    // Try Resend first
    if (process.env.RESEND_API_KEY) {
      try {
        const result = await resend.emails.send({
          from: 'CStudios <info@email.2920.ai>',
          to,
          subject,
          html,
        });
        console.log('Resend result:', result);
        return { success: true, data: result };
      } catch (resendError) {
        console.error('Resend error:', resendError);
        // Fall through to nodemailer
      }
    }
    
    // Fallback to nodemailer
    try {
      const result = await transporter.sendMail({
        from: 'CStudios <info@email.2920.ai>',
        to,
        subject,
        html,
      });
      console.log('Nodemailer result:', result);
      return { success: true, data: result };
    } catch (emailError) {
      console.error('Nodemailer error:', emailError);
      return { 
        success: false, 
        error: emailError instanceof Error ? emailError.message : 'Failed to send email'
      };
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

export function getVerificationEmailHtml(name: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
  const currentYear = new Date().getFullYear();
  
  return `
    <div style="font-family: Arial, sans-serif; padding: 10px; max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; border: 1px solid #e5e7eb;">
      <header style="padding: 2rem; text-align: center; border-bottom: 2px solid #4F46E5;">
        <img src="https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/email_logo/agents.png" alt="CStudios Logo" style="height: 40px; margin: 0 auto;">
      </header>

      <main style="padding: 2rem;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; margin-bottom: 0.5rem;">
            Welcome to CStudios, ${name}!
          </h1>
          <div style="width: 80px; height: 3px; background-color: #4F46E5; margin: 0.5rem auto;"></div>
        </div>

        <div style="color: #4b5563; margin: 1.5rem 0; line-height: 1.6;">
          <p>We're excited to have you join our community! To get started, please verify your email address by clicking the button below:</p>
        </div>

        <div style="text-align: center; margin: 2rem 0;">
          <a href="${verifyUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 32px; 
                    text-decoration: none; border-radius: 6px; font-weight: 600;
                    display: inline-block; transition: background-color 0.3s ease;">
            Verify Email Address
          </a>
        </div>

        <div style="color: #6b7280; font-size: 14px; margin-top: 2rem;">
          <p>If you didn't create an account with CStudios, you can safely ignore this email.</p>
          <p>For security reasons, this verification link will expire in 24 hours.</p>
        </div>
      </main>

      <footer style="background-color: #f3f4f6; padding: 2rem; text-align: center; border-radius: 0 0 8px 8px;">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="color: #4F46E5; font-size: 18px; font-weight: 600; margin-bottom: 0.5rem;">
            Need Help?
          </h2>
          <p style="color: #6b7280; margin: 0;">
            Contact our support team at
            <a href="mailto:support@2920.ai" style="color: #4F46E5; text-decoration: none;">
              support@2920.ai
            </a>
          </p>
        </div>

        <div style="color: #9ca3af; font-size: 12px; margin-top: 1.5rem;">
          <p>© ${currentYear} CStudios. All Rights Reserved.</p>
          <p>
            <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #4F46E5; text-decoration: none; margin: 0 0.5rem;">Privacy Policy</a> |
            <a href="${process.env.NEXTAUTH_URL}/terms" style="color: #4F46E5; text-decoration: none; margin: 0 0.5rem;">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  `;
}

export function getResetPasswordEmailHtml(token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  return `
    <div>
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
    </div>
  `;
}

export async function sendFamilyInvitationEmail(
  to: string,
  inviterName: string,
  inviteUrl: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 10px;">
      <h1>You've been invited to join a family subscription!</h1>
      <p>${inviterName} has invited you to join their family subscription.</p>
      <p>Click the link below to accept the invitation and create your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" target="_blank" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Accept Invitation
        </a>
      </div>
      <p>This invitation will expire in 7 days.</p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const result = await resend.emails.send({
      from: 'info@email.2920.ai',
      to,
      subject: 'Family Subscription Invitation',
      html,
    });
    console.log('Family invitation email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send family invitation email:', error);
    throw error;
  }
}

export async function assistantGeneratedResponse({
  to,
  response,
  topic,
  firstName
}: {
  to: string;
  response: string;
  topic: string;
  firstName: string;
}) {
  try {
    console.log('Sending assistant response email to:', to);
    
    const data = {
      from: 'CStudios <info@email.2920.ai>',
      to,
      subject: `Your AI Assistant Response: ${topic}`,
      text: `Hi ${firstName},\n\nHere is your AI assistant's response regarding ${topic}:\n\n${response}\n\nBest regards,\nCStudios AI Assistant`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hi ${firstName},</h2>
          <p>Here is your AI assistant's response regarding ${topic}:</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-wrap; line-height: 1.6;">${response}</p>
          </div>
          <div style="margin-top: 20px;">
            <p>Need more help? Just reply to this email or ask another question in the app.</p>
          </div>
          <p>Best regards,<br>CStudios AI Assistant</p>
        </div>
      `
    };

    const emailResponse = await resend.emails.send(data);
    console.log('Email sent successfully:', emailResponse);
    return emailResponse;
  } catch (error) {
    console.error('Error sending assistant response email:', error);
    throw error;
  }
}

export async function sendCalendarInviteEmail({
  to,
  calendarType,
  meetingName,
  startTime,
  duration,
  joinUrl,
}: {
  to: string;
  calendarType: string;
  meetingName: string;
  startTime: string;
  duration: number;
  joinUrl: string;
}) {
  const calendarNames = {
    google: 'Google Calendar',
    outlook: 'Outlook Calendar',
    ical: 'Apple Calendar'
  };

  const calendarName = calendarNames[calendarType as keyof typeof calendarNames];
  const formattedDate = new Date(startTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">agents Study Meeting Calendar Invite</h2>
      <p>Your calendar invite for ${meetingName} has been sent to your ${calendarName}.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Meeting Details</h3>
        <p><strong>Date & Time:</strong> ${formattedDate}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Join URL:</strong> <a href="${joinUrl}" style="color: #4F46E5;">${joinUrl}</a></p>
      </div>

      <p>The meeting has been added to your calendar. You'll receive a reminder before the meeting starts.</p>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If you don't see the calendar invite, please check your spam folder or try adding it manually.
        </p>
      </div>
    </div>
  `;

  return sendEmail(
    to,
    `Calendar Invite: ${meetingName}`,
    html
  );
}