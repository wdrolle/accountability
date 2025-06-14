/**
 * Date Reminder Settings Page
 * Path: /date-accountability/date-reminders
 * 
 * This page allows users to configure their date reminder preferences,
 * including notification methods and timing.
 * 
 * Components:
 * - Breadcrumb: Navigation breadcrumb
 * - DateReminderForm: Main form component for reminder settings
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
 * Props passed to DateReminderForm:
 * - userPreferences: Current user preference settings
 * - lastUpdated: Timestamp of last settings update
 * - userTimezone: User's timezone (defaults to America/New_York)
 * 
 * Form Functionality:
 * - Allows setting notification preferences (email/SMS)
 * - Configures reminder frequency (before/after dates)
 * - Sets specific reminder times
 * - Displays last update timestamp
 * 
 * Note: The actual form implementation is in DateReminderForm.tsx
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DateReminderForm from "./DateReminderForm";
import Breadcrumb from "@/components/Breadcrumb";

interface UserPreferences {
  id: string;
  user_id: string;
  date_reminder_preferences: {
    reminder_before_date: boolean;
    reminder_after_date: boolean;
    reminder_before_hours: number;
    reminder_after_hours: number;
    feedback_reminder_days: number;
  };
  feedback_preferences: {
    allow_anonymous_feedback: boolean;
    require_feedback: boolean;
    feedback_categories: string[];
  };
  notification_preferences: {
    date_reminders: boolean;
    feedback_reminders: boolean;
  };
}

export default async function DateReminderPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      user_preferences: true,
    },
  });

  if (!user) {
    return null;
  }

  // Transform the user preferences to match the expected type
  const transformedPreferences: UserPreferences | null = user.user_preferences ? {
    id: user.user_preferences.id,
    user_id: user.user_preferences.user_id,
    date_reminder_preferences: (user.user_preferences as any).date_reminder_preferences || {
      reminder_before_date: false,
      reminder_after_date: false,
      reminder_before_hours: 24,
      reminder_after_hours: 24,
      feedback_reminder_days: 1
    },
    feedback_preferences: (user.user_preferences as any).feedback_preferences || {
      allow_anonymous_feedback: false,
      require_feedback: false,
      feedback_categories: []
    },
    notification_preferences: (user.user_preferences as any).notification_preferences || {
      date_reminders: true,
      feedback_reminders: true
    }
  } : null;

  return (
    <>
      <Breadcrumb pageTitle="Date Reminder Settings" />
      <div className="container mx-auto py-10">
        <DateReminderForm userPreferences={transformedPreferences} />
      </div>
    </>
  );
} 