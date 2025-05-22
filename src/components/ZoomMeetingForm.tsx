import React, { useState, useEffect } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import { createZoomMeeting } from '@/lib/zoom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ZoomMeetingFormProps {
  groupId: string;
  onSuccess?: (data: any) => void;
  initialData?: any;
  isLeader?: boolean;
  meetingTime?: string | null;
  meetingSchedule?: string | null;
}

interface FormData {
  name: string;
  startTime: string;
  duration: number;
  password: string;
}

export function ZoomMeetingForm({ 
  groupId, 
  onSuccess, 
  initialData, 
  isLeader, 
  meetingTime,
  meetingSchedule 
}: ZoomMeetingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [nextMeetingTime, setNextMeetingTime] = useState<Date | null>(null);

  useEffect(() => {
    // Calculate next meeting time when meeting schedule changes
    if (meetingSchedule) {
      const calculateNextMeeting = () => {
        const weeklyMatch = meetingSchedule.match(/Every\s+(\w+)\s+at\s+(\d+):(\d+)\s+(AM|PM)/i);
        if (weeklyMatch) {
          const [_, day, hour, minute, meridian] = weeklyMatch;
          const dayMap: { [key: string]: number } = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          
          const dayNumber = dayMap[day.toLowerCase()];
          if (dayNumber === undefined) return null;

          // Convert time to 24-hour format
          let hour24 = parseInt(hour);
          if (meridian.toLowerCase() === 'pm' && hour24 < 12) hour24 += 12;
          if (meridian.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;

          // Calculate next occurrence
          const now = new Date();
          const result = new Date(now);
          result.setHours(hour24, parseInt(minute), 0, 0);

          let daysUntilNext = dayNumber - now.getDay();
          if (daysUntilNext <= 0) daysUntilNext += 7; // Move to next week if today or past
          result.setDate(result.getDate() + daysUntilNext);

          return result;
        }
        return null;
      };

      const nextDate = calculateNextMeeting();
      setNextMeetingTime(nextDate);
    }
  }, [meetingSchedule]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: initialData || {
      name: 'agents Study Meeting',
      startTime: meetingTime || new Date().toISOString(),
      duration: 60,
      password: Math.random().toString(36).slice(-8).toUpperCase()
    }
  });

  const getErrorMessage = (error: FieldError | undefined) => {
    return error?.message || '';
  };

  const handleAddToCalendar = async (calendarType: string) => {
    if (!meetingTime) {
      toast.error('Meeting time not set. Please contact the group leader.');
      return;
    }

    setIsCalendarLoading(true);
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/calendar-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendarType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send calendar invite');
      }

      toast.success('Calendar invite sent successfully');
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send calendar invite');
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!isLeader) {
      toast.error('Only leaders can create meetings');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create meeting directly through our API
      const response = await fetch(`/api/agents-study-groups/${groupId}/zoom-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          startTime: data.startTime,
          duration: data.duration,
          password: data.password,
          startNow: !initialData?.id // Start immediately if it's a new meeting
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create meeting');
      }

      toast.success(initialData?.id ? 'Meeting updated successfully' : 'Meeting created successfully');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create meeting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Meeting Form Column - Only visible to leaders */}
      {isLeader && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('name', { required: 'Meeting name is required' })}
              placeholder="Meeting Name"
              className="w-full"
            />
            {errors.name && (
              <span className="text-red-500">{getErrorMessage(errors.name)}</span>
            )}
          </div>

          {meetingSchedule ? (
            <div className="text-sm text-gray-600">
              <p>Recurring meeting: {meetingSchedule}</p>
              {nextMeetingTime && (
                <p className="mt-1">Next meeting: {nextMeetingTime.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}</p>
              )}
            </div>
          ) : (
            <div>
              <Input
                {...register('startTime', { required: 'Start time is required' })}
                type="datetime-local"
                className="w-full"
              />
              {errors.startTime && (
                <span className="text-red-500">{getErrorMessage(errors.startTime)}</span>
              )}
            </div>
          )}

          <div>
            <Input
              {...register('duration', { 
                required: 'Duration is required',
                min: { value: 15, message: 'Duration must be at least 15 minutes' },
                max: { value: 240, message: 'Duration cannot exceed 240 minutes' }
              })}
              type="number"
              placeholder="Duration (minutes)"
              className="w-full pb-4"
            />
            {errors.duration && (
              <span className="text-red-500">{getErrorMessage(errors.duration)}</span>
            )}
          </div>

          <div>
            <Input
              {...register('password', { required: 'Password is required' })}
              type="text"
              placeholder="Meeting Password"
              className="w-full"
            />
            {errors.password && (
              <span className="text-red-500">{getErrorMessage(errors.password)}</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : initialData?.id ? 'Update Meeting' : 'Create Meeting'}
          </Button>
        </form>
      )}

      {/* Calendar Buttons Column - Visible to all members */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Add to Calendar</h3>
        {meetingSchedule ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600">{meetingSchedule}</p>
            {nextMeetingTime && (
              <p className="text-sm text-gray-600 mt-1">Next meeting: {nextMeetingTime.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}</p>
            )}
          </div>
        ) : null}
        {(meetingTime || meetingSchedule) ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleAddToCalendar('google')}
              disabled={isCalendarLoading}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Image
                src="/images/calendars/icons8-google-calendar.svg"
                alt="Google Calendar"
                width={24}
                height={24}
              />
              <span>Google Calendar</span>
            </button>

            <button
              onClick={() => handleAddToCalendar('outlook')}
              disabled={isCalendarLoading}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Image
                src="/images/calendars/icons8-outlook-calendar.svg"
                alt="Outlook Calendar"
                width={24}
                height={24}
              />
              <span>Outlook Calendar</span>
            </button>

            <button
              onClick={() => handleAddToCalendar('ical')}
              disabled={isCalendarLoading}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Image
                src="/images/calendars/icons8-ios-agents.png"
                alt="Apple Calendar"
                width={24}
                height={24}
              />
              <span>Apple Calendar</span>
            </button>
          </div>
        ) : (
          <p className="text-gray-500">No meeting time set. Please contact the group leader.</p>
        )}
      </div>
    </div>
  );
} 