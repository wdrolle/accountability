'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { WhiteBoardContent } from '../types';

interface UseWhiteboardProps {
  groupId: string;
  godV2UserId: string | null;
}

export const useWhiteboard = ({ groupId, godV2UserId }: UseWhiteboardProps) => {
  const [whiteBoards, setWhiteBoards] = useState<WhiteBoardContent[]>([]);
  const [isEditWhiteBoardOpen, setIsEditWhiteBoardOpen] = useState(false);
  const [whiteBoardContent, setWhiteBoardContent] = useState("");
  const [whiteBoardTitle, setWhiteBoardTitle] = useState("");
  const [whiteBoardDay, setWhiteBoardDay] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWhiteBoard, setSelectedWhiteBoard] = useState<WhiteBoardContent | null>(null);
  const [isSavingWhiteboard, setIsSavingWhiteboard] = useState(false);

  const loadWhiteBoards = useCallback(async () => {
    if (!groupId || !godV2UserId) return;
    
    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/whiteboards`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': godV2UserId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load whiteboards');
      }
      
      const data = await response.json();
      if (data && Array.isArray(data.whiteboards)) {
        setWhiteBoards(data.whiteboards);
      } else {
        setWhiteBoards([]);
      }
    } catch (error) {
      console.error('Error loading whiteboards:', error);
      toast.error('Failed to load whiteboards');
      setWhiteBoards([]);
    }
  }, [groupId, godV2UserId]);

  const saveWhiteboard = async (content: WhiteBoardContent) => {
    if (!groupId || !godV2UserId) return;
    
    try {
      setIsSavingWhiteboard(true);
      const response = await fetch(`/api/agents-study-groups/${groupId}/whiteboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        body: JSON.stringify({ whiteboards: [content] }),
      });

      if (!response.ok) {
        throw new Error('Failed to save whiteboard');
      }

      toast.success('Whiteboard saved successfully');
      await loadWhiteBoards();
      return true;
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      toast.error('Failed to save whiteboard');
      return false;
    } finally {
      setIsSavingWhiteboard(false);
    }
  };

  const deleteWhiteboard = async (title: string, day: string) => {
    if (!groupId || !godV2UserId) return;

    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/whiteboards`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        body: JSON.stringify({
          title,
          day,
          group_id: groupId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete whiteboard');
      }

      toast.success('Whiteboard deleted successfully');
      await loadWhiteBoards();
      return true;
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      toast.error('Failed to delete whiteboard');
      return false;
    }
  };

  return {
    whiteBoards,
    isEditWhiteBoardOpen,
    whiteBoardContent,
    whiteBoardTitle,
    whiteBoardDay,
    selectedWhiteBoard,
    isSavingWhiteboard,
    setIsEditWhiteBoardOpen,
    setWhiteBoardContent,
    setWhiteBoardTitle,
    setWhiteBoardDay,
    setSelectedWhiteBoard,
    loadWhiteBoards,
    saveWhiteboard,
    deleteWhiteboard
  };
}; 