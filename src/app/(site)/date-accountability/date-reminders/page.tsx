/**
 * Date Reminder Settings Page
 * Path: /journal/date-reminders
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

function reminderPrefsFromStored(stored: Record<string, unknown> | null): UserPreferences | null {
  if (!stored) return null;

  const notification = (stored.notification_preferences as Record<string, unknown>) || {};
  const dateReminder =
    (notification.date_reminder_preferences as UserPreferences["date_reminder_preferences"]) ||
    (stored.date_reminder_preferences as UserPreferences["date_reminder_preferences"]) || {
      reminder_before_date: false,
      reminder_after_date: false,
      reminder_before_hours: 24,
      reminder_after_hours: 24,
      feedback_reminder_days: 1,
    };
  const feedback =
    (notification.feedback_preferences as UserPreferences["feedback_preferences"]) ||
    (stored.feedback_preferences as UserPreferences["feedback_preferences"]) || {
      allow_anonymous_feedback: false,
      require_feedback: false,
      feedback_categories: [],
    };

  return {
    id: String(stored.id),
    user_id: String(stored.user_id),
    date_reminder_preferences: dateReminder,
    feedback_preferences: feedback,
    notification_preferences: {
      date_reminders: Boolean(notification.date_reminders ?? true),
      feedback_reminders: Boolean(notification.feedback_reminders ?? true),
    },
  };
}

export default async function DateReminderPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <>
        <Breadcrumb pageTitle="Reminder Settings" />
        <div className="container mx-auto flex min-h-[40vh] items-center justify-center px-4 py-10 text-center">
          <p className="text-xl text-black dark:text-white">Please log in to view reminder settings</p>
        </div>
      </>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      user_preferences: true,
    },
  });

  if (!user) {
    return (
      <>
        <Breadcrumb pageTitle="Reminder Settings" />
        <div className="container mx-auto flex min-h-[40vh] items-center justify-center px-4 py-10 text-center">
          <p className="text-xl text-black dark:text-white">Account not found</p>
        </div>
      </>
    );
  }

  const transformedPreferences = reminderPrefsFromStored(
    user.user_preferences as unknown as Record<string, unknown> | null
  );

  return (
    <>
      <Breadcrumb pageTitle="Reminder Settings" />
      <div className="container mx-auto px-4 py-6 sm:py-10">
        <DateReminderForm userPreferences={transformedPreferences} />
      </div>
    </>
  );
} 