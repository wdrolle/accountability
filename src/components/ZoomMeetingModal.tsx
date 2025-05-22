import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { ExternalLink, Video, Users, Calendar, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ZoomMeetingDetails } from '@/lib/zoom';
import { createZoomMeeting, generateVideoSDKToken, getZoomAccessToken } from '@/lib/zoom';
import { useSession } from 'next-auth/react';

interface MeetingFormData {
  meeting_id: string;
  topic: string;
  join_url: string;
  start_url: string;
  password: string;
  start_time: string;
  duration: number;
  status: string;
  session_id: string;
  settings: Record<string, any>;
}

interface ZoomMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingDetails: ZoomMeetingDetails | null;
  groupId: string;
  isLeader?: boolean;
  isAdmin?: boolean;
  groupName?: string;
  onCreateMeeting: (meetingData: ZoomMeetingDetails) => Promise<void>;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
];

const generatePassword = () => {
  const chars = 'F9aE8b7c6d5e4f3Ag2Dh1i0jZkYlXkmWnVoUpTqBsrQsRpCOtNuMvLwKxJyHzG';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function ZoomMeetingModal({
  isOpen,
  onClose,
  meetingDetails,
  groupId,
  isLeader,
  isAdmin,
  groupName = 'agents Study Meeting',
  onCreateMeeting
}: ZoomMeetingModalProps) {
  const { data: session } = useSession();
  const [isStarting, setIsStarting] = useState(false);
  const [meetingData, setMeetingData] = useState<MeetingFormData>({
    meeting_id: '',
    topic: groupName,
    join_url: meetingDetails?.join_url || '',
    start_url: meetingDetails?.start_url || '',
    password: generatePassword(),
    start_time: meetingDetails?.start_time || new Date().toISOString(),
    duration: meetingDetails?.duration || 30,
    status: meetingDetails?.status || 'SCHEDULED',
    session_id: meetingDetails?.session_id || '',
    settings: meetingDetails?.settings || {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: true,
      meeting_authentication: true
    }
  });

  console.log('[DEBUG]  src\components\ZoomMeetingModal.tsx Meeting data:', meetingData);

  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMeetingData(prev => ({
        ...prev,
        topic: groupName,
        start_time: new Date().toISOString(),
        password: generatePassword(),
        duration: 30
      }));
    }
  }, [isOpen, groupName]);

  const refreshPassword = () => {
    setMeetingData(prev => ({
      ...prev,
      password: generatePassword()
    }));
  };

  const startMeeting = async () => {
    if (!isLeader) {
      toast.error('Only leaders can start meetings');
      return;
    }
    console.log('[DEBUG] Starting meeting:', meetingDetails?.meeting_id);

    try {
      setIsStarting(true);
      const response = await fetch(`/api/agents-study-groups/${groupId}/zoom-meeting`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          meeting_id: meetingDetails?.meeting_id || '',
          session_id: meetingDetails?.session_id || ''
        }),
      });

      console.log('[DEBUG]  src\components\ZoomMeeting Modal.tsx Response:', response);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start meeting');
      }

      console.log('[DEBUG]  src\components\ZoomMeetingModal.tsx Meeting started successfully:', data);

      toast.success('Meeting started successfully');
      window.open(meetingDetails?.start_url || '', '_blank');
    } catch (error) {
      console.error('[DEBUG]  src\components\ZoomMeetingModal.tsx Error starting meeting:', error);
      toast.error(error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to start meeting');
    } finally {
      setIsStarting(false);
    }
  };

  const joinMeeting = () => {
    if (!meetingDetails?.join_url) {
      toast.error('Join URL not available');
      return;
    }
    window.open(meetingDetails.join_url, '_blank');
  };

  const handleCreateMeeting = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!meetingData.topic || !meetingData.start_time || !meetingData.duration || !meetingData.password) {
        setError('Please fill in all required fields');
        return;
      }

      console.log('[DEBUG] Meeting data:', meetingData);

      const response = await fetch(`/api/agents-study-groups/${groupId}/zoom-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: meetingData.topic,
          type: 2,
          start_time: meetingData.start_time,
          duration: meetingData.duration,
          password: meetingData.password,
          settings: meetingData.settings
        }),
        credentials: 'include'
      });

      const responseText = await response.text();
      console.log('[DEBUG] Response text:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to create meeting';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('[DEBUG] Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      console.log('[DEBUG] Meeting created successfully:', data);

      // Close the modal and refresh the group details
      onClose();
      if (onCreateMeeting) {
        await onCreateMeeting(data);
      }
    } catch (error) {
      console.error('[DEBUG] Error creating meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to create meeting');
      toast.error(error instanceof Error ? error.message : 'Failed to create meeting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      hideCloseButton={true}
      isDismissable={true}
      aria-labelledby="zoom-meeting-modal-title"
      classNames={{
        base: "bg-white dark:bg-dark absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
        backdrop: "bg-black/50",
        body: "bg-white dark:bg-dark",
        header: "bg-white dark:bg-dark border-b border-gray-200 dark:border-gray-700",
        footer: "bg-white dark:bg-dark border-t border-gray-200 dark:border-gray-700",
        closeButton: "hidden"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark">
          <Video className="w-5 h-5" aria-hidden="true" />
          <span id="zoom-meeting-modal-title">Zoom Meeting</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {meetingDetails ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold pb-5">{meetingDetails.topic}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {meetingDetails.start_time && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>{format(new Date(meetingDetails.start_time), 'PPP')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-white dark:bg-dark">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span>{meetingDetails.duration} minutes</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                  <label id="meeting-name-label" className="text-sm font-medium text-default-700">Meeting Name</label>
                  <Input
                    classNames={{
                      input: "pl-0",
                      inputWrapper: "pt-0 bg-white dark:bg-dark"
                    }}
                    value={meetingData.topic}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Enter meeting name"
                    description="Name of your agents study meeting"
                    aria-labelledby="meeting-name-label"
                    isRequired
                  />
                </div>
                <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                  <label id="start-time-label" className="text-sm font-medium text-default-700">Start Time</label>
                  <input
                    type="datetime-local"
                    className="flex-1 rounded-md bg-white dark:bg-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-200 dark:border-gray-700"
                    value={meetingData.start_time.slice(0, 16)}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, start_time: new Date(e.target.value).toISOString() }))}
                    aria-labelledby="start-time-label"
                    required
                  />
                </div>
                <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                  <label id="duration-label" className="text-sm font-medium text-default-700">Duration</label>
                  <Select
                    classNames={{
                      trigger: "bg-white dark:bg-dark",
                      value: "pt-0",
                      base: "w-full",
                      popoverContent: "z-[9999] bg-white dark:bg-dark",
                      listbox: "bg-white dark:bg-dark"
                    }}
                    placeholder="Select meeting duration"
                    selectedKeys={[meetingData.duration.toString()]}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    aria-labelledby="duration-label"
                    isRequired
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} textValue={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-[150px_1fr] items-center gap-2">
                  <label id="password-label" className="text-sm font-medium text-default-700">Password</label>
                  <div className="flex gap-2">
                    <Input
                      classNames={{
                        input: "pl-0",
                        inputWrapper: "pt-0 bg-white dark:bg-dark"
                      }}
                      value={meetingData.password}
                      onChange={(e) => setMeetingData(prev => ({ ...prev, password: e.target.value }))}
                      description="Password for participants to join"
                      aria-labelledby="password-label"
                      isRequired
                    />
                    <Button
                      isIconOnly
                      onClick={refreshPassword}
                      aria-label="Generate new password"
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {meetingDetails ? (
            <div className="flex gap-2">
              <Button
                color="primary"
                onClick={joinMeeting}
                startContent={<ExternalLink className="w-4 h-4" aria-hidden="true" />}
                aria-label="Join meeting"
              >
                Join Meeting
              </Button>
              {(isLeader || isAdmin) && (
                <Button
                  color="primary"
                  onClick={startMeeting}
                  isLoading={isStarting}
                  startContent={<Video className="w-4 h-4" aria-hidden="true" />}
                  aria-label="Start meeting"
                >
                  Start Meeting
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2 justify-end w-full">
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                color="secondary"
                onClick={handleCreateMeeting}
                isLoading={isCreating}
                aria-label="Create meeting"
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Create Meeting
              </Button>
            </div>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
