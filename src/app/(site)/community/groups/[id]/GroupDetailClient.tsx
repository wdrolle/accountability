'use client';

import React, { useState, Suspense, useCallback } from 'react';
import { Info, Users, BookText, Heart, MessageCircle, Video, Trash2 } from 'lucide-react';
// Component imports
import ManageMembersModal from './components/ManageMembersModal';
import ProfileImageModal from './components/ProfileImageModal';
// GroupDetailClient sub-components
import MembersList from './GroupDetailClient/components/MembersList';
import { GroupHeader } from './GroupDetailClient/GroupHeader';
import NotesTab from './GroupDetailClient/NotesTab';
import type { Note, Reply } from './GroupDetailClient/NotesTab';
import PrayersTab from './GroupDetailClient/PrayersTab';
import ChatTab from './GroupDetailClient/ChatTab';
import WhiteboardTab from './GroupDetailClient/WhiteboardTab';
import ZoomMeetingModal from './GroupDetailClient/components/ZoomMeetingModal';
// Types
import type { Group, Member, PrayerRequest, Message, TabType } from './GroupDetailClient/types';
import { Spinner } from '@nextui-org/spinner';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@nextui-org/button';
import { addDays, addWeeks, addYears, parseISO, isFuture } from 'date-fns';
import { toast } from 'react-hot-toast';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';

// Loading components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Spinner />
  </div>
);

const tabs = [
  { id: 'whiteboard', label: 'Whiteboard', icon: BookText },
  { id: 'info', label: 'Info', icon: Info },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'notes', label: 'Notes', icon: BookText },
  { id: 'prayers', label: 'Prayers', icon: Heart },
  { id: 'chat', label: 'Group Chat', icon: MessageCircle }
] as const;

interface GroupDetailClientProps {
  group: Group;
  members: Member[];
  godV2UserId: string | null;
  notes: Note[];
  prayers: PrayerRequest[];
  messages: Message[];
  onDeleteNote: (noteId: string) => Promise<void>;
  onSaveNote: (note: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }) => Promise<{ note: Note }>;
  onDeletePrayer: (prayerId: string) => Promise<void>;
  onSavePrayer: (prayer: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }) => Promise<void>;
  onPrayForRequest: (prayerId: string) => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
  onJoinGroup: () => Promise<void>;
  isJoining: boolean;
  onMembersChange: (members: Member[]) => void;
  onAddMembers: (memberIds: string[]) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onUpdateRole: (memberId: string, role: string) => Promise<void>;
}

const GroupDetailClient: React.FC<GroupDetailClientProps> = ({
  group,
  members,
  godV2UserId,
  notes: initialNotes,
  prayers,
  messages,
  onDeleteNote,
  onSaveNote,
  onDeletePrayer,
  onSavePrayer,
  onPrayForRequest,
  onSendMessage,
  onJoinGroup,
  isJoining,
  onMembersChange,
  onAddMembers,
  onRemoveMember,
  onUpdateRole
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const [isZoomMeetingModalOpen, setIsZoomMeetingModalOpen] = useState(false);
  const router = useRouter();

  // Add SWR hook for group data
  const { mutate } = useSWR(`/api/agents-study-groups/${group.id}`);

  // Use the hook to get notes and deleteReply
  const { notes, deleteReply } = useNotes(group.id, godV2UserId);

  const handleImageClick = (url: string, name: string) => {
    setSelectedImageUrl(url);
    setSelectedImageName(name);
  };

  const isLeader = godV2UserId && group?.leader_id ? godV2UserId === group.leader_id : false;

  const handleMembersChange = useCallback(() => {
    onMembersChange(members);
  }, [members, onMembersChange]);

  const handleCreateMeeting = async (meetingData: {
    name: string;
    startTime: string;
    duration: string;
    password: string;
  }) => {
    if (!group?.id || !godV2UserId) {
      toast.error('Missing required data for creating meeting');
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/zoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        body: JSON.stringify({
          name: meetingData.name,
          start_time: meetingData.startTime,
          duration: parseInt(meetingData.duration),
          password: meetingData.password || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create Zoom meeting');
      }

      const data = await response.json();
      toast.success('Meeting created successfully');
      
      // Refresh the group data to get the new meeting
      await mutate();
      setIsZoomMeetingModalOpen(false);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create meeting');
    }
  };

  const getNextMeetingDate = (startTime: string, recurrence?: { type: 1 | 2 | 3, repeat_interval: number }) => {
    if (!recurrence) return new Date(startTime);
    
    const baseDate = parseISO(startTime);
    let nextDate = baseDate;
    
    // Keep adding intervals until we find a future date
    while (!isFuture(nextDate)) {
      switch (recurrence.type) {
        case 1: // Daily
          nextDate = addDays(nextDate, recurrence.repeat_interval);
          break;
        case 2: // Weekly
          nextDate = addWeeks(nextDate, recurrence.repeat_interval);
          break;
        case 3: // Monthly/Yearly
          nextDate = addYears(nextDate, recurrence.repeat_interval);
          break;
      }
    }
    
    return nextDate;
  };

  const handleReplyToNote = async (noteId: string, content: string, isPrivate: boolean): Promise<{ reply: Reply }> => {
    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/notes/${noteId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId || ''
        },
        body: JSON.stringify({ content, is_private: isPrivate })
      });

      if (!response.ok) throw new Error('Failed to add reply');
      
      const data = await response.json();
      await mutate();
      toast.success('Reply added successfully');
      return data;
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
      throw error;
    }
  };

  const handleDeleteReply = async (noteId: string, replyId: string) => {
    try {
      if (!godV2UserId) {
        throw new Error('Authentication required');
      }
      await deleteReply(noteId, replyId);
      toast.success('Reply deleted successfully');
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete reply');
    }
  };

  if (!group) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 light:bg-white dark:bg-dark">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold mb-4 text-white">Join to Access Group</h2>
          <p className="text-gray-400 mb-8">
            You need to be a member of this group to view its content. Join now to participate in discussions and activities.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/community/groups')}
              className="px-6 py-2 rounded-lg border-2 border-purple-500/20 text-white hover:bg-purple-500/10 transition-all duration-300"
            >
              Back to Groups
            </button>
            <button
              onClick={onJoinGroup}
              disabled={isJoining}
              className="px-6 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all duration-300 disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'whiteboard' && (
          <WhiteboardTab
            group={group}
            members={members}
            godV2UserId={godV2UserId}
          />
        )}
        {activeTab === 'info' && (
          <div className="p-4">
            <div className="space-y-4">

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <h3 className="font-medium">Current Topic</h3>
                  <p className="text-gray-400">{group.current_topic || 'Not specified'}</p>
                </div>

                <div>
                  <h3 className="font-medium">Meeting Schedule</h3>
                  <p className="text-gray-400">{group.meeting_schedule || 'Not specified'}</p>
                </div>

                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-gray-400">{group.location || 'Not specified'}</p>
                </div>

                <div>
                  <h3 className="font-medium">Language</h3>
                  <p className="text-gray-400">{group.language || 'Not specified'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-gray-400">{group.description || 'No description available'}</p>
              </div>

              <div>
                <h3 className="font-medium">Zoom Meeting</h3>
                <div className="mt-8">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center">
                      <Video className="mr-2" />
                      <span className="font-medium">Video Meetings</span>
                    </div>
                    {group.zoom_meetings && group.zoom_meetings.length > 0 ? (
                      <div>
                        {group.zoom_meetings.map((meeting) => {
                          const nextMeetingDate = getNextMeetingDate(meeting.start_time, meeting.recurrence);
                          const recurrenceText = meeting.recurrence ? 
                            `Repeats ${meeting.recurrence.type === 1 ? 'daily' : 
                              meeting.recurrence.type === 2 ? 'weekly' : 'yearly'} 
                              (every ${meeting.recurrence.repeat_interval} ${
                                meeting.recurrence.type === 1 ? 'day' : 
                                meeting.recurrence.type === 2 ? 'week' : 'year'
                              }${meeting.recurrence.repeat_interval > 1 ? 's' : ''})` : '';

                          return (
                            <div key={meeting.id} className="p-4 rounded-lg border dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">{meeting.name}</h4>
                                  <div className="text-sm text-gray-400">
                                    <div>Next meeting: {nextMeetingDate.toLocaleString()}</div>
                                    <div>{meeting.duration} minutes</div>
                                    {recurrenceText && <div>{recurrenceText}</div>}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    color="secondary"
                                    className="text-white"
                                    onPress={() => {/* TODO: Implement join meeting */}}
                                  >
                                    Join Meeting
                                  </Button>
                                  {(isLeader || godV2UserId === group.leader_id) && (
                                    <>
                                      <Button
                                        color="secondary"
                                        className="text-white"
                                        onPress={() => setIsZoomMeetingModalOpen(true)}
                                      >
                                        Manage Meeting
                                      </Button>
                                      <Button
                                        color="secondary"
                                        className="text-white"
                                        onPress={() => {/* TODO: Implement delete meeting */}}
                                      >
                                        Delete Meeting
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 mb-4">No meetings scheduled</p>
                        {(isLeader || godV2UserId === group.leader_id) && (
                          <Button
                            color="secondary"
                            className="text-white"
                            startContent={<Video />}
                            onPress={() => setIsZoomMeetingModalOpen(true)}
                          >
                            Create Meeting
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'members' && (
          <MembersList
            members={members}
            group={group}
            onImageClick={handleImageClick}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab
            notes={notes || initialNotes}
            group={group}
            members={members}
            godV2UserId={godV2UserId}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
            onReplyToNote={handleReplyToNote}
            onDeleteReply={handleDeleteReply}
          />
        )}
        {activeTab === 'prayers' && (
          <PrayersTab
            group={group}
            members={members}
            godV2UserId={godV2UserId}
            prayers={prayers}
            onDeletePrayer={onDeletePrayer}
            onSavePrayer={onSavePrayer}
            onPrayForRequest={onPrayForRequest}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab
            group={group}
            members={members}
            godV2UserId={godV2UserId}
            messages={messages}
            onSendMessage={onSendMessage}
          />
        )}
      </Suspense>
    );
  };

  return (
  <>
    <Breadcrumb pageTitle="Group Details" className="mb-4 text-center"/>
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#0D0C22] rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <img 
                  src={group.leader.image} 
                  alt={group.leader.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold">{group.name}</h2>
                  <p className="text-gray-400">Group Leader</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-gray-400">
                  <span className="mr-2">👥</span>
                  {group.member_count} members
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                  Leave Group
                </button>
              </div>
            </div>

            <p className="text-gray-400">{group.description}</p>

            <div className="flex mt-6 border-b border-gray-700">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabType)}
                  className={`flex items-center px-4 py-2 space-x-2 border-b-2 transition-colors ${
                    activeTab === id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent hover:border-gray-700 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {renderTab()}
          </div>
        </div>
      </div>

      <ManageMembersModal
        onAddMembers={onAddMembers}
        onRemoveMember={onRemoveMember}
        onUpdateRole={onUpdateRole}
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
        groupId={group.id}
        members={members}
        isLeader={isLeader}
        onMembersChange={handleMembersChange}
      />

      {selectedImageUrl && (
        <ProfileImageModal
          isOpen={!!selectedImageUrl}
          onClose={() => setSelectedImageUrl(null)}
          imageUrl={selectedImageUrl}
          name={selectedImageName}
        />
      )}

      <ZoomMeetingModal
        isOpen={isZoomMeetingModalOpen}
        onClose={() => setIsZoomMeetingModalOpen(false)}
        onCreateMeeting={handleCreateMeeting}
      />
    </div>
    </>
  );
};

export default GroupDetailClient;
