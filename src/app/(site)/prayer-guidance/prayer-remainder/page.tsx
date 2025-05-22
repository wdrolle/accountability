/**
 * Prayer Reminder Settings Page
 * Path: /prayer-guidance/prayer-remainder
 * 
 * This page allows users to configure their prayer reminder preferences,
 * including notification methods and timing.
 * 
 * Components:
 * - Breadcrumb: Navigation breadcrumb
 * - PrayerReminderForm: Main form component for reminder settings
 * 
 * Authentication:
 * - Fully protected (requires login)
 * - Redirects to login page if not authenticated
 * 
 * Database Interactions:
 * - Reads from:
 *   - users table: Gets user timezone and email
 *   - user_preferences table: Gets existing reminder settings
 * 
 * Props passed to PrayerReminderForm:
 * - userPreferences: Current user preference settings
 * - lastUpdated: Timestamp of last settings update
 * - userTimezone: User's timezone (defaults to America/New_York)
 * 
 * Form Functionality:
 * - Allows setting notification preferences (email/SMS)
 * - Configures reminder frequency (once/twice daily)
 * - Sets specific reminder times
 * - Displays last update timestamp
 * 
 * Note: The actual form implementation is in PrayerReminderForm.tsx
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PrayerReminderForm } from "./PrayerReminderForm";
import Breadcrumb from "@/components/Breadcrumb";

export default async function PrayerRemainderPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      user_preferences: true
    }
  });

  const lastUpdated = user?.user_preferences?.updated_at ? new Date(user.user_preferences.updated_at).toLocaleString() : null;

  return (
    <>
      <Breadcrumb pageTitle="Prayer Reminder Settings" />
      <div>
        <PrayerReminderForm 
          userPreferences={user?.user_preferences ? {
            ...user.user_preferences,
            prayer_reminder_first_time: user.user_preferences.prayer_reminder_first_time.toISOString(),
            prayer_reminder_second_time: user.user_preferences.prayer_reminder_second_time.toISOString()
          } : null}
          lastUpdated={lastUpdated}
          userTimezone={user?.timezone || "America/New_York"}
        />
      </div>
    </>
  );
} 