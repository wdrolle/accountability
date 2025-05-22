'use client';

import { useEffect, useState } from 'react';
import { Tabs, Tab } from '@nextui-org/tabs';
import { Card } from '@nextui-org/card';
import { Spinner } from '@nextui-org/spinner';
import { Group, Member, PrayerRequest, Message, TabType } from './types';
import { InfoTab } from './InfoTab';
import { MembersTab } from './MembersTab';
import NotesTab, { Note, Reply } from './NotesTab';
import PrayersTab from './PrayersTab';
import ChatTab from './ChatTab';
import ManageMembersModal from '../components/ManageMembersModal';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface GroupDetailClientProps {
  groupId: string;
}

export default function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>('info');
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const session = useSession();
  const user = session?.data?.user;

  const fetchGroupData = async () => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group data from src/app/(site)/community/groups/[id]/GroupDetailClient/index.tsx');
      }
      const data = await response.json();
      setGroup(data.group);
      setMembers(data.members);
      setNotes(data.notes);
      setPrayers(data.prayers);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const handleAddMembers = async (memberIds: string[]) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds }),
      });
      if (!response.ok) throw new Error('Failed to add members');
      const data = await response.json();
      setMembers(data.members);
      handleMembersChange();
    } catch (err) {
      console.error('Failed to add members:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove member');
      setMembers(members.filter(m => m.user_id !== memberId));
      handleMembersChange();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update role');
      const data = await response.json();
      setMembers(members.map(m => m.user_id === memberId ? { ...m, role: data.role } : m));
      handleMembersChange();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleSaveNote = async (note: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }): Promise<{ note: Note }> => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-god-v2-user-id': user?.id || ''
        },
        body: JSON.stringify(note),
      });
      if (!response.ok) throw new Error('Failed to save note');
      const data = await response.json();
      setNotes([...notes, data.note]);
      return data;
    } catch (err) {
      console.error('Failed to save note:', err);
      throw err;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleSavePrayer = async (prayer: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/prayers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prayer),
      });
      if (!response.ok) throw new Error('Failed to save prayer');
      const newPrayer = await response.json();
      setPrayers([...prayers, newPrayer]);
    } catch (err) {
      console.error('Failed to save prayer:', err);
    }
  };

  const handleDeletePrayer = async (prayerId: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/prayers/${prayerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete prayer');
      setPrayers(prayers.filter(p => p.id !== prayerId));
    } catch (err) {
      console.error('Failed to delete prayer:', err);
    }
  };

  const handlePrayForRequest = async (prayerId: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/prayers/${prayerId}/pray`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to pray for request');
      setPrayers(prayers.map(p => p.id === prayerId ? { ...p, prayer_count: p.prayer_count + 1 } : p));
    } catch (err) {
      console.error('Failed to pray for request:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const newMessage = await response.json();
      setMessages([...messages, newMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleMembersChange = () => {
    // Refetch group data when members change
    fetchGroupData();
  };

  const isLeader = group?.leader_id === user?.id;

  const handleReplyToNote = async (noteId: string, content: string, isPrivate: boolean): Promise<{ reply: Reply }> => {
    if (!group) throw new Error('Group not found');
    
    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/notes/${noteId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': user?.id || ''
        },
        body: JSON.stringify({ content, is_private: isPrivate })
      });

      if (!response.ok) throw new Error('Failed to add reply');
      
      const data = await response.json();
      // Update notes state with the new reply
      setNotes(notes.map(note => 
        note.id === noteId 
          ? { ...note, replies: [...note.replies, data.reply] }
          : note
      ));
      return data;
    } catch (err) {
      console.error('Failed to add reply:', err);
      throw err;
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!group) return;
    
    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/notes/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'x-god-v2-user-id': user?.id || ''
        }
      });

      if (!response.ok) throw new Error('Failed to delete reply');
      
      // Refresh notes data
      const notesResponse = await fetch(`/api/agents-study-groups/${group.id}/notes`, {
        headers: {
          'x-god-v2-user-id': user?.id || ''
        }
      });
      if (notesResponse.ok) {
        const data = await notesResponse.json();
        setNotes(data.notes);
      }
      
      toast.success('Reply deleted successfully');
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || 'Group not found'}
      </div>
    );
  }

  return (
    <Card className="w-full p-4 light:bg-white dark:bg-dark">
      <Tabs 
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as TabType)}
        className="w-full"
      >
        <Tab key="info" title="Info">
          <InfoTab group={group} />
        </Tab>
        <Tab key="members" title="Members">
          <MembersTab 
            members={members} 
            group={group} 
            onManageMembers={() => setIsManageMembersOpen(true)}
          />
        </Tab>
        <Tab key="notes" title="Notes">
          <NotesTab 
            notes={notes} 
            members={members}
            group={group} 
            godV2UserId={user?.id ?? null}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onReplyToNote={handleReplyToNote}
            onDeleteReply={handleDeleteReply}
          />
        </Tab>
        <Tab key="prayers" title="Prayers">
          <PrayersTab 
            prayers={prayers} 
            group={group}
            members={members}
            godV2UserId={user?.id ?? null}
            onSavePrayer={handleSavePrayer}
            onDeletePrayer={handleDeletePrayer}
            onPrayForRequest={handlePrayForRequest}
          />
        </Tab>
        <Tab key="chat" title="Chat">
          <ChatTab 
            messages={messages} 
            group={group}
            members={members}
            godV2UserId={user?.id ?? null}
            onSendMessage={handleSendMessage}
          />
        </Tab>
      </Tabs>

      <ManageMembersModal
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
        groupId={group.id}
        members={members}
        isLeader={isLeader}
        onMembersChange={handleMembersChange}
        onAddMembers={handleAddMembers}
        onRemoveMember={handleRemoveMember}
        onUpdateRole={handleUpdateRole}
      />
    </Card>
  );
} 