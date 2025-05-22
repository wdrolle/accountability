import { Member, Group } from '@/app/(site)/community/groups/[id]/GroupDetailClient/types';
import { DEFAULT_USER_IMAGE } from './constants';

export interface GroupUser {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  image: string | null;
  role?: string;
}

export interface GroupMember {
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

// Standardized function to get user image
export const getUserImage = (member: Member): string => {
  return member.image || DEFAULT_USER_IMAGE;
};

// Standardized function to get user display name
export const getUserDisplayName = (member: Member): string => {
  if (member.first_name && member.last_name) {
    return `${member.first_name} ${member.last_name}`;
  }
  return member.name || 'Unknown User';
};

// Standardized function to check if user has permission
export const hasPermission = (
  userId: string | undefined,
  group: Group,
  members: Member[],
  allowedRoles: string[]
): boolean => {
  if (!userId) return false;
  
  // Check if user is the group leader
  if (group.leader_id === userId) return true;
  
  // Find the user's membership
  const member = members.find(m => m.user_id === userId || m.id === userId);
  if (!member) return false;
  
  // Check if user's role is in allowed roles
  return allowedRoles.includes(member.role.toUpperCase());
};

// Standardized function to get active members
export const getActiveMembers = (members: Member[]): Member[] => {
  return members.filter(member => 
    member.status === 'ACCEPTED'
  );
};

// Standardized function to get member count
export const getMemberCount = (members: Member[]): number => {
  return getActiveMembers(members).length;
};

// Standardized function to check if user is group member
export const isGroupMember = (userId: string, members: Member[]): boolean => {
  return members.some(member => 
    (member.user_id === userId || member.id === userId) && 
    member.status === 'ACCEPTED'
  );
};

export const canViewNotes = (
  userId: string | undefined, 
  noteVisibility: string, 
  noteUserId: string,
  group: Group,
  members: Member[]
): boolean => {
  if (!userId) return false;
  
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