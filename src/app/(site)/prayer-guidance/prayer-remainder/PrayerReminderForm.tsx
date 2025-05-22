"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Button from "@/components/CustomButtons/Button";
import { Button as BaseButton } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { Divider } from "@/components/ui/divider";
import { toast, Toaster } from "sonner";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

/**
 * Interface for user preferences from the database
 * Matches the schema of the user_preferences table
 */
interface UserPreferences {
  prayer_reminder_email: boolean;
  prayer_reminder_sms: boolean;
  prayer_reminder_frequency: number;
  prayer_reminder_first_time: string | null;
  prayer_reminder_second_time: string | null;
}

/**
 * Props interface for the PrayerReminderForm component
 */
interface PrayerReminderFormProps {
  userPreferences: UserPreferences | null;
  lastUpdated: string | null;
  userTimezone: string;
}

export function PrayerReminderForm({ userPreferences, lastUpdated, userTimezone }: PrayerReminderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize notification method state based on user preferences
  const [notificationMethod, setNotificationMethod] = useState<string>(
    userPreferences?.prayer_reminder_email && userPreferences?.prayer_reminder_sms ? "Both Email & SMS" :
    userPreferences?.prayer_reminder_email ? "Email Notifications" : 
    userPreferences?.prayer_reminder_sms ? "SMS Notifications" : 
    "Select method"
  );

  // Initialize frequency state based on user preferences
  const [frequency, setFrequency] = useState<string>(
    userPreferences?.prayer_reminder_frequency === 2 ? "Twice per day" : "Once per day"
  );

  /**
   * Generates options for hour selection (01-12)
   * Used in time picker dropdowns
   */
  const generateHourOptions = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString().padStart(2, '0'),
      label: (i + 1).toString().padStart(2, '0')
    }));
  };

  /**
   * Generates options for minute selection (00-59)
   * Used in time picker dropdowns
   */
  const generateMinuteOptions = () => {
    return Array.from({ length: 60 }, (_, i) => ({
      value: i.toString().padStart(2, '0'),
      label: i.toString().padStart(2, '0')
    }));
  };

  /**
   * Converts 12-hour format to 24-hour format
   * 
   * @param hour - Hour in 12-hour format
   * @param ampm - "AM" or "PM"
   * @returns Hour in 24-hour format
   */
  const convertTo24Hour = (hour: string, ampm: string): number => {
    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h;
  };

  /**
   * Formats the time for submission
   * 
   * @param hour - Hour in 12-hour format
   * @param minute - Minutes
   * @param ampm - "AM" or "PM"
   * @returns Formatted time string "HH:MM"
   */
  const formatTimeForSubmissionCustom = (hour: string, minute: string, ampm: string): string => {
    const hour24 = convertTo24Hour(hour, ampm);
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  /**
   * Handles form submission
   * Validates input and sends data to the API
   * Shows success/error notifications
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const firstReminder = formatTimeForSubmissionCustom(firstTimeHour, firstTimeMinute, firstTimeAmPm);
      const secondReminder = frequency === "Twice per day" 
        ? formatTimeForSubmissionCustom(secondTimeHour, secondTimeMinute, secondTimeAmPm) 
        : undefined;

      const data = {
        notification_method: notificationMethod === "Both Email & SMS" ? "both" :
                           notificationMethod === "Email Notifications" ? "email" :
                           notificationMethod === "SMS Notifications" ? "sms" : "",
        frequency: frequency === "Twice per day" ? 2 : 1,
        first_reminder: firstReminder,
        second_reminder: secondReminder
      };

      // Validate required fields
      if (!data.notification_method || !data.first_reminder || (data.frequency === 2 && !data.second_reminder)) {
        toast.error("Please fill in all required fields.");
        return;
      }

      // Submit to API
      const response = await fetch('/api/prayer-remainder/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save preferences');
      }

      // Show success message
      toast.success("Your prayer reminder preferences have been saved.");

      router.refresh();
    } catch (error) {
      // console.error("Form submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitialTime = (timeStr: string | null | undefined) => {
    // console.log('Raw value from backend:', timeStr);
    
    if (!timeStr) {
      return { hour: '01', minute: '00', ampm: 'AM' };
    }

    // Extract hours and minutes from the ISO string
    // The backend sends time in format "2024-01-11T09:00:00.000Z"
    const match = timeStr.match(/T(\d{2}):(\d{2})/);
    if (!match) {
      // console.error('Invalid time format:', timeStr);
      return { hour: '01', minute: '00', ampm: 'AM' };
    }

    const [_, hours, minutes] = match;
    const hour24 = parseInt(hours, 10);

    // Convert 24-hour to 12-hour format
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';

    const result = {
      hour: hour12.toString().padStart(2, '0'),
      minute: minutes.padStart(2, '0'),
      ampm
    };

    // console.log('Converted time:', result);
    return result;
  };

  // Initialize time state for first reminder
  // console.log('Backend first time:', userPreferences?.prayer_reminder_first_time);
  const initialFirstTime = getInitialTime(userPreferences?.prayer_reminder_first_time);
  const [firstTimeHour, setFirstTimeHour] = useState(initialFirstTime.hour);
  const [firstTimeMinute, setFirstTimeMinute] = useState(initialFirstTime.minute);
  const [firstTimeAmPm, setFirstTimeAmPm] = useState(initialFirstTime.ampm);

  // Initialize time state for second reminder
  // console.log('Backend second time:', userPreferences?.prayer_reminder_second_time);
  const initialSecondTime = getInitialTime(userPreferences?.prayer_reminder_second_time);
  const [secondTimeHour, setSecondTimeHour] = useState(initialSecondTime.hour);
  const [secondTimeMinute, setSecondTimeMinute] = useState(initialSecondTime.minute);
  const [secondTimeAmPm, setSecondTimeAmPm] = useState(initialSecondTime.ampm);

  // console.log('Final time values:', {
  //   first: {
  //     backend: userPreferences?.prayer_reminder_first_time,
  //     parsed: initialFirstTime,
  //     display: `${firstTimeHour}:${firstTimeMinute} ${firstTimeAmPm}`
  //   },
  //   second: {
  //     backend: userPreferences?.prayer_reminder_second_time,
  //     parsed: initialSecondTime,
  //     display: `${secondTimeHour}:${secondTimeMinute} ${secondTimeAmPm}`
  //   }
  // });

  return (
    <div className="container mx-auto py-10">
      <Toaster richColors position="top-center" />
      <Card className="light:bg-white dark:bg-dark">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Prayer Reminder Settings</CardTitle>
          <Divider className="space-x-4" />
          <CardDescription>
            <span className="text-gray-600 dark:text-gray-300 pt-4">
              Configure your daily prayer reminders and receive AI-generated prayers for spiritual guidance.
            </span>
            {lastUpdated && (
              <span className="block mt-2 text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Label className="text-gray-900 dark:text-white font-medium min-w-[160px]">Notification Method:</Label>
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <BaseButton variant="outline" className="w-[180px] bg-white dark:bg-dark-6 border-gray-200 dark:border-dark-4 text-gray-900 dark:text-white">
                          {notificationMethod}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </BaseButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[180px] bg-white dark:bg-dark-6 border dark:border-dark-4">
                        <DropdownMenuItem 
                          className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-7 focus:bg-gray-100 dark:focus:bg-dark-7"
                          onClick={() => setNotificationMethod("Email Notifications")}
                        >
                          Email Notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-7 focus:bg-gray-100 dark:focus:bg-dark-7"
                          onClick={() => setNotificationMethod("SMS Notifications")}
                        >
                          SMS Notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-7 focus:bg-gray-100 dark:focus:bg-dark-7"
                          onClick={() => setNotificationMethod("Both Email & SMS")}
                        >
                          Both Email & SMS
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-[160px]">Choose how you want to receive your daily prayer reminders - via email, SMS, or both.</p>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Label className="text-gray-900 dark:text-white font-medium min-w-[160px]">Reminder Frequency:</Label>
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <BaseButton variant="outline" className="w-[160px] bg-white dark:bg-dark-6 border-gray-200 dark:border-dark-4 text-gray-900 dark:text-white">
                          {frequency}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </BaseButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[140px] bg-white dark:bg-dark-6 border dark:border-dark-4">
                        <DropdownMenuItem 
                          className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-7 focus:bg-gray-100 dark:focus:bg-dark-7"
                          onClick={() => setFrequency("Once per day")}
                        >
                          Once per day
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-7 focus:bg-gray-100 dark:focus:bg-dark-7"
                          onClick={() => setFrequency("Twice per day")}
                        >
                          Twice per day
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-[160px]">Select how often you'd like to receive prayer reminders throughout the day.</p>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Label className="text-gray-900 dark:text-white font-medium min-w-[160px]">First Time:</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-2">
                      {/* Hour Select */}
                      <select
                        value={firstTimeHour}
                        onChange={(e) => setFirstTimeHour(e.target.value)}
                        className="border rounded px-5 py-1 pl-1 dark:bg-dark-6 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer"
                        required
                      >
                        {generateHourOptions().map(option => (
                          <option key={option.value} value={option.value} className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">{option.label}</option>
                        ))}
                      </select>
                      {/* Minute Select */}
                      <select
                        value={firstTimeMinute}
                        onChange={(e) => setFirstTimeMinute(e.target.value)}
                        className="border rounded px-5 py-1 pl-1 dark:bg-dark-6 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer"
                        required
                      >
                        {generateMinuteOptions().map(option => (
                          <option key={option.value} value={option.value} className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">{option.label}</option>
                        ))}
                      </select>
                      {/* AM/PM Select */}
                      <select
                        value={firstTimeAmPm}
                        onChange={(e) => setFirstTimeAmPm(e.target.value)}
                        className="border rounded px-5 py-1 pl-1 dark:bg-dark-6 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer"
                        required
                      >
                        <option value="AM" className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">AM</option>
                        <option value="PM" className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">PM</option>
                      </select>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({userTimezone})
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-[160px]">Set the time for your first daily prayer reminder to help start your day with spiritual reflection.</p>
              </div>

              {frequency === "Twice per day" && (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <Label className="text-gray-900 dark:text-white font-medium min-w-[160px]">Second Time:</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex space-x-2">
                        {/* Hour Select */}
                        <select
                          value={secondTimeHour}
                          onChange={(e) => setSecondTimeHour(e.target.value)}
                          className="border rounded px-5 py-1 pl-1 dark:bg-dark-6 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer"
                          required
                        >
                          {generateHourOptions().map(option => (
                            <option key={option.value} value={option.value} className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">{option.label}</option>
                          ))}
                        </select>
                        {/* Minute Select */}
                        <select
                          value={secondTimeMinute}
                          onChange={(e) => setSecondTimeMinute(e.target.value)}
                          className="border rounded px-5 py-1 pl-1 dark:bg-dark-6 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer"
                          required
                        >
                          {generateMinuteOptions().map(option => (
                            <option key={option.value} value={option.value} className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">{option.label}</option>
                          ))}
                        </select>
                        {/* AM/PM Select */}
                        <select
                          value={secondTimeAmPm}
                          onChange={(e) => setSecondTimeAmPm(e.target.value)}
                          className="border rounded px-5 py-1 pl-1 dark:bg-dark-6 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer"
                          required
                        >
                          <option value="AM" className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">AM</option>
                          <option value="PM" className="hover:bg-gray-100 dark:hover:bg-dark-7 cursor-pointer">PM</option>
                        </select>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({userTimezone})
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 ml-[160px]">Choose when to receive your second daily prayer reminder to end your day in prayer and reflection.</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  color="primary" 
                  className="light:text-white dark:text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
