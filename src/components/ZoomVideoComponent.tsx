import React, { useEffect, useRef } from 'react';
import { ZoomMtg } from '@zoom/meetingsdk';
import { toast } from 'sonner';

interface ZoomVideoProps {
  meetingNumber: string;
  password: string;
  userName: string;
  role?: number; // 0 for participant, 1 for host
  leaveUrl: string;
}

export default function ZoomVideoComponent({ 
  meetingNumber, 
  password, 
  userName, 
  role = 0,
  leaveUrl 
}: ZoomVideoProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeZoom = async () => {
      try {
        // Initialize Zoom Meeting SDK
        ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // Set language
        ZoomMtg.i18n.load('en-US');
        ZoomMtg.i18n.reload('en-US');

        // Get the Zoom JWT token from your server
        const response = await fetch('/api/zoom/video-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingNumber,
            role,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get Zoom token');
        }

        const { token } = await response.json();

        // Initialize the meeting
        ZoomMtg.init({
          leaveUrl,
          success: () => {
            // Join the meeting
            ZoomMtg.join({
              meetingNumber: meetingNumber,
              userName: userName,
              signature: token,
              passWord: password,
              success: () => {
                console.log('Joined Zoom meeting successfully');
                toast.success('Joined meeting successfully');
              },
              error: (error: any) => {
                console.error('Failed to join Zoom meeting:', error);
                toast.error('Failed to join meeting');
              }
            });
          },
          error: (error: any) => {
            console.error('Failed to initialize Zoom:', error);
            toast.error('Failed to initialize Zoom');
          }
        });
      } catch (error) {
        console.error('Error setting up Zoom:', error);
        toast.error('Failed to setup Zoom meeting');
      }
    };

    if (videoContainerRef.current) {
      initializeZoom();
    }

    // Cleanup function
    return () => {
      ZoomMtg.leaveMeeting({});
    };
  }, [meetingNumber, password, userName, role, leaveUrl]);

  return (
    <div ref={videoContainerRef} className="w-full h-full min-h-[600px] relative">
      <div id="zmmtg-root"></div>
    </div>
  );
} 