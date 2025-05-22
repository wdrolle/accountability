'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import GroupDetailClient from './GroupDetailClient';
import type { Group, Member, PrayerRequest, Message } from './GroupDetailClient/types';
import type { Note } from './GroupDetailClient/NotesTab';
import { Spinner } from "@nextui-org/spinner";
import { useRouter } from 'next/navigation';

interface GroupDetailWrapperProps {
  id: string;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <Spinner />
  </div>
);

export default function GroupDetailWrapper({ id }: GroupDetailWrapperProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const shouldJoin = searchParams.get('join') === 'true';

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // First check membership status
        const membershipResponse = await fetch(`/api/agents-study-groups/${id}/membership`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const membershipData = await membershipResponse.json();
        
        // Then fetch group data
        const response = await fetch(`/api/agents-study-groups/${id}`);
        if (!response.ok) {
          setError('FETCH_ERROR');
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        // Check if user is a member or leader
        const isMember = 
          membershipData.isMember || 
          (data.group && data.group.leader_id === session?.user?.id) || 
          membershipData.status === 'ACCEPTED';

        if (!isMember && !shouldJoin) {
          setError('NOT_MEMBER');
          setLoading(false);
          return;
        }
        
        // If we get here, either the user is a member or they're trying to join
        setGroup(data.group);
        setMembers(data.members || []);
        setNotes(data.notes || []);
        setPrayers(data.prayers || []);
        setMessages(data.messages || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching group data:', err);
        setError('FETCH_ERROR');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGroupData();
    }
  }, [id, shouldJoin, session?.user?.id]);

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/agents-study-groups/${id}/notes/${noteId}`, {
        method: 'DELETE',
      });
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleSaveNote = async (note: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }): Promise<{ note: Note }> => {
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': session?.user?.id || ''
        },
        body: JSON.stringify(note),
      });
      if (!response.ok) throw new Error('Failed to save note');
      const data = await response.json();
      setNotes(prevNotes => [...prevNotes, data.note]);
      return data;
    } catch (err) {
      console.error('Failed to save note:', err);
      throw err;
    }
  };

  const handleDeletePrayer = async (prayerId: string) => {
    try {
      await fetch(`/api/agents-study-groups/${id}/prayers/${prayerId}`, {
        method: 'DELETE',
      });
      setPrayers(prayers.filter(prayer => prayer.id !== prayerId));
    } catch (err) {
      console.error('Failed to delete prayer:', err);
    }
  };

  const handleSavePrayer = async (prayer: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/prayers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prayer),
      });
      const newPrayer = await response.json();
      setPrayers([...prayers, newPrayer]);
    } catch (err) {
      console.error('Failed to save prayer:', err);
    }
  };

  const handlePrayForRequest = async (prayerId: string) => {
    try {
      await fetch(`/api/agents-study-groups/${id}/prayers/${prayerId}/pray`, {
        method: 'POST',
      });
      setPrayers(prayers.map(prayer => 
        prayer.id === prayerId 
          ? { ...prayer, prayer_count: (prayer.prayer_count || 0) + 1 }
          : prayer
      ));
    } catch (err) {
      console.error('Failed to pray for request:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const newMessage = await response.json();
      setMessages([...messages, newMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleJoinGroup = async () => {
    if (!id) return;
    
    setIsJoining(true);
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        // After successful join, fetch the group data again
        const groupResponse = await fetch(`/api/agents-study-groups/${id}`);
        if (groupResponse.ok) {
          const groupData = await groupResponse.json();
          setGroup(groupData.group);
          setMembers(groupData.members || []);
          setNotes(groupData.notes || []);
          setPrayers(groupData.prayers || []);
          setMessages(groupData.messages || []);
          setError(null);
          // Remove the join parameter from the URL without navigation
          window.history.replaceState({}, '', `/community/groups/${id}`);
        }
      } else {
        if (data.error === 'PRIVATE_GROUP') {
          setError('PENDING_APPROVAL');
        } else {
          throw new Error(data.error || 'Failed to join group');
        }
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setError('FETCH_ERROR');
    } finally {
      setIsJoining(false);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds }),
      });
      if (!response.ok) throw new Error('Failed to add members');
      const data = await response.json();
      setMembers(data.members);
    } catch (err) {
      console.error('Failed to add members:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove member');
      setMembers(members.filter(m => m.user_id !== memberId));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update role');
      const data = await response.json();
      setMembers(members.map(m => m.user_id === memberId ? { ...m, role: data.role } : m));
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleMembersChange = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !group) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 light:bg-white dark:bg-dark">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold mb-4 text-white">
            {error === 'NOT_MEMBER' ? 'Join to Access Group' : 
             error === 'PENDING_APPROVAL' ? 'Membership Pending' :
             'Unable to Load Group'}
          </h2>
          <p className="text-gray-400 mb-8">
            {error === 'NOT_MEMBER' 
              ? 'You need to be a member of this group to view its content. Join now to participate in discussions and activities.'
              : error === 'PENDING_APPROVAL'
              ? 'Your request to join this private group has been sent. You will be notified once the group leader approves your request.'
              : 'There was an error loading the group. Please try again later.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/community/groups')}
              className="px-6 py-2 rounded-lg border-2 border-purple-500/20 text-white hover:bg-purple-500/10 transition-all duration-300"
            >
              Back to Groups
            </button>
            {error === 'NOT_MEMBER' && (
              <button
                onClick={handleJoinGroup}
                disabled={isJoining}
                className="px-6 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all duration-300 disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join Group'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <GroupDetailClient
      group={group}
      members={members}
      godV2UserId={session?.user?.id || null}
      notes={notes}
      prayers={prayers}
      messages={messages}
      onDeleteNote={handleDeleteNote}
      onSaveNote={handleSaveNote}
      onDeletePrayer={handleDeletePrayer}
      onSavePrayer={handleSavePrayer}
      onPrayForRequest={handlePrayForRequest}
      onSendMessage={handleSendMessage}
      onJoinGroup={handleJoinGroup}
      isJoining={isJoining}
      onMembersChange={handleMembersChange}
      onAddMembers={handleAddMembers}
      onRemoveMember={handleRemoveMember}
      onUpdateRole={handleUpdateRole}
    />
  );
} 