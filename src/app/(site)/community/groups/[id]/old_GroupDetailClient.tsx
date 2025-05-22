// /src/app/(site)/community/groups/[id]/GroupDetailClient.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import Breadcrumb from '../../../../../components/Breadcrumb';
import { Users, Calendar, Book, MessageSquare, FileText, Heart, Video, Clock, RepeatIcon, Loader2, Save, Trash2, Lock, Shield, User, ExternalLink, Edit, X, Maximize2 } from 'lucide-react';
import { DEFAULT_USER_IMAGE } from '@/lib/constants';
import { PrayerRequestList } from '@/components/Prayer/PrayerRequestList';
import ManageMembersModal from './components/ManageMembersModal';
import ProfileImageModal from './components/ProfileImageModal';
import { Input } from "@nextui-org/input";
import { Chip } from "@nextui-org/chip";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { TimeInput, Slider } from "@nextui-org/react";
import { Time } from "@internationalized/date";
import { ZoomMeetingForm } from '@/components/ZoomMeetingForm';
import ZoomMeetingModal from '@/components/ZoomMeetingModal';
import type { ZoomMeetingDetails } from '@/lib/zoom';
import { format } from 'date-fns';
import { ChatBox } from '@/components/agentsStudy/ChatBox';
import { Message, ReactionType } from '@/types/agents-study-group-chat-messages';
import useSWR from 'swr';
import DOMPurify from 'isomorphic-dompurify';

import { Editor } from '@tinymce/tinymce-react';
import tinymce from 'tinymce';
import { getGroupFileUrl } from '@/lib/constants';
import { Divider } from "@nextui-org/react";
import { UserChatModal } from '@/components/agentsStudy/UserChatModal';
import { 
  getUserImage, 
  getUserDisplayName, 
  hasPermission, 
  getActiveMembers, 
  getMemberCount, 
  isGroupMember,
  type GroupMember 
} from '@/lib/group-utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Group {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  owner_id: string;
  is_private: boolean;
  meeting_schedule: string | null;
  location: string | null;
  current_topic: string | null;
  language: string;
  visibility: string;
  created_at: Date;
  updated_at: Date;
  leader: {
    id: string;
    name: string;
    image: string | null;
  };
  member_count: number;
  isMember: boolean;
  zoom_meeting_id?: string | null;
  zoom_session_id?: string | null;
  zoom_meeting_name?: string | null;
  zoom_start_time?: string | null;
  zoom_duration?: number | null;
  zoom_recurrence?: {
    type: 1 | 2 | 3;
    repeat_interval: number;
    end_date_time: string;
  } | null;
  members: Member[];
  messages: Message[];
}

interface Member {
  id: string;
  user_id: string;
  name: string;
  image: string | null;
  role: string;
  status: string;
  joined_at: string;
  first_name?: string;
  last_name?: string;
}

interface Note {
  id: string;
  content: string;
  title: string;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  created_at: string;
  user: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    image: string | null;
  };
}

interface GroupFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    image: string | null;
  };
}

interface GroupDetailClientProps {
  id: string;
}

interface BlobInfo {
  id: () => string;
  name: () => string;
  filename: () => string;
  blob: () => Blob;
  base64: () => string;
  blobUri: () => string;
  uri: () => string | undefined;
}

interface ChatSummary {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  messageCount: number;
  lastMessage?: {
    id: string;
    content: { text: string };
    created_at: string;
  };
}

interface WhiteBoardContent {
  title: string;
  content: string;
  day: string;
}

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy');
};

// Add tab type for better type safety
type TabType = 'whiteboard' | 'info' | 'members' | 'notes' | 'prayers' | 'chat';

// Update sanitize config to allow more tags and attributes
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'p', 'br', 'div', 'span',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'video', 'audio', 'source', 'iframe', 'embed',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'section', 'article', 'figure', 'figcaption'
  ],
  ALLOWED_ATTR: [
    'class', 'href', 'target', 'rel', 'id', 'style',
    'src', 'alt', 'title', 'width', 'height',
    'frameborder', 'allowfullscreen', 'controls',
    'type', 'data-mce-src', 'data-mce-style',
    'colspan', 'rowspan', 'cellpadding', 'cellspacing',
    'border', 'autoplay', 'muted', 'loop', 'poster'
  ],
  ALLOWED_STYLES: [
    'text-align', 'margin', 'padding',
    'width', 'height', 'max-width',
    'color', 'background', 'background-color',
    'border', 'font-size', 'font-family',
    'display', 'float', 'vertical-align'
  ]
};

interface GroupDetailClientProps {
  id: string;
}

type CustomHeaders = Record<string, string>;

export default function GroupDetailClient({ id }: GroupDetailClientProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('whiteboard');
  const [newNote, setNewNote] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'PRIVATE' | 'LEADER' | 'GROUP'>('GROUP');
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [scheduleTime, setScheduleTime] = useState<Time | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLeadersOnly, setIsLeadersOnly] = useState(false);
  const [isGroupNote, setIsGroupNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prayerContent, setPrayerContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isGroupOnly, setIsGroupOnly] = useState(false);
  const [isSavingPrayer, setIsSavingPrayer] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [currentZoomMeeting, setCurrentZoomMeeting] = useState<ZoomMeetingDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);  
  
  // Add state near the top with other state declarations
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Add whiteboard state variables
  const [isWhiteBoardExpanded, setIsWhiteBoardExpanded] = useState(false);
  const [whiteBoardContent, setWhiteBoardContent] = useState("");
  const [isEditWhiteBoardOpen, setIsEditWhiteBoardOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [whiteBoardTitle, setWhiteBoardTitle] = useState("");
  const [whiteBoardDay, setWhiteBoardDay] = useState(new Date().toISOString().split('T')[0]);
  const [whiteBoards, setWhiteBoards] = useState<WhiteBoardContent[]>([]);
  const [selectedWhiteBoard, setSelectedWhiteBoard] = useState<WhiteBoardContent | null>(null);
  const [whiteBoardHtml, setWhiteBoardHtml] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Add state for chat modal
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Add new state for file browser
  const [groupFiles, setGroupFiles] = useState<GroupFile[]>([]);

  // Add state for selected chat user
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);

  // Add new state for user chat modal
  const [isUserChatModalOpen, setIsUserChatModalOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const { data: groupData, mutate } = useSWR<Group>(`/api/agents-study-groups/${id}`, fetcher);

  const [godV2UserId, setGodV2UserId] = useState<string | null>(session?.user?.id || null);
  const [isMember, setIsMember] = useState(false);

  // Add WebSocket and polling state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const groupId = group?.id;

  // Add state for saving
  const [isSavingWhiteboard, setIsSavingWhiteboard] = useState(false);

  // Add this state to track if user has permission to view notes
  const [hasNotesAccess, setHasNotesAccess] = useState<boolean | null>(null);

  // console.log('godV2UserId:', godV2UserId);

  // Function declarations
  const fetchMessages = useCallback(async () => {
    if (!id || !godV2UserId || !group?.id || !members?.length) {
      console.log('Missing required data for fetchMessages:', { 
        groupId: id, 
        userId: godV2UserId, 
        currentGroupId: group?.id,
        hasMembers: !!members?.length 
      });
      return;
    }
    
    // Check membership using both ACTIVE and ACCEPTED status
    const membershipCheck = members.some((member: Member) => 
      member.user_id === godV2UserId && 
      (member.status === 'ACCEPTED' || member.status === 'ACTIVE')
    );

    if (!membershipCheck && !isLeader) {
      console.log('User is not an active member:', {
        userId: godV2UserId,
        members: members.map((member: Member) => ({
          user_id: member.user_id,
          status: member.status
        }))
      });
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-god-v2-user-id': godV2UserId
      };

      const response = await fetch(`/api/agents-study-groups/${id}/chat`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch messages:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          headers: Object.fromEntries(response.headers)
        });
        
        if (response.status === 401) {
          console.error('Authentication error - godV2UserId might be invalid');
          return;
        }
        
        throw new Error(`Failed to fetch messages: ${errorText}`);
      }
      
      const data = await response.json();
      const messageArray = Array.isArray(data.messages) ? data.messages : 
                       Array.isArray(data) ? data : [];
      
      setMessages(messageArray);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error instanceof Error && !error.message.includes('401')) {
        toast.error('Failed to fetch messages');
      }
    }
  }, [id, godV2UserId, group, members, isLeader]);

  // Move initializeGodV2UserId outside useEffect
  const initializeGodV2UserId = async () => {
    if (!session?.user?.email) return null;

    try {
      const response = await fetch(`/api/user/god-v2-id?email=${encodeURIComponent(session.user.email)}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch godV2UserId:', {
          status: response.status,
          error: errorText
        });
        return null;
      }
      const data = await response.json();
      if (data.id) {
        console.log('Setting godV2UserId:', data.id);
        setGodV2UserId(data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Error fetching godV2UserId:', error);
    }
    return null;
  };

  // Update fetchMembers to use the group endpoint first
  const fetchMembers = async () => {
    try {
      // {DEBUG} Log request details
      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Fetching members for group:', id);
      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Current user ID:', session?.user?.id);
      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Current godV2UserId:', godV2UserId);

      const response = await fetch(`/api/agents-study-groups/${id}/members`);
      
      // {DEBUG} Log response status
      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Members API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Members API error:', {
        //   status: response.status,
        //   error: errorData,
        //   headers: Object.fromEntries(response.headers.entries()),
        //   userId: godV2UserId
        // });
        throw new Error(`Failed to fetch members: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // {DEBUG} Log fetched members data
      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Fetched members:', {
      //   count: data.members.length,
      //   members: data.members.map((m: any) => ({
      //     id: m.id,
      //     name: `${m.first_name} ${m.last_name}`,
      //     email: m.email,
      //     role: m.role,
      //     status: m.status,
      //     isCurrentUser: m.id === session?.user?.id
      //   }))
      // });

      setMembers(data.members);
      setFilteredMembers(data.members);

      // {DEBUG} Check if current user is in members
      const currentUserMember = data.members.find((m: any) => m.id === session?.user?.id);
      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Current user membership:', currentUserMember ? {
      //   role: currentUserMember.role,
      //   status: currentUserMember.status,
      //   joined_at: currentUserMember.joined_at
      // } : 'Not a member');

    } catch (error) {
      // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Error fetching members:', error);
      toast.error('Failed to fetch group members');
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to use the moved initializeGodV2UserId
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    let isSubscribed = true;

    const fetchAllData = async () => {
      if (!isSubscribed || !id || !session?.user) return;

      try {
        setIsLoading(true);
        
        // Initialize godV2UserId first and get the value
        const userId = await initializeGodV2UserId();
        const currentGodV2UserId = userId || godV2UserId;
        
        if (!currentGodV2UserId) {
          // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Missing godV2UserId after initialization');
          return;
        }

        // Debug: List all users first
        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Fetching all users to verify database state');
        const allUsersResponse = await fetch('/api/users/list', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (allUsersResponse.ok) {
          const allUsers = await allUsersResponse.json();
          // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx All users in database:', allUsers);
        } else {
          // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Failed to fetch users:', await allUsersResponse.text());
        }

        // Debug: Check user existence
        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Checking current user existence:', {
        //   currentGodV2UserId,
        //   sessionUserId: session?.user?.id,
        //   sessionUserEmail: session?.user?.email
        // });

        const userCheckResponse = await fetch(`/api/user/check/${currentGodV2UserId}`);
        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx User check response:', {
        //   status: userCheckResponse.status,
        //   ok: userCheckResponse.ok,
        //   userId: currentGodV2UserId
        // });

        if (!userCheckResponse.ok) {
          const errorText = await userCheckResponse.text();
          // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx User check failed:', {
          //   status: userCheckResponse.status,
          //   error: errorText,
          //   userId: currentGodV2UserId
          // });
        }

        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': currentGodV2UserId
        };

        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Fetching data with headers:', headers);
        
        // Fetch group data first
        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Fetching group data for ID:', id);
        const groupResponse = await fetch(`/api/agents-study-groups/${id}`, {
          headers,
          credentials: 'include'
        });

        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Group response:', {
        //   status: groupResponse.status,
        //   ok: groupResponse.ok,
        //   headers: Object.fromEntries(groupResponse.headers)
        // });

        if (!groupResponse.ok) {
          const errorText = await groupResponse.text();
          // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Failed to fetch group:', {
          //   status: groupResponse.status,
          //   error: errorText,
          //   headers: Object.fromEntries(groupResponse.headers)
          // });
          throw new Error(`Failed to fetch group details: ${errorText}`);
        }

        const groupData = await groupResponse.json();
        //console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Group data:', groupData);

        if (!groupData.group) {
          throw new Error('Group not found');
        }
        
        // Fetch members with verified group
        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Fetching members for group:', id);
        const membersResponse = await fetch(`/api/agents-study-groups/${id}/members`, {
          headers,
          credentials: 'include'
        });

        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Members response:', {
        //   status: membersResponse.status,
        //   ok: membersResponse.ok,
        //   headers: Object.fromEntries(membersResponse.headers)
        // });

        if (!membersResponse.ok) {
          const errorText = await membersResponse.text();
          // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Failed to fetch members:', {
          //   status: membersResponse.status,
          //   error: errorText,
          //   headers: Object.fromEntries(membersResponse.headers),
          //   userId: currentGodV2UserId
          // });
          throw new Error(`Failed to fetch members: ${errorText}`);
        }

        const membersData = await membersResponse.json();
        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Members data:', membersData);

        if (!membersData.members) {
          // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Invalid members data:', membersData);
          throw new Error('Invalid members data received');
        }

        // Transform members data with proper typing
        const transformedMembers = membersData.members.map((m: any) => ({
          id: m.user_id || m.id,
          user_id: m.user_id || m.id,
          name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown User',
          image: m.image,
          role: m.role || 'MEMBER',
          status: m.status || 'ACTIVE',
          joined_at: m.joined_at || new Date().toISOString()
        }));

        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Transformed members:', transformedMembers);

        // Find the current user in members list
        const userMember = transformedMembers.find((m: Member) => 
          m.user_id === currentGodV2UserId || m.id === currentGodV2UserId
        );
        
        const isUserLeader = groupData.group.leader_id === currentGodV2UserId;
        const isUserAdmin = userMember?.role === 'ADMIN';
        
        // Check membership status using both user_id and id
        const isMemberStatus = transformedMembers.some((member: Member) => 
          (member.user_id === currentGodV2UserId || member.id === currentGodV2UserId) && 
          (member.status === 'ACTIVE' || member.status === 'ACCEPTED')
        );

        // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Membership check:', {
        //   currentGodV2UserId,
        //   isUserLeader,
        //   isUserAdmin,
        //   isMemberStatus,
        //   userMember,
        //   membershipCriteria: {
        //     matchingIds: transformedMembers.filter((m: Member) => 
        //       m.user_id === currentGodV2UserId || m.id === currentGodV2UserId
        //     ),
        //     activeStatuses: transformedMembers.filter((m: Member) => 
        //       m.status === 'ACTIVE' || m.status === 'ACCEPTED'
        //     )
        //   }
        // });

        if (isSubscribed) {
          const groupWithDates = {
            ...groupData.group,
            created_at: new Date(groupData.group.created_at),
            updated_at: new Date(groupData.group.updated_at),
            member_count: transformedMembers.length,
            isMember: isMemberStatus || isUserLeader || isUserAdmin
          };

          // Set all state at once to avoid race conditions
          setGroup(groupWithDates);
          setMembers(transformedMembers);
          setIsMember(isMemberStatus || isUserLeader || isUserAdmin);
          setIsLeader(isUserLeader);
          setIsAdmin(isUserAdmin);

          console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Final state update:', {
            group: groupWithDates,
            isMember: isMemberStatus || isUserLeader || isUserAdmin,
            isLeader: isUserLeader,
            isAdmin: isUserAdmin
          });
        }
      } catch (error) {
        // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Error fetching data:', error);
        if (isSubscribed) {
          toast.error('Failed to load group data');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isSubscribed = false;
    };
  }, [id, session?.user, session?.user?.email, godV2UserId, router, sessionStatus]);

  // Remove other message fetching effects
  
  // WebSocket cleanup effect
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
        setWs(null);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [ws, pollInterval]);

  // Update where the editor is opened (likely in renderWhiteBoardContent or similar)
  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };
  
  // Update fetchGodV2UserId to return the ID
  const fetchGodV2UserId = async (email: string) => {
    try {
      const response = await fetch(`/api/users/god-v2-id?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch God V2 user ID');
      }
      const data = await response.json();
      return data.godV2UserId;
    } catch (error) {
      console.error('Error fetching God V2 user ID:', error);
      return null;
    }
  };

  // Update useEffect for loading whiteboards
  useEffect(() => {
    const loadWhiteBoardsIfMember = async () => {
      // Wait for both group and godV2UserId to be available
      if (!group?.id || !godV2UserId) {
        console.log('Waiting for required data:', { 
          hasGroupId: !!group?.id, 
          godV2UserId 
        });
        return;
      }

      try {
        // Check membership status first
        const membershipCheck = members.find((m: Member) => 
          (m.user_id === godV2UserId || m.id === godV2UserId) && 
          (m.status === 'ACCEPTED' || m.status === 'ACTIVE')
        );

        if (!membershipCheck && !isLeader) {
          console.log('Membership check failed:', {
            godV2UserId,
            memberStatuses: members.map(m => ({
              user_id: m.user_id,
              status: m.status
            }))
          });
          return;
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': godV2UserId
        };

        //console.log('Fetching whiteboards with headers:', headers);

        const response = await fetch(`/api/agents-study-groups/${group.id}/whiteboards`, {
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to load whiteboards:', {
            status: response.status,
            error: errorText,
            headers: Object.fromEntries(response.headers)
          });
          throw new Error(`Failed to load whiteboards: ${errorText}`);
        }
        
        const data = await response.json();
        const formattedWhiteboards = data.whiteboards?.map((wb: any) => ({
          title: wb.title,
          content: wb.content,
          day: wb.day
        })) || [];

        setWhiteBoards(formattedWhiteboards);
      } catch (error) {
        console.error('Error loading whiteboards:', error);
        toast.error('Failed to load whiteboards');
        setWhiteBoards([]);
      }
    };

    // Only attempt to load whiteboards if we have group data and members data
    if (group?.id && members.length > 0) {
      loadWhiteBoardsIfMember();
    }
  }, [group?.id, godV2UserId, members, isLeader]); // Add isLeader to dependencies

  // Update loadWhiteBoards function
  const loadWhiteBoards = async () => {
    if (!group?.id || !godV2UserId || !session?.user) return;
    
    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/whiteboards`, {
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
  };

  // Update the fetchNotes function
  const fetchNotes = async () => {
    if (!id || !godV2UserId || hasNotesAccess === false) return;

    // Check if user is a member first
    const isMember = isGroupMember(godV2UserId, members);
    if (!isMember) {
      setHasNotesAccess(false);
      setNotes([]);
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${id}/notes`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': godV2UserId
        }
      });
      
      if (response.status === 403) {
        setHasNotesAccess(false);
        setNotes([]);
        return;
      }

      const data = await response.json();
      
      if (response.ok && data.success) {
        setHasNotesAccess(true);
        setNotes(data.notes);
      } else {
        console.error('Error fetching notes:', data);
        toast.error(data.error || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Error loading notes');
    }
  };

  useEffect(() => {
    if (!session?.user || !group?.isMember || !group?.id) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/agents-study-groups/${group.id}/chat`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(godV2UserId ? { 'x-god-v2-user-id': godV2UserId } : {})
          }
        });
        if (!response.ok) {
          console.error('Failed to fetch messages:', await response.text());
          return;
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(fetchMessages, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [group?.id, session?.user, group?.isMember, godV2UserId]);

  // Remove the separate membership effect since we're handling it in fetchMessages
  useEffect(() => {
    if (group && session?.user?.id) {
      const isUserLeader = group.leader_id === session.user.id;
      setIsLeader(isUserLeader);
      
      // Check if user is an admin
      const userMember = members.find(member => member.user_id === session.user.id);
      setIsAdmin(userMember?.role === 'ADMIN');
    }
  }, [group, session, members]);

  const handleJoinGroup = async () => {
    if (!id || !godV2UserId) {
      console.error('Missing required data for joining group:', { id, godV2UserId });
      return;
    }

    try {
      setIsJoining(true);
      
      // Check if user is already a member
      const isMember = isGroupMember(godV2UserId, members);
      
      if (isMember) {
        // Handle leaving the group
        const response = await fetch(`/api/agents-study-groups/${id}/members`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-god-v2-user-id': godV2UserId
          }
        });

        if (!response.ok) {
          throw new Error('Failed to leave group');
        }
      } else {
        // Handle joining the group
        const response = await fetch(`/api/agents-study-groups/${id}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-god-v2-user-id': godV2UserId
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to join group');
        }
      }

      // Refresh members list
      await fetchMembers();
      
      // Show success message
      toast.success(isMember ? 'Successfully left the group' : 'Successfully joined the group');
    } catch (error) {
      console.error('Error joining/leaving group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join/leave group');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast.error('Note title and content cannot be empty');
      return;
    }

    if (!session || !godV2UserId) {
      toast.error('Please Log In to add notes');
      return;
    }

    // Check if user is an active member using group-utils
    if (!isGroupMember(godV2UserId, members)) {
      toast.error('You must be a member to add notes');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        body: JSON.stringify({ 
          content: noteContent,
          title: noteTitle,
          visibility: isPrivate ? 'PRIVATE' : isLeadersOnly ? 'LEADER' : 'GROUP'
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || 'Note added successfully');
        setNoteTitle('');
        setNoteContent('');
        setIsPrivate(false);
        setIsLeadersOnly(false);
        setIsGroupNote(false);
        setIsEditingNote(false);
        fetchNotes(); // Refresh notes after adding
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error adding note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const insertAtCursor = (content: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const before = whiteBoardContent.substring(0, startPos);
    const after = whiteBoardContent.substring(endPos);
    
    setWhiteBoardContent(before + content + after);
    
    // Set cursor position after inserted content
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = startPos + content.length;
      textarea.focus();
    }, 0);
  };

  // Add handleFileUpload function
  const handleFileUpload = async (fileOrBlobInfo: File | BlobInfo): Promise<{ location: string }> => {
    if (!group) {
      toast.error('Group not found');
      throw new Error('Group not found');
    }

    try {
      const file = fileOrBlobInfo instanceof File ? fileOrBlobInfo : fileOrBlobInfo.blob();
      const fileName = fileOrBlobInfo instanceof File ? fileOrBlobInfo.name : fileOrBlobInfo.filename();

      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Starting file upload:', {
      //   name: fileName,
      //   type: file.type,
      //   size: file.size
      // });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', group.id);

      const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData
      });

      // First try to get the response as text
      const responseText = await response.text();
      let data;

      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Failed to parse response as JSON:', responseText);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Upload error response:', data);
        throw new Error(data.details || data.error || 'Upload failed');
      }

      // console.log('[DEBUG]  groups/[id]/GroupDetailClient.tsx Upload success:', data);

      // Refresh file list after upload
      fetchGroupFiles();

      // Return the location for TinyMCE
      return {
        location: data.file.url
      };
    } catch (error) {
      // console.error('[DEBUG]  groups/[id]/GroupDetailClient.tsx Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
      throw error;
    }
  };

  // Update renderFileBrowser function
  const renderFileBrowser = () => {
    if (!group?.isMember) {
      return (
        <div className="mt-4 p-4 border rounded-lg light:bg-white dark:bg-dark text-center">
          <p className="text-body-color dark:text-gray-400">
            Join the group to view and share files.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 border rounded-lg p-4 light:bg-white dark:bg-dark">
        <h3 className="text-lg font-semibold mb-4">Group Files</h3>
        {groupFiles?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-2 border rounded light:bg-white dark:bg-dark"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <Button
                    size="sm"
                    color="primary"
                    className="text-white"
                    as="a"
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </Button>
                  {session?.user?.id === file?.user?.id && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-body-color dark:text-gray-400">
              No files have been shared in this group yet.
            </p>
            <p className="text-sm text-body-color dark:text-gray-400 mt-2">
              Share files by using the editor above.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Update fetchGroupFiles function
  const fetchGroupFiles = async () => {
    if (!group?.id) return;
    
    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/files`);
      if (!response.ok) {
        console.error('Failed to fetch files:', await response.text());
        setGroupFiles([]);
        return;
      }
      const data = await response.json();
      setGroupFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching group files:', error);
      setGroupFiles([]);
    }
  };

  // Add delete file handler
  const handleDeleteFile = async (fileId: string) => {
    if (!group?.id) return;

    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('File deleted successfully');
        fetchGroupFiles();
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  // Add useEffect to fetch files on mount
  useEffect(() => {
    if (group?.id) {
      fetchGroupFiles();
    }
  }, [group?.id]);

  const renderZoomMeeting = () => {
    if (!group?.isMember) {
      return null;
    }

    const hasExistingMeeting = group.zoom_meeting_id && group.zoom_start_time;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="w-5 h-5" />
            <span>Video Meetings</span>
          </h3>
        </div>

        {hasExistingMeeting ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">{group.zoom_meeting_name}</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(group.zoom_start_time!), 'MMMM d, yyyy h:mm a')}</span>
                </div>
                {group.zoom_duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{group.zoom_duration} minutes</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <div className="bg-transparent dark:bg-dark rounded-lg shadow-sm p-6">
                {(isLeader || isAdmin) && (
                    <button
                      onClick={() => setIsZoomModalOpen(true)}
                      className="hero-button-gradient px-4 py-2 rounded-lg text-sm light:text-white dark:text-white flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      {currentZoomMeeting ? 'Manage Meeting' : 'Create Meeting'}
                    </button>
                  )}
                </div>
                {(isLeader || isAdmin) && (
                  <div className="bg-transparent dark:bg-dark rounded-lg shadow-sm p-6">
                    <button
                      onClick={handleDeleteMeeting}
                      className="hero-button-gradient px-4 py-2 rounded-lg text-sm light:text-white dark:text-white flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Meeting
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <ZoomMeetingForm groupId={group.id} />
        )}

        <ZoomMeetingModal
          isOpen={isZoomModalOpen}
          onClose={() => setIsZoomModalOpen(false)}
          meetingDetails={currentZoomMeeting}
          groupId={group.id}
          isLeader={isLeader}
          isAdmin={isAdmin}
          onCreateMeeting={handleCreateMeeting}
        />
      </div>
    );
  };

  const handleCreateMeeting = async (meetingData: ZoomMeetingDetails) => {
    try {
      setCurrentZoomMeeting(meetingData);
      toast.success('Meeting created successfully');
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    }
  };

  const handleDeleteMeeting = async () => {
    if (!group?.zoom_session_id) return;

    try {
      const response = await fetch(`/api/agents-study-groups/${id}/zoom`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Zoom meeting deleted successfully');
        fetchGroup(); // Refresh group data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete Zoom meeting');
      }
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error);
      toast.error('Error deleting Zoom meeting');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${id}/notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Note deleted successfully');
        fetchNotes();
      } else {
        throw new Error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note. Please try again.');
    }
  };

  const handleSavePrayer = async () => {
    if (!prayerContent.trim()) {
      toast.error('Prayer request cannot be empty');
      return;
    }

    if (!session) {
      toast.error('Please Log In to submit prayer requests');
      return;
    }

    if (!group?.isMember) {
      toast.error('You must be a member to submit prayer requests');
      return;
    }

    setIsSavingPrayer(true);
    try {
      const response = await fetch(`/api/agents-study-groups/${id}/prayers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: prayerContent,
          isAnonymous: isAnonymous,
          isGroupOnly: isGroupOnly,
          isPublic: !isGroupOnly
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || 'Prayer request submitted successfully');
        setPrayerContent('');
        setIsAnonymous(false);
        setIsGroupOnly(false);
        fetchNotes();
      } else {
        toast.error(data.error || 'Failed to submit prayer request');
        console.error('Error response:', data);
      }
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      toast.error('Error submitting prayer request. Please try again.');
    } finally {
      setIsSavingPrayer(false);
    }
  };

  const handleMeetingCreated = async (meeting: any) => {
    // Refresh the meetings list or update UI as needed
    router.refresh();
  };

  const handleSendMessage = async (message: string) => {
    if (!id || !godV2UserId) {
      console.error('Missing required data for sending message:', { id, godV2UserId });
      return;
    }

    // Validate message content
    if (!message || message.trim().length === 0) {
      toast.error('Message content is required');
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        body: JSON.stringify({ 
          content: {
            text: message.trim(),
            type: 'text',
            files: [],
            edited: false,
            mentions: [],
            edited_at: null,
            reactions: {}
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Refresh messages after sending
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!id || !godV2UserId) {
      console.error('Missing required data for deleting message:', { id, godV2UserId });
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${id}/chat/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete message');
      }

      // Refresh messages after deletion
      fetchMessages();
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete message');
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    if (!id || !godV2UserId) {
      console.error('Missing required data for reacting to message:', { id, godV2UserId });
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${id}/chat/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        body: JSON.stringify({ reaction })
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Update the messages state when group data changes
  useEffect(() => {
    if (group?.messages) {
      setMessages(group.messages);
    }
  }, [group]);

  // Update the Slider onChange handler
  const handleSliderChange = (value: number | number[]) => {
    setScrollPosition(Array.isArray(value) ? value[0] : value);
  };

  // Update the editor component
  const renderEditor = () => {
    if (!group) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
        <div 
          className="light:bg-white dark:bg-dark rounded-lg w-full flex flex-col relative" 
          style={{ 
            height: 'calc(75vh - 20px)',
            width: 'calc(95vw - 40px)',
            maxWidth: '2000px'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the modal
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold">New Whiteboard</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const editor = tinymce.get('whiteboard-editor');
                  if (editor) {
                    editor.execCommand('mceFullScreen');
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Fullscreen
              </button>
              <button
                onClick={() => {
                  setIsEditorOpen(false);
                  setIsEditWhiteBoardOpen(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Whiteboard Selection */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 light:text-black dark:text-white light:bg-white dark:bg-dark rounded-lg p-2">
                  Select Whiteboard
                </label>
                <select
                  value={selectedWhiteBoard ? `${selectedWhiteBoard.title}|${selectedWhiteBoard.day}` : ''}
                  onChange={(e) => {
                    const [title, day] = e.target.value.split('|');
                    const selected = whiteBoards.find(wb => 
                      wb.title === title && wb.day === day
                    );
                    if (selected) {
                      setSelectedWhiteBoard(selected);
                      setWhiteBoardTitle(selected.title);
                      setWhiteBoardDay(selected.day);
                      setWhiteBoardContent(selected.content);
                    } else {
                      setSelectedWhiteBoard(null);
                      setWhiteBoardTitle('');
                      setWhiteBoardDay(new Date().toISOString().split('T')[0]);
                      setWhiteBoardContent('');
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent light:text-black dark:text-white light:bg-white dark:bg-dark"
                >
                  <option value="">Create New Whiteboard</option>
                  {whiteBoards.map((wb, index) => (
                    <option key={`${wb.title}|${wb.day}|${index}`} value={`${wb.title}|${wb.day}`}>
                      {wb.title} - {new Date(wb.day).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              {selectedWhiteBoard && (
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this whiteboard?')) {
                      try {
                        // Format the date to match the database format (YYYY-MM-DD)
                        const formattedDate = new Date(selectedWhiteBoard.day).toISOString().split('T')[0];
                        
                        const response = await fetch(`/api/agents-study-groups/${id}/whiteboards`, {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-god-v2-user-id': godV2UserId || ''
                          },
                          body: JSON.stringify({
                            title: selectedWhiteBoard.title,
                            day: formattedDate,
                            group_id: id
                          })
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || 'Failed to delete whiteboard');
                        }

                        const data = await response.json();
                        toast.success(data.message || 'Whiteboard deleted successfully');
                        setSelectedWhiteBoard(null);
                        setWhiteBoardTitle('');
                        setWhiteBoardDay(new Date().toISOString().split('T')[0]);
                        setWhiteBoardContent('');
                        // Refresh whiteboards
                        loadWhiteBoards();
                      } catch (error) {
                        console.error('Error deleting whiteboard:', error);
                        toast.error(error instanceof Error ? error.message : 'Error deleting whiteboard');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-8"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Form Fields - Title and Date in same row */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="whiteBoardTitle" className="block text-sm font-medium mb-2">
                  Title
                </label>
                <input
                  id="whiteBoardTitle"
                  type="text"
                  value={whiteBoardTitle}
                  onChange={(e) => setWhiteBoardTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                  placeholder="Enter whiteboard title..."
                />
              </div>

              <div className="w-1/3">
                <label htmlFor="whiteBoardDay" className="block text-sm font-medium mb-2">
                  Date
                </label>
                <input
                  id="whiteBoardDay"
                  type="date"
                  value={whiteBoardDay}
                  onChange={(e) => setWhiteBoardDay(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                color="primary"
                isLoading={isSavingWhiteboard}
                onClick={async () => {
                  try {
                    setIsSavingWhiteboard(true);
                    const editor = tinymce.get('whiteboard-editor');
                    if (editor) {
                      const content = editor.getContent();
                      await saveWhiteBoards([{
                        title: whiteBoardTitle,
                        content,
                        day: whiteBoardDay
                      }]);
                      toast.success('Whiteboard saved successfully');
                      setIsEditorOpen(false);
                      setIsEditWhiteBoardOpen(false);
                    }
                  } catch (error) {
                    console.error('Error saving whiteboard:', error);
                    toast.error('Failed to save whiteboard');
                  } finally {
                    setIsSavingWhiteboard(false);
                  }
                }}
                className="text-white light:text-white dark:text-white"
              >
                {isSavingWhiteboard ? 'Saving...' : 'Save Whiteboard'}
              </Button>
            </div>
          </div>

          {/* Page Separator */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Content</h3>
          </div>

          {/* Editor Container */}
          <div className="flex-1 p-4 overflow-hidden">
            <Editor
              apiKey={process.env.TINYMCE_API_KEY}
              id="whiteboard-editor"
              init={{
                height: '100%',
                width: "100%",
                menubar: true,
                statusbar: true,
                resize: false,
                min_height: 500,
                toolbar_sticky: true,
                toolbar_sticky_offset: 0,
                autoresize_bottom_margin: 0,
                fullscreen_native: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
                  'emoticons', 'codesample'
                ],
                toolbar: [
                  'undo redo | styles | bold italic underline strikethrough',
                  'alignleft aligncenter alignright alignjustify | outdent indent',
                  'numlist bullist | forecolor backcolor | link image media',
                  'table emoticons codesample | preview fullscreen',
                  'removeformat help | uploadfile'
                ].join(' | '),
                // Theme settings
                skin: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'oxide-dark' : 'oxide',
                content_css: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                promotion: false,
                branding: false,
                // Image and media settings
                image_title: true,
                image_description: true,
                image_dimensions: true,
                image_advtab: true,
                image_caption: true,
                media_alt_source: true,
                media_poster: true,
                media_dimensions: true,
                media_live_embeds: true,
                // Upload settings
                automatic_uploads: true,
                file_picker_types: 'file image media',
                images_upload_handler: async (blobInfo) => {
                  try {
                    const result = await handleFileUpload(blobInfo);
                    return result.location;
                  } catch (error) {
                    console.error('Image upload error:', error);
                    throw error;
                  }
                },
                file_picker_callback: function(callback, value, meta) {
                  const input = document.createElement('input');
                  input.setAttribute('type', 'file');
                  
                  if (meta.filetype === 'image') {
                    input.setAttribute('accept', 'image/*');
                  } else if (meta.filetype === 'media') {
                    input.setAttribute('accept', 'video/*,audio/*');
                  } else {
                    input.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx');
                  }

                  input.onchange = async function() {
                    const file = input.files?.[0];
                    if (!file) return;

                    try {
                      const result = await handleFileUpload(file);
                      callback(result.location, { 
                        title: file.name,
                        alt: file.name,
                        width: '800',
                        height: meta.filetype === 'image' ? '600' : '400',
                        source: result.location,
                        "data-filename": file.name
                      });
                    } catch (error) {
                      console.error('File upload error:', error);
                      toast.error('Failed to upload file');
                    }
                  };

                  input.click();
                },
                // Element settings
                extended_valid_elements: 'img[class|src|alt|title|width|height|data-filename],video[*],source[*],audio[*]',
                // Editor setup
                setup: function (editor) {
                  editor.on('ObjectSelected', function (e) {
                    if (e.target.nodeName === 'IMG' && !e.target.getAttribute('alt')) {
                      const filename = e.target.getAttribute('data-filename') || 'image';
                      e.target.setAttribute('alt', filename);
                    }
                  });
                },
                content_style: `
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    font-size: 16px;
                    line-height: 1.5;
                    padding: 1rem;
                    min-height: 400px;
                    direction: ltr !important;
                    text-align: left !important;
                    ${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') 
                      ? 'background-color: rgb(31 41 55); color: rgb(229 231 235);' 
                      : 'background-color: rgb(255 255 255); color: rgb(17 24 39);'
                    }
                  }
                `
              }}
              value={whiteBoardContent}
              onEditorChange={(content, editor) => {
                setWhiteBoardContent(content);
                setWhiteBoardHtml(content);
              }}
            />
          </div>

          {/* Footer with Save/Cancel buttons */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditWhiteBoardOpen(false);
                setWhiteBoardContent("");
                setWhiteBoardTitle("");
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!whiteBoardTitle.trim()) {
                  toast.error('Please enter a title for the whiteboard');
                  return;
                }
                if (!whiteBoardContent.trim()) {
                  toast.error('Please enter some content for the whiteboard');
                  return;
                }
                try {
                  await saveWhiteBoards([{
                    title: whiteBoardTitle,
                    content: whiteBoardContent,
                    day: whiteBoardDay
                  }]);
                  setIsEditWhiteBoardOpen(false);
                  setWhiteBoardContent("");
                  setWhiteBoardTitle("");
                  loadWhiteBoards();
                  toast.success('Whiteboard saved successfully');
                } catch (error) {
                  console.error('Error saving whiteboard:', error);
                  toast.error('Failed to save whiteboard');
                }
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-80"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Update the save function to use API
  const saveWhiteBoards = async (boards: WhiteBoardContent[]) => {
    if (!group?.id || !godV2UserId) return;
    
    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/whiteboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        body: JSON.stringify({ whiteboards: boards }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save whiteboards: ${errorText}`);
      }

      toast.success('Whiteboard saved successfully');
      await loadWhiteBoards(); // Refresh the whiteboards after saving
    } catch (error) {
      console.error('Error saving whiteboards:', error);
      toast.error('Failed to save whiteboard');
    }
  };

  // Update checkMembership function
  const checkMembership = useCallback(() => {
    if (!members || !godV2UserId) {
      // console.log('Missing data for membership check:', {
      //   hasMembersList: !!members,
      //   godV2UserId
      // });
      return false;
    }

    // console.log('Checking membership with:', {
    //   godV2UserId,
    //   sessionUserId: session?.user?.id,
    //   members: members.map(m => ({
    //     id: m.id,
    //     user_id: m.user_id,
    //     role: m.role
    //   }))
    // });

    // Check if the user is a member using ONLY the agents user ID
    const isMember = members.some(m => m.user_id === godV2UserId);

    // console.log('Membership check result:', isMember);
    return isMember;
  }, [members, godV2UserId]);

  // Add this before renderWhiteBoardContent function
  const sortWhiteBoards = (boards: WhiteBoardContent[]) => {
    return [...boards].sort((a, b) => {
      const dateA = new Date(a.day).getTime();
      const dateB = new Date(b.day).getTime();
      if (dateA === dateB) {
        // If dates are the same, sort by title
        return a.title.localeCompare(b.title);
      }
      return dateA - dateB; // Ascending order (oldest to newest)
    });
  };

  // Update the renderWhiteBoardContent function
  const renderWhiteBoardContent = () => {
    // Use isGroupMember instead of group.isMember
    const isMember = isGroupMember(godV2UserId || session?.user?.id, members);
    if (!isMember) {
      return (
        <div className="text-center py-8">
          <p className="text-body-color dark:text-gray-400">
            You must be a member of this group to view the whiteboard content.
          </p>
        </div>
      );
    }

    try {
      if (isEditWhiteBoardOpen) {
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Whiteboard</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditWhiteBoardOpen(false);
                    setWhiteBoardContent("");
                    setWhiteBoardTitle("");
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!whiteBoardTitle.trim()) {
                      toast.error('Please enter a title for the whiteboard');
                      return;
                    }
                    if (!whiteBoardContent.trim()) {
                      toast.error('Please enter some content for the whiteboard');
                      return;
                    }
                    try {
                      await saveWhiteBoards([{
                        title: whiteBoardTitle,
                        content: whiteBoardContent,
                        day: whiteBoardDay
                      }]);
                      setIsEditWhiteBoardOpen(false);
                      setWhiteBoardContent("");
                      setWhiteBoardTitle("");
                      loadWhiteBoards();
                    } catch (error) {
                      console.error('Error saving whiteboard:', error);
                      toast.error('Failed to save whiteboard');
                    }
                  }}
                  className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:opacity-80"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="whiteBoardTitle" className="block text-sm font-medium mb-2">
                  Title
                </label>
                <input
                  id="whiteBoardTitle"
                  type="text"
                  value={whiteBoardTitle}
                  onChange={(e) => setWhiteBoardTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                  placeholder="Enter whiteboard title..."
                />
              </div>

              <div>
                <label htmlFor="whiteBoardDay" className="block text-sm font-medium mb-2">
                  Date
                </label>
                <input
                  id="whiteBoardDay"
                  type="date"
                  value={whiteBoardDay}
                  onChange={(e) => setWhiteBoardDay(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Content
                </label>
                {renderEditor()}
              </div>
            </div>
          </div>
        );
      }

      const sortedWhiteBoards = sortWhiteBoards(whiteBoards || []);
      
      return (
        <div className="space-y-6">
          {/* Whiteboard Content */}
          <div className="space-y-8">
            {sortedWhiteBoards.length > 0 ? (
              sortedWhiteBoards.map((board: WhiteBoardContent, index: number) => (
                <div key={`${board.day}-${index}`} className="p-4 rounded-lg border light:bg-white dark:bg-dark">
                  <h3 className="text-xl font-semibold mb-4">{board.title}</h3>
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: board.content }} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No whiteboards created yet.</p>
                {(isLeader || isAdmin) && (
                  <p className="mt-2">
                    Click the "Edit WhiteBoard" button to create one.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering whiteboard:', error);
      return (
        <div className="p-4 text-center text-red-500">
          Error loading whiteboard content. Please try refreshing the page.
        </div>
      );
    }
  };

  const getChatSummaries = (messages: Message[]): ChatSummary[] => {
    const summaryMap = messages.reduce((acc, message) => {
      if (!message.user) return acc;
  
      const userId = message.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          firstName: message.user.first_name || '',
          lastName: message.user.last_name || '',
          role: members.find(m => m.id === userId)?.role || 'MEMBER',
          messageCount: 0,
          lastMessage: undefined
        };
      }
  
      acc[userId].messageCount++;
      if (
        !acc[userId].lastMessage ||
        (acc[userId].lastMessage && 
        new Date(message.created_at) > new Date(acc[userId].lastMessage!.created_at))
      ) {
        acc[userId].lastMessage = message;
      }
  
      return acc;
    }, {} as Record<string, ChatSummary>);
  
    return Object.values(summaryMap).sort((a, b) => {
      // Sort by role (Leader first, then Admin, then Member)
      const roleOrder = { LEADER: 0, ADMIN: 1, MEMBER: 2 };
      return roleOrder[a.role as keyof typeof roleOrder] - roleOrder[b.role as keyof typeof roleOrder];
    });
  };
  

  const renderChatTab = () => {
    // Update the membership check to use the same logic as canViewChat
    const isMember = isGroupMember(godV2UserId || session?.user?.id, members);
    if (!session?.user || !isMember) {
      return (
        <div className="text-center py-8">
          <p className="text-body-color dark:text-gray-400">
            You must be a member of this group to view the chat.
          </p>
        </div>
      );
    }

    try {
      const chatSummaries = getChatSummaries(messages || []);
      // Update the role check to use godV2UserId as well
      const userRole = members.find(m => m.user_id === (godV2UserId || session.user?.id))?.role;
      // All members can view messages
      const canViewMessages = userRole === 'LEADER' || userRole === 'ADMIN' || userRole === 'MEMBER';

      return (
        <div className="space-y-6">
          {/* Expand Chat Button Section */}
          <div className="p-4 bg-white/5 dark:bg-dark/5 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-black dark:text-white">Group Chat</h3>
                {canViewMessages && (
                  <button
                    onClick={() => setIsChatModalOpen(true)}
                    className="hero-button-gradient px-4 py-2 rounded-lg light:text-white dark:text-white hover:text-white flex items-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Expand Chat
                  </button>
                )}
              </div>
              <p className="text-sm text-body-color dark:text-gray-400">
                {canViewMessages ? 'Click \'Expand Chat\' to open the full chat interface.' : 'You must be a member to view chat messages.'}
              </p>
            </div>
          </div>

          {/* User Messages Summary */}
          {canViewMessages && (
            <div className="space-y-4">
              {chatSummaries.map((summary) => (
                <div key={summary.userId} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {summary.firstName} {summary.lastName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({summary.role.charAt(0) + summary.role.slice(1).toLowerCase()})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {summary.messageCount} {summary.messageCount === 1 ? 'chat message' : 'chat messages'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedChatUser(summary.userId);
                      setSelectedUserName(`${summary.firstName} ${summary.lastName}`);
                      setIsUserChatModalOpen(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-80"
                  >
                    See Messages
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error rendering chat tab:', error);
      return (
        <div className="p-4 text-center text-red-500">
          Error loading chat content. Please try refreshing the page.
        </div>
      );
    }
  };

  // Update the notes tab rendering
  const renderNotesTab = () => {
    if (hasNotesAccess === false) {
      return (
        <div className="text-center py-8">
          <p className="text-body-color dark:text-gray-400">
            You must be a member of this group to view notes
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {session && godV2UserId && isGroupMember(godV2UserId, members) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">Group Notes</h3>
              <button
                onClick={() => {
                  setNoteTitle('');
                  setNoteContent('');
                  setIsPrivate(false);
                  setIsLeadersOnly(false);
                  setIsGroupNote(true);
                  setIsEditingNote(true);
                }}
                className="hero-button-gradient px-4 py-2 rounded-lg light:text-white dark:text-white inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Add Note
              </button>
            </div>
            
            {isEditingNote && (
              <div className="flex flex-col gap-4 p-4 border rounded-lg light:bg-white dark:bg-dark">
                <div className="w-full">
                  <label htmlFor="title" className="block text-sm font-medium light:text-black dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    placeholder="Note title..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    id="content"
                    placeholder="Write your note here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => {
                        setIsPrivate(e.target.checked);
                        if (e.target.checked) {
                          setIsLeadersOnly(false);
                          setIsGroupNote(false);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-transparent"
                    />
                    <label htmlFor="isPrivate" className="text-sm text-gray-700 dark:text-gray-300">
                      Private (Only you)
                    </label>
                  </div>

                  {hasPermission(godV2UserId || undefined, group, members, ['LEADER', 'ADMIN']) && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isLeadersOnly"
                        checked={isLeadersOnly}
                        onChange={(e) => {
                          setIsLeadersOnly(e.target.checked);
                          if (e.target.checked) {
                            setIsPrivate(false);
                            setIsGroupNote(false);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-transparent"
                      />
                      <label htmlFor="isLeadersOnly" className="text-sm text-gray-700 dark:text-gray-300">
                        Leaders Only
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isGroupNote"
                      checked={isGroupNote}
                      onChange={(e) => {
                        setIsGroupNote(e.target.checked);
                        if (e.target.checked) {
                          setIsPrivate(false);
                          setIsLeadersOnly(false);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-transparent"
                    />
                    <label htmlFor="isGroupNote" className="text-sm text-gray-700 dark:text-gray-300">
                      Share with Group
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving}
                    className="hero-button-gradient px-6 py-2 rounded-lg light:text-white dark:text-white inline-flex items-center gap-2 hover:opacity-80"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin light:text-white dark:text-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 light:text-white dark:text-white" />
                        Save Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {notes.filter(note => 
            godV2UserId ? canViewNotes(godV2UserId, note.visibility, note.user.id) : false
          ).map((note) => (
            <div
              key={note.id}
              className="p-6 rounded-lg bg-white/5 dark:bg-dark/5 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-body-color dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {getUserDisplayName(note.user)}
                    </span>
                    <span>•</span>
                    <span>{formatDate(note.created_at)}</span>
                    {note.visibility === 'PRIVATE' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Lock className="w-4 h-4" />
                          Private
                        </span>
                      </>
                    )}
                    {note.visibility === 'LEADER' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Leaders Only
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {note.user.id === godV2UserId && (
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-body-color dark:text-gray-400 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-body-color dark:text-gray-400">
                No notes have been shared in this group yet.
              </p>
              {session && godV2UserId && isGroupMember(godV2UserId, members) && (
                <p className="text-sm text-body-color dark:text-gray-400 mt-2">
                  Click the "Add Note" button above to create the first note.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (!group) return null;

    switch (activeTab) {
      case 'whiteboard':
        // Use isGroupMember instead of group.isMember
        const isMember = isGroupMember(godV2UserId || session?.user?.id, members);
        return (
          <div className="space-y-4">
            {isMember ? (
              <>
                {/* Edit button - Only visible to Leaders and Admins */}
                {(isLeader || isAdmin) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditWhiteBoardOpen(true)}
                      className="px-3 py-1 text-sm bg-primary rounded-lg hover:opacity-80 flex items-center gap-1 text-white"
                    >
                      <Edit className="w-4 h-4" />
                      Edit WhiteBoard
                    </button>
                  </div>
                )}

                {/* Whiteboard Content - Visible to all members */}
                {renderWhiteBoardContent()}
                
                {/* File Browser - Visible to all members */}
                <div className="mt-4 border rounded-lg p-4 light:bg-white dark:bg-dark">
                  <h3 className="text-lg font-semibold mb-4">Group Files</h3>
                  {groupFiles?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderFileBrowser()}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-body-color dark:text-gray-400">
                        No files have been shared in this group yet.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 bg-white/5 dark:bg-dark/5 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p className="text-center text-body-color dark:text-gray-400">
                  You must be a member of this group to view the whiteboard content.
                </p>
              </div>
            )}
          </div>
        );

      case 'info':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {group.meeting_schedule && (
                <div>
                  <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                    Meeting Schedule
                  </h4>
                  <p className="text-body-color dark:text-gray-400">
                    {group.meeting_schedule}
                  </p>
                </div>
              )}

              {group.location && (
                <div>
                  <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                    Location
                  </h4>
                  <p className="text-body-color dark:text-gray-400">
                    {group.location}
                  </p>
                </div>
              )}

              {group.current_topic && (
                <div>
                  <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                    Current Topic
                  </h4>
                  <p className="text-body-color dark:text-gray-400">
                    {group.current_topic}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Language
                </h4>
                <p className="text-body-color dark:text-gray-400">
                  {group.language}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Zoom Meeting</h3>
              {renderZoomMeeting()}
            </div>
          </div>
        );

      case 'members':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Members ({members?.length || 0})
              </h3>
              {(isLeader || group?.isMember) && (
                <button
                  onClick={() => setIsManageMembersOpen(true)}
                  className="hero-button-gradient px-4 light:text-white dark:text-white py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {isLeader ? 'Manage Members' : 'View Members'}
                </button>
              )}
            </div>
            {renderMembers()}
          </div>
        );

      case 'notes':
        return renderNotesTab();

      case 'prayers':
        return (
          <div className="space-y-6">
            {session && group.isMember && (
              <div className="mb-6">
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <label htmlFor="prayerContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prayer Request
                    </label>
                    <textarea
                      id="prayerContent"
                      placeholder="Share your prayer request..."
                      value={prayerContent}
                      onChange={(e) => setPrayerContent(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder-gray-900 dark:placeholder-gray-400"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-transparent"
                      />
                      <label htmlFor="isAnonymous" className="text-sm text-gray-700 dark:text-gray-300">
                        Post Anonymously
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isGroupOnly"
                        checked={isGroupOnly}
                        onChange={(e) => setIsGroupOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-transparent"
                      />
                      <label htmlFor="isGroupOnly" className="text-sm text-gray-700 dark:text-gray-300">
                        Group Only
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={!isGroupOnly}
                        onChange={(e) => setIsGroupOnly(!e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-transparent"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                        Make Public
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePrayer}
                      disabled={isSavingPrayer}
                      className="hero-button-gradient px-6 py-2 rounded-lg light:text-white dark:text-white inline-flex items-center gap-2 hover:opacity-80"
                    >
                      {isSavingPrayer ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Submit Prayer Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <PrayerRequestList groupId={id} />
          </div>
        );

      case 'chat':
        return renderChatTab();

      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.meeting_schedule && (
              <div>
                <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Meeting Schedule
                </h4>
                <p className="text-body-color dark:text-gray-400">
                  {group.meeting_schedule}
                </p>
              </div>
            )}

            {group.location && (
              <div>
                <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Location
                </h4>
                <p className="text-body-color dark:text-gray-400">
                  {group.location}
                </p>
              </div>
            )}

            {group.current_topic && (
              <div>
                <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Current Topic
                </h4>
                <p className="text-body-color dark:text-gray-400">
                  {group.current_topic}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                Language
              </h4>
              <p className="text-body-color dark:text-gray-400">
                {group.language}
              </p>
            </div>
          </div>
        );
    }
  };

  // Add this effect to scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const renderMembers = () => {
    const activeMembers = getActiveMembers(members);
    
    if (!activeMembers.length) {
      return (
        <div className="text-center py-4">
          <p className="text-body-color dark:text-gray-400">No members found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeMembers.map((member) => {
          const memberImage = getUserImage(member);
          const memberName = member.name || 'Unknown User';
          const isGroupLeader = member.id === group?.leader_id;
          
          return (
            <div key={member.id} className="flex items-center gap-3 p-4 rounded-lg bg-white/5 dark:bg-dark/5">
              <div 
                className="h-10 w-10 overflow-hidden rounded-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => setSelectedImage({ 
                  url: memberImage,
                  name: memberName
                })}
              >
                <Image
                  src={memberImage}
                  alt={memberName}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = DEFAULT_USER_IMAGE;
                  }}
                />
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">{memberName}</p>
                <p className="text-sm text-body-color dark:text-gray-400">
                  {isGroupLeader ? 'Group Leader' : (member.role || 'Member')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Initialize godV2UserId from session
  useEffect(() => {
    const initializeGodV2UserId = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/god-v2-id?email=${encodeURIComponent(session.user.email)}`);
          if (response.ok) {
            const data = await response.json();
            setGodV2UserId(data.id);
          }
        } catch (error) {
          console.error('Error initializing godV2UserId:', error);
        }
      }
    };

    initializeGodV2UserId();
  }, [session?.user?.email]);

  // Update member data handling
  useEffect(() => {
    const fetchMembers = async () => {
      if (!id || !session?.user) return;

      try {
        const membersResponse = await fetch(`/api/agents-study-groups/${id}/members`);
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          
          const transformedMembers = membersData.members.map((m: any) => ({
            id: m.user_id || m.id,
            user_id: m.user_id || m.id,
            name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown User',
            image: m.image,
            role: m.role || 'MEMBER',
            status: m.status || 'ACTIVE',
            joined_at: m.joined_at || new Date().toISOString()
          }));

          setMembers(transformedMembers);

          // Update group member count and membership status
          if (group && godV2UserId) {
            const userMember = transformedMembers.find((m: Member) => 
              m.user_id === godV2UserId || m.id === godV2UserId
            );
            
            const isMemberStatus = transformedMembers.some((m: Member) => 
              (m.user_id === godV2UserId || m.id === godV2UserId) && 
              (m.status === 'ACTIVE' || m.status === 'ACCEPTED')
            );

            const isUserAdmin = userMember?.role === 'ADMIN';

            setGroup({
              ...group,
              member_count: transformedMembers.length,
              isMember: isMemberStatus || isLeader || isUserAdmin
            });
            setIsMember(isMemberStatus || isLeader || isUserAdmin);
            setIsAdmin(isUserAdmin);
          }
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to fetch members');
      }
    };

    fetchMembers();
  }, [id, session?.user, godV2UserId, group, isLeader]);

  // Update the useEffect for notes fetching
  useEffect(() => {
    if (activeTab === 'notes' && hasNotesAccess !== false) {
      fetchNotes();
    }
  }, [activeTab, godV2UserId, id, hasNotesAccess]);

  const fetchGroup = async () => {
    if (!id || !godV2UserId) return;
    
    try {
      const response = await fetch(`/api/agents-study-groups/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-god-v2-user-id': godV2UserId
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch group:', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Failed to fetch group details: ${errorText}`);
      }
      
      const data = await response.json();
      if (!data.group) {
        throw new Error('Group not found');
      }

      setGroup({
        ...data.group,
        created_at: new Date(data.group.created_at),
        updated_at: new Date(data.group.updated_at),
      });
      
      // Set leader status
      setIsLeader(data.group.leader_id === godV2UserId);
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to fetch group details');
    } finally {
      setIsLoading(false);
    }
  };

  // Add effect to fetch current meeting
  useEffect(() => {
    const fetchCurrentMeeting = async () => {
      if (!group?.id) return;
      
      try {
        const response = await fetch(`/api/agents-study-groups/${group.id}/zoom-meeting`);
        if (response.ok) {
          const data = await response.json();
          setCurrentZoomMeeting(data);
        }
      } catch (error) {
        console.error('Error fetching current meeting:', error);
      }
    };

    fetchCurrentMeeting();
  }, [group?.id]);

  // Add canViewNotes inside the component
  const canViewNotes = (userId: string | undefined, noteVisibility: string, noteUserId: string) => {
    if (!userId || !group) return false;
    
    // Leaders can see all notes
    if (hasPermission(userId, group, members, ['LEADER'])) return true;
    
    // Check if user is an active member
    const isActiveMember = isGroupMember(userId, members);
    
    switch (noteVisibility) {
      case 'PRIVATE':
        return noteUserId === userId;
      case 'LEADER':
        return hasPermission(userId, group, members, ['LEADER', 'ADMIN']);
      case 'GROUP':
        return isActiveMember;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Group not found</p>
      </div>
    );
  }

  const leaderImage = group?.leader?.image || DEFAULT_USER_IMAGE;
  const leaderName = group?.leader?.name || 'Unknown User';
  const memberCount = getMemberCount(members);

  const canViewChat = isGroupMember(godV2UserId || session?.user?.id, members);
  const canModerateChat = hasPermission(godV2UserId || session?.user?.id, group, members, ['LEADER', 'ADMIN']);
  const canEditWhiteboard = hasPermission(godV2UserId || session?.user?.id, group, members, ['LEADER', 'ADMIN']);
  const canManageMembers = hasPermission(godV2UserId || session?.user?.id, group, members, ['LEADER', 'ADMIN']);

  const renderJoinButton = () => {
    if (!session?.user) return null;

    // Check if user is a member using either session ID or godV2UserId
    const isMember = isGroupMember(godV2UserId || session.user.id, members);

    return (
      <button
        onClick={handleJoinGroup}
        disabled={isJoining}
        className="hero-button-gradient px-4 py-2 rounded-lg text-sm light:text-white dark:text-white"
      >
        {isJoining ? 'Processing...' : isMember ? 'Leave Group' : 'Join Group'}
      </button>
    );
  };

  // Update the members tab button to show "Manage Members" for both leaders and admins
  const renderMembersButton = () => {
    if (canManageMembers) {
      return (
        <button
          onClick={() => setIsManageMembersOpen(true)}
          className="hero-button-gradient px-4 light:text-white dark:text-white py-2 rounded-lg inline-flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Manage Members
        </button>
      );
    }

    if (group?.isMember) {
      return (
        <button
          onClick={() => setIsManageMembersOpen(true)}
          className="hero-button-gradient px-4 light:text-white dark:text-white py-2 rounded-lg inline-flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          View Members
        </button>
      );
    }

    return null;
  };

  // Update the whiteboard edit button visibility
  const renderWhiteboardEditButton = () => {
    if (canEditWhiteboard) {
      return (
        <button
          onClick={() => setIsEditWhiteBoardOpen(true)}
          className="px-3 py-1 text-sm bg-primary rounded-lg hover:opacity-80 flex items-center gap-1 text-white"
        >
          <Edit className="w-4 h-4" />
          Edit WhiteBoard
        </button>
      );
    }
    return null;
  };

  // Update the members section to show the manage/view members button
  const renderMembersSection = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Members ({members?.length || 0})
          </h3>
          {renderMembersButton()}
        </div>
        {renderMembers()}
      </div>
    );
  };

  // Update the whiteboard section to show content for members
  const renderWhiteboardSection = () => {
    const isMember = isGroupMember(godV2UserId || session?.user?.id, members);
    return (
      <div className="space-y-4">
        {isMember ? (
          <>
            {/* Edit button - Only visible to Leaders and Admins */}
            {canEditWhiteboard && (
              <div className="flex justify-end">
                {renderWhiteboardEditButton()}
              </div>
            )}

            {/* Whiteboard Content - Visible to all members */}
            {renderWhiteBoardContent()}
            
            {/* File Browser - Visible to all members */}
            {renderFileBrowser()}
          </>
        ) : (
          <div className="p-4 bg-white/5 dark:bg-dark/5 border border-gray-200 dark:border-gray-800 rounded-lg">
            <p className="text-center text-body-color dark:text-gray-400">
              You must be a member of this group to view the whiteboard content.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Breadcrumb pageTitle="Group Details" />
      <section className="relative z-10 overflow-hidden pt-[80px] pb-16 md:pt-[100px] md:pb-[120px] xl:pt-[120px] xl:pb-[160px] 2xl:pt-[50px] 2xl:pb-[200px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-10 sm:p-12 lg:px-8 xl:p-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 overflow-hidden rounded-full bg-gradient-to-r from-primary/20 to-primary/40">
                    <Image
                      src={leaderImage}
                      alt={`Profile picture of ${leaderName}`}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = DEFAULT_USER_IMAGE;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black dark:text-white">
                      {leaderName}
                    </h3>
                    <p className="text-sm text-body-color dark:text-gray-400">
                      Group Leader
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-body-color dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    {memberCount} members
                  </span>
                  {renderJoinButton()}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-black dark:text-white mb-10">
                {group.name}
              </h1>

              <p className="text-body-color dark:text-gray-400 mb-4">
                {group.description}
              </p>

              <div className="flex justify-between border-b border-white/20 dark:border-white/10 mb-4">
                <div className="flex gap-4 h-12">
                  <button
                    onClick={() => setActiveTab('whiteboard')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'whiteboard'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-body-color hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      Whiteboard
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'info'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-body-color hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      Info
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'members'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-body-color hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Members
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'notes'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-body-color hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('prayers')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'prayers'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-body-color hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Prayers
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      activeTab === 'chat'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-body-color hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Group Chat
                    </span>
                  </button>
                </div>
              </div>
              
              <div className={`w-full ${isEditorOpen ? 'pb-15' : 'pb-10'}`}>
                {activeTab === 'whiteboard' && renderWhiteboardSection()}
                {activeTab === 'info' && renderTabContent()}
                {activeTab === 'members' && renderMembersSection()}
                {activeTab === 'notes' && renderTabContent()}
                {activeTab === 'prayers' && renderTabContent()}
                {activeTab === 'chat' && renderChatTab()}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ManageMembersModal
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
        groupId={id}
        members={members}
        isLeader={isLeader}
        onMembersChange={fetchMembers}
      />

      {selectedImage && (
        <ProfileImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          name={selectedImage.name}
        />
      )}

      <ZoomMeetingModal
        groupId={group.id}
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        meetingDetails={currentZoomMeeting}
        isLeader={isLeader}
        isAdmin={isAdmin}
        onCreateMeeting={handleCreateMeeting}
      />

      {/* Add Chat Modal */}
      {isChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="light:bg-white dark:bg-dark rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">Group Chat</h2>
              <button
                onClick={() => setIsChatModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <ChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                onReaction={handleReaction}
                isLeader={isLeader}
                isAdmin={members.some(member => 
                  member.id === session?.user?.id && member.role === 'ADMIN'
                )}
                group={group}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Chat Modal 
      This is the modal that is used to chat with a user.
      */}
      {isUserChatModalOpen && (
        <UserChatModal
          isOpen={isUserChatModalOpen}
          onClose={() => {
            setIsUserChatModalOpen(false);
            setSelectedChatUser(null);
          }}
          messages={messages}
          selectedUserId={selectedChatUser || ''}
          selectedUserName={selectedUserName}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onReaction={(messageId: string, reactionType: string) => handleReaction(messageId, reactionType as ReactionType)}
          isLeader={isLeader}
          isAdmin={members.some(member => 
            member.id === session?.user?.id && member.role === 'ADMIN'
          )}
          group={group}
        />
      )}
    </>
  );
}
