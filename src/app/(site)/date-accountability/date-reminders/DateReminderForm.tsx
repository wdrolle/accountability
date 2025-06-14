// FILE: src/app/(site)/prayer-guidance/prayer-remainder/PrayerReminderForm.tsx

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

interface DateReminderFormProps {
  userPreferences: UserPreferences | null;
}

export default function DateReminderForm({ userPreferences }: DateReminderFormProps) {
  const [beforeDateEnabled, setBeforeDateEnabled] = useState(
    userPreferences?.date_reminder_preferences?.reminder_before_date ?? true
  );
  const [afterDateEnabled, setAfterDateEnabled] = useState(
    userPreferences?.date_reminder_preferences?.reminder_after_date ?? true
  );
  const [beforeHours, setBeforeHours] = useState(
    userPreferences?.date_reminder_preferences?.reminder_before_hours ?? 24
  );
  const [afterHours, setAfterHours] = useState(
    userPreferences?.date_reminder_preferences?.reminder_after_hours ?? 24
  );
  const [feedbackDays, setFeedbackDays] = useState(
    userPreferences?.date_reminder_preferences?.feedback_reminder_days ?? 1
  );
  const [requireFeedback, setRequireFeedback] = useState(
    userPreferences?.feedback_preferences?.require_feedback ?? true
  );
  const [allowAnonymous, setAllowAnonymous] = useState(
    userPreferences?.feedback_preferences?.allow_anonymous_feedback ?? false
  );

  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: {
            date_reminder_preferences: {
              reminder_before_date: beforeDateEnabled,
              reminder_after_date: afterDateEnabled,
              reminder_before_hours: beforeHours,
              reminder_after_hours: afterHours,
              feedback_reminder_days: feedbackDays
            },
            feedback_preferences: {
              allow_anonymous_feedback: allowAnonymous,
              require_feedback: requireFeedback,
              feedback_categories: [
                "communication",
                "respect",
                "compatibility",
                "chemistry",
                "overall"
              ]
            },
            notification_preferences: {
              date_reminders: beforeDateEnabled || afterDateEnabled,
              feedback_reminders: true
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast({
        title: "Success",
        description: "Date reminder preferences updated successfully",
      });
      
      router.refresh();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Date Reminder Settings</CardTitle>
          <CardDescription>
            Configure when you want to receive reminders about your dates and feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Before Date Reminder</Label>
              <Button
                variant="outline"
                onClick={() => setBeforeDateEnabled(!beforeDateEnabled)}
              >
                {beforeDateEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            {beforeDateEnabled && (
              <div className="ml-4">
                <Label>Hours before date</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {beforeHours} hours <ChevronDown className="ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[1, 2, 4, 6, 12, 24, 48].map((hours) => (
                      <DropdownMenuItem
                        key={hours}
                        onClick={() => setBeforeHours(hours)}
                      >
                        {hours} hours
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Divider />

            <div className="flex items-center justify-between">
              <Label>After Date Reminder</Label>
              <Button
                variant="outline"
                onClick={() => setAfterDateEnabled(!afterDateEnabled)}
              >
                {afterDateEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {afterDateEnabled && (
              <div className="ml-4">
                <Label>Hours after date</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {afterHours} hours <ChevronDown className="ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[1, 2, 4, 6, 12, 24, 48].map((hours) => (
                      <DropdownMenuItem
                        key={hours}
                        onClick={() => setAfterHours(hours)}
                      >
                        {hours} hours
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Divider />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Feedback Settings</Label>
              </div>
              
              <div className="ml-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Require Feedback</Label>
                  <Button
                    variant="outline"
                    onClick={() => setRequireFeedback(!requireFeedback)}
                  >
                    {requireFeedback ? "Required" : "Optional"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Allow Anonymous Feedback</Label>
                  <Button
                    variant="outline"
                    onClick={() => setAllowAnonymous(!allowAnonymous)}
                  >
                    {allowAnonymous ? "Allowed" : "Not Allowed"}
                  </Button>
                </div>

                <div>
                  <Label>Days until feedback reminder</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        {feedbackDays} days <ChevronDown className="ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {[1, 2, 3, 4, 5, 7].map((days) => (
                        <DropdownMenuItem
                          key={days}
                          onClick={() => setFeedbackDays(days)}
                        >
                          {days} days
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </ThemeProvider>
  );
}
