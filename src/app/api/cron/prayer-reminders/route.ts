import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendMessage } from "@/lib/message";
import { sendEmail } from "@/lib/email";

/**
 * Prayer Reminders Cron Job API Route
 * Path: /api/cron/prayer-reminders
 * 
 * This route is designed to be called by a cron job every hour to send prayer reminders
 * to users based on their preferred notification settings.
 * 
 * Database Interactions:
 * - Reads from:
 *   - users table: Gets user information and preferences
 *   - user_preferences table: Gets reminder settings and notification preferences
 * - Writes to:
 *   - daily_devotionals table: Stores generated prayers and delivery status
 * 
 * External Services:
 * - Email Service: Uses sendEmail utility for email notifications
 * - SMS Service: Uses sendMessage utility for SMS notifications
 * - AI Prayer Generation: Calls /api/generate-prayer endpoint
 * 
 * Security:
 * - Protected by CRON_SECRET environment variable
 * - Only accessible via authenticated cron job requests
 * 
 * Flow:
 * 1. Validates cron job authentication
 * 2. Gets current hour and finds users with reminders set for this time
 * 3. For each user:
 *    - Generates a personalized prayer
 *    - Saves the prayer to daily_devotionals
 *    - Sends notifications based on user preferences
 *    - Updates delivery status
 */

// This route should be called every hour by a cron job
export async function GET(req: Request) {
  try {
    // Verify cron secret to ensure this is called by the cron job
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get current hour in 24-hour format (00-23)
    const currentHour = new Date().getHours().toString().padStart(2, '0');

    // Find users who have reminders set for this hour
    const users = await prisma.user.findMany({
      where: {
        user_preferences: {
          AND: [
            {
              OR: [
                { prayer_reminder_first_time: currentHour },
                { prayer_reminder_second_time: currentHour }
              ]
            },
            {
              OR: [
                { prayer_reminder_email: true },
                { prayer_reminder_sms: true }
              ]
            }
          ]
        }
      },
      include: {
        user_preferences: true
      }
    });

    for (const user of users) {
      try {
        // Generate a prayer for this user
        const prayerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-prayer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id })
        });

        if (!prayerResponse.ok) {
          console.error(`Failed to generate prayer for user ${user.id}`);
          continue;
        }

        const { prayer } = await prayerResponse.json();

        // Save the generated prayer
        const savedPrayer = await prisma.daily_devotionals.create({
          data: {
            user_id: user.id,
            message_content: prayer,
            message_type: 'AI Generated Prayer',
            delivery_status: 'PENDING'
          }
        });

        // Send notifications based on user preferences
        if (user.user_preferences?.prayer_reminder_email && user.email) {
          const emailHtml = `<div>
            <h2>Hello ${user.first_name || 'Friend'},</h2>
            <p>Here is your daily prayer for spiritual reflection:</p>
            <blockquote style="padding: 10px; border-left: 4px solid #8646F4; margin: 20px 0;">
              ${prayer}
            </blockquote>
            <p>May this prayer guide your spiritual journey today.</p>
          </div>`;

          await sendEmail(
            user.email,
            "Your Daily Prayer Reminder",
            emailHtml
          );

          await prisma.daily_devotionals.update({
            where: { id: savedPrayer.id },
            data: { delivery_status: 'DELIVERED' }
          });
        }

        if (user.user_preferences?.prayer_reminder_sms && user.phone) {
          await sendMessage({
            to: user.phone,
            body: `Daily Prayer Reminder:\n\n${prayer}\n\nMay this prayer guide your spiritual journey today.`
          });

          await prisma.daily_devotionals.update({
            where: { id: savedPrayer.id },
            data: { delivery_status: 'DELIVERED' }
          });
        }
      } catch (error) {
        console.error(`Error processing reminder for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing prayer reminders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 