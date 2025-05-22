// src/components/GroupDetailClient.tsx

import React, { useState } from 'react';
import { toast } from 'sonner';
import { createZoomMeeting, type ZoomMeetingDetails } from '@/lib/zoom';
import type { agents_group as agentsStudyGroup } from '@prisma/client';
import ZoomVideoComponent from './ZoomVideoComponent';

interface Props {
  group: agentsStudyGroup;
}

interface ZoomMeeting {
  id: string;
  agentsStudyGroupId: string;
  meetingId: string;
  joinUrl: string;
  startUrl: string;
  password: string;
  startTime: Date | null;
  duration: number;
}

export default function GroupDetailClient({ group }: Props) {
  const [zoomMeeting, setZoomMeeting] = useState<ZoomMeeting | null>(null);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [showVideoInterface, setShowVideoInterface] = useState(false);

  async function handleCreateMeeting(meetingData: ZoomMeetingDetails) {
    try {
      console.log('[DEBUG] src/components/GroupDetailClient.tsx Creating Zoom meeting with data:', {
        ...meetingData,
        password: meetingData.password ? '[HIDDEN]' : undefined
      });
      
      // First create the Zoom meeting using the Zoom API
      const zoomResponse = await createZoomMeeting({
        name: meetingData.name,
        startTime: meetingData.startTime,
        duration: meetingData.duration,
        password: meetingData.password,
        status: 'scheduled',
        meetingId: meetingData.meetingId,
        joinUrl: meetingData.joinUrl,
        startUrl: meetingData.startUrl,
        settings: {
          alternative_hosts: '',
          registrants_email_notification: true,
          calendar_type: 1,
          send_calendar_invite: true
        }
      });

      console.log('[DEBUG] src/components/GroupDetailClient.tsx Zoom API response:', zoomResponse);
      
      if (!zoomResponse || !zoomResponse.meetingId) {
        console.error('[DEBUG] src/components/GroupDetailClient.tsx Invalid Zoom response:', zoomResponse);
        throw new Error('Failed to create Zoom meeting: Invalid response from Zoom API');
      }

      // Prepare meeting details from Zoom's response
      const meetingDetails = {
        meetingId: zoomResponse.meetingId,
        topic: zoomResponse.name,
        joinUrl: zoomResponse.joinUrl,
        startUrl: zoomResponse.startUrl,
        password: zoomResponse.password,
        startTime: zoomResponse.startTime,
        duration: zoomResponse.duration,
        status: zoomResponse.meetingId.status,
        settings: {
          alternative_hosts: '',
          registrants_email_notification: true,
          calendar_type: 1,
          send_calendar_invite: true
        }
      };

      console.log('[DEBUG] src/components/GroupDetailClient.tsx Meeting details:', meetingDetails);

      // Check if any required fields are missing
      const requiredFields = ['meetingId', 'topic', 'joinUrl', 'startUrl', 'password', 'startTime', 'duration'];
      const missingFields = requiredFields.filter(field => !meetingDetails[field as keyof typeof meetingDetails]);
      console.log('[DEBUG] src/components/GroupDetailClient.tsx Meeting details:', requiredFields);
      console.log('[DEBUG] src/components/GroupDetailClient.tsx Missing fields:', missingFields);
      
      if (missingFields.length > 0) {
        console.error('[DEBUG] src/components/GroupDetailClient.tsx Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Save the meeting details to our database
      const response = await fetch(`/api/agents-study-groups/${group.id}/zoom-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingDetails),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('[DEBUG] src/components/GroupDetailClient.tsx Error response from API:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          errorData?.error || errorData?.details || `Failed to save meeting details: ${response.statusText}`
        );
      }

      const savedMeeting = await response.json();
      console.log('[DEBUG] src/components/GroupDetailClient.tsx Saved meeting details:', savedMeeting);
      
      // Update the UI with the new meeting details
      setZoomMeeting({
        id: savedMeeting.id,
        agentsStudyGroupId: group.id,
        meetingId: savedMeeting.meetingId,
        joinUrl: savedMeeting.joinUrl,
        startUrl: savedMeeting.startUrl,
        password: savedMeeting.password,
        startTime: new Date(savedMeeting.startTime),
        duration: savedMeeting.duration
      });

      toast.success('Meeting created successfully');
      setShowCreateMeetingModal(false);
    } catch (error) {
      console.error('[DEBUG] src/components/GroupDetailClient.tsx Error creating meeting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create meeting');
    }
  }

  function handleJoinMeeting() {
    if (!zoomMeeting) {
      toast.error('No active meeting found');
      return;
    }
    setShowVideoInterface(true);
  }

  function handleLeaveMeeting() {
    setShowVideoInterface(false);
  }

  return (
    <div>
      {showVideoInterface && zoomMeeting ? (
        <ZoomVideoComponent
          meetingNumber={zoomMeeting.meetingId}
          password={zoomMeeting.password}
          userName={group.name}
          leaveUrl={window.location.href}
          role={1} // 1 for host
        />
      ) : (
        <div>
          {/* Your existing UI */}
          {zoomMeeting && (
            <button
              onClick={handleJoinMeeting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Join Meeting
            </button>
          )}
        </div>
      )}
    </div>
  );
} 