"use client";

import { Button, Card, CardBody, CardHeader, Checkbox, Select, SelectItem } from "@heroui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { appApiUrl } from "@/lib/journal";
import { heroSelectClassNames, heroSelectPopoverProps } from "@/lib/utils";

/**
 * Interface for user preferences from the database
 * Reminder timing lives on notification_preferences JSON.
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

const HOUR_OPTIONS = [1, 2, 4, 6, 12, 24, 48];
const DAY_OPTIONS = [1, 2, 3, 4, 5, 7];

const checkboxClassNames = {
  base: "max-w-fit items-center gap-2",
  wrapper:
    "h-5 w-5 min-w-5 max-w-5 overflow-hidden rounded-[4px] border-2 border-gray-400 bg-transparent after:bg-black dark:border-white/50 dark:after:bg-white",
  icon: "h-3 w-3 text-white dark:text-black",
  label: "text-sm text-black dark:text-white",
};

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
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(appApiUrl("/api/user/preferences"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: {
            date_reminder_preferences: {
              reminder_before_date: beforeDateEnabled,
              reminder_after_date: afterDateEnabled,
              reminder_before_hours: beforeHours,
              reminder_after_hours: afterHours,
              feedback_reminder_days: feedbackDays,
            },
            feedback_preferences: {
              allow_anonymous_feedback: allowAnonymous,
              require_feedback: requireFeedback,
              feedback_categories: [
                "communication",
                "respect",
                "compatibility",
                "chemistry",
                "overall",
              ],
            },
            notification_preferences: {
              date_reminders: beforeDateEnabled || afterDateEnabled,
              feedback_reminders: true,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast.success("Reminder preferences updated");
      router.refresh();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl overflow-visible border border-gray-200 bg-gray-50 text-black dark:border-white/10 dark:bg-dark-6 dark:text-white">
      <CardHeader className="flex-col items-start gap-1 px-4 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">Journal reminder settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure check-ins, habit reminders, and follow-up prompts. Quiet hours and frequency stay under your control.
        </p>
      </CardHeader>
      <CardBody className="space-y-6 overflow-visible px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-black dark:text-white">Before check-in reminder</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ping you before a planned journal session</p>
          </div>
          <Checkbox
            isSelected={beforeDateEnabled}
            onValueChange={setBeforeDateEnabled}
            classNames={checkboxClassNames}
          >
            {beforeDateEnabled ? "Enabled" : "Disabled"}
          </Checkbox>
        </div>

        {beforeDateEnabled && (
          <Select
            label="Hours before"
            selectedKeys={[String(beforeHours)]}
            onChange={(event) => {
              if (event.target.value) setBeforeHours(Number(event.target.value));
            }}
            aria-label="Hours before"
            classNames={heroSelectClassNames}
            popoverProps={heroSelectPopoverProps}
          >
            {HOUR_OPTIONS.map((hours) => (
              <SelectItem key={String(hours)}>{hours} hours</SelectItem>
            ))}
          </Select>
        )}

        <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-black dark:text-white">After check-in reminder</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Follow up after you said you would write</p>
          </div>
          <Checkbox
            isSelected={afterDateEnabled}
            onValueChange={setAfterDateEnabled}
            classNames={checkboxClassNames}
          >
            {afterDateEnabled ? "Enabled" : "Disabled"}
          </Checkbox>
        </div>

        {afterDateEnabled && (
          <Select
            label="Hours after"
            selectedKeys={[String(afterHours)]}
            onChange={(event) => {
              if (event.target.value) setAfterHours(Number(event.target.value));
            }}
            aria-label="Hours after"
            classNames={heroSelectClassNames}
            popoverProps={heroSelectPopoverProps}
          >
            {HOUR_OPTIONS.map((hours) => (
              <SelectItem key={String(hours)}>{hours} hours</SelectItem>
            ))}
          </Select>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Follow-up settings</h3>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-black dark:text-white">Require a follow-up note</p>
            <Checkbox
              isSelected={requireFeedback}
              onValueChange={setRequireFeedback}
              classNames={checkboxClassNames}
            >
              {requireFeedback ? "Required" : "Optional"}
            </Checkbox>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-black dark:text-white">Allow anonymous follow-up</p>
            <Checkbox
              isSelected={allowAnonymous}
              onValueChange={setAllowAnonymous}
              classNames={checkboxClassNames}
            >
              {allowAnonymous ? "Allowed" : "Not allowed"}
            </Checkbox>
          </div>

          <Select
            label="Days until follow-up reminder"
            selectedKeys={[String(feedbackDays)]}
            onChange={(event) => {
              if (event.target.value) setFeedbackDays(Number(event.target.value));
            }}
            aria-label="Days until follow-up"
            classNames={heroSelectClassNames}
            popoverProps={heroSelectPopoverProps}
          >
            {DAY_OPTIONS.map((days) => (
              <SelectItem key={String(days)}>{days} days</SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            className="bg-gray-900 text-white dark:bg-white/15 dark:text-white"
            onPress={handleSave}
            isLoading={isSaving}
          >
            Save Preferences
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
