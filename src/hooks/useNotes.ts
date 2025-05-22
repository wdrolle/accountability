import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: Date | null;
  updated_at: Date | null;
  user: User;
}

interface Note {
  id: string;
  content: string;
  title: string | null;
  visibility: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  group_id: string;
  user: User;
  agents_group_note_replies: Reply[];
}

export function useNotes(groupId: string, godV2UserId: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);

  const fetchNotes = useCallback(async () => {
    if (!godV2UserId) return;
    
    try {
      const response = await fetch(`/api/notes?groupId=${groupId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  }, [groupId, godV2UserId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const deleteReply = useCallback(async (noteId: string, replyId: string) => {
    if (!godV2UserId) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`/api/notes/reply/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete reply');
      }

      setNotes(prevNotes => 
        prevNotes.map(note => {
          if (note.id === noteId) {
            return {
              ...note,
              agents_group_note_replies: note.agents_group_note_replies.filter(
                reply => reply.id !== replyId
              )
            };
          }
          return note;
        })
      );

      return true;
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  }, [godV2UserId]);

  return { notes, deleteReply, refetchNotes: fetchNotes };
} 