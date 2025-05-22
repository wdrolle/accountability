'use client';

import React from 'react';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { DEFAULT_USER_IMAGE } from '@/lib/constants';
import { Member, Group } from './types';
import { getUserImage, getUserDisplayName } from '@/lib/group-utils';

interface MembersListProps {
  members: Member[];
  group: Group;
  isLeader: boolean;
  isAdmin: boolean;
  onManageMembers: () => void;
  onSelectImage: (image: { url: string; name: string }) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  group,
  isLeader,
  isAdmin,
  onManageMembers,
  onSelectImage
}) => {
  const activeMembers = members.filter(member => 
    member.status === 'ACCEPTED'
  );

  if (!activeMembers.length) {
    return (
      <div className="text-center py-4">
        <p className="text-body-color dark:text-gray-400">No members found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Members ({activeMembers.length})
        </h3>
        {(isLeader || isAdmin) && (
          <button
            onClick={onManageMembers}
            className="hero-button-gradient px-4 py-2 rounded-lg inline-flex items-center gap-2 light:text-white dark:text-white"
          >
            <Users className="w-4 h-4" />
            {isLeader ? 'Manage Members' : 'View Members'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeMembers.map((member) => {
          const memberImage = getUserImage(member);
          const memberName = getUserDisplayName(member);
          const isGroupLeader = member.id === group.leader_id;
          
          return (
            <div key={member.id} className="flex items-center gap-3 p-4 rounded-lg bg-white/5 dark:bg-dark/5">
              <div 
                className="h-10 w-10 overflow-hidden rounded-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => onSelectImage({ 
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
    </div>
  );
};
