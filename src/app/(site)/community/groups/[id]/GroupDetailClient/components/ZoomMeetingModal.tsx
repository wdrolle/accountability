'use client';

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Video, RefreshCw } from 'lucide-react';

interface ZoomMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMeeting: (meetingData: {
    name: string;
    startTime: string;
    duration: string;
    password: string;
  }) => Promise<void>;
}

export default function ZoomMeetingModal({ isOpen, onClose, onCreateMeeting }: ZoomMeetingModalProps) {
  const [meetingName, setMeetingName] = React.useState('agents Study Meeting');
  const [startTime, setStartTime] = React.useState('');
  const [duration, setDuration] = React.useState('30 minutes');
  const [password, setPassword] = React.useState('QBBMn9d6'); // Default SDK-generated password

  React.useEffect(() => {
    // Set default start time to current time
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    setStartTime(formattedDate);
  }, [isOpen]);

  const handleRefreshPassword = async () => {
    try {
      const response = await fetch('/api/zoom/generate-password');
      if (!response.ok) throw new Error('Failed to generate password');
      const data = await response.json();
      setPassword(data.password);
    } catch (error) {
      console.error('Error refreshing password:', error);
    }
  };

  const handleSubmit = async () => {
    await onCreateMeeting({
      name: meetingName,
      startTime,
      duration,
      password
    });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      hideCloseButton
      classNames={{
        base: "bg-[#0D0C22] text-white",
        header: "border-b-0",
        body: "py-6",
        footer: "border-t-0"
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                <span>Zoom Meeting</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Meeting Name</div>
                  <Input
                    value={meetingName}
                    onChange={(e) => setMeetingName(e.target.value)}
                    variant="bordered"
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: "bg-transparent border-gray-700"
                    }}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Start Time</div>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    variant="bordered"
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: "bg-transparent border-gray-700"
                    }}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Duration</div>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    variant="bordered"
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: "bg-transparent border-gray-700"
                    }}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Password</div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={password}
                      isReadOnly
                      variant="bordered"
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: "bg-transparent border-gray-700"
                      }}
                      endContent={
                        <Button
                          isIconOnly
                          variant="light"
                          onPress={handleRefreshPassword}
                          className="text-gray-400"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="default" 
                variant="light" 
                onPress={onClose}
                className="text-gray-400"
              >
                Cancel
              </Button>
              <Button 
                color="secondary"
                className="text-white"
                onPress={handleSubmit}
              >
                Create Meeting
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 