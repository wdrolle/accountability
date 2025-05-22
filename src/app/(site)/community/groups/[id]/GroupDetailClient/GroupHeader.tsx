'use client';

import React from 'react';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { DEFAULT_USER_IMAGE } from '@/lib/constants';
import { toast } from 'sonner';
import { Group, Member } from './types';
import { isGroupMember } from '@/lib/group-utils';

interface GroupHeaderProps {
  group: Group;
  members: Member[];
  godV2UserId: string | null;
  isJoining: boolean;
  onJoinGroup: () => Promise<void>;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  group,
  members,
  godV2UserId,
  isJoining,
  onJoinGroup
}) => {
  const leaderImage = group?.leader?.image || DEFAULT_USER_IMAGE;
  const leaderName = group?.leader?.name || 'Unknown User';
  const memberCount = members?.length || 0;
  const isMember = godV2UserId ? isGroupMember(godV2UserId, members) : false;

  return (
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
        {godV2UserId && (
          <button
            onClick={onJoinGroup}
            disabled={isJoining}
            className="hero-button-gradient px-4 py-2 rounded-lg text-sm light:text-white dark:text-white"
          >
            {isJoining ? 'Processing...' : isMember ? 'Leave Group' : 'Join Group'}
          </button>
        )}
      </div>
    </div>
  );
};
