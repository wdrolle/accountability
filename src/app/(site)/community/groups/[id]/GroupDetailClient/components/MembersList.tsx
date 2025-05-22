'use client';

import React from 'react';
import Image from 'next/image';
import { DEFAULT_USER_IMAGE } from '@/lib/constants';
import type { Member, Group } from '../types';

interface MembersListProps {
  members: Member[];
  group: Group;
  onImageClick: (url: string, name: string) => void;
}

const MembersList = ({ members, group, onImageClick }: MembersListProps) => {
  return (
    <div className="space-y-4">
      {members?.map((member) => (
        <div
          key={member.user_id}
          className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <div 
            className="relative h-10 w-10 flex-shrink-0 cursor-pointer"
            onClick={() => onImageClick(
              member.image || DEFAULT_USER_IMAGE,
              `${member.first_name} ${member.last_name}`
            )}
          >
            <Image
              src={member.image || DEFAULT_USER_IMAGE}
              alt={`${member.first_name} ${member.last_name}'s profile picture`}
              width={40}
              height={40}
              className="rounded-full object-cover hover:opacity-80 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_USER_IMAGE;
              }}
            />
            {member.status === 'ACCEPTED' && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h4 className="text-sm font-medium text-black dark:text-white truncate">
                {member.first_name} {member.last_name}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                member.role === 'LEADER' ? 'bg-primary/10 text-primary' :
                member.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {member.role}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Joined {new Date(member.joined_at ||'').toLocaleDateString()}</span>
              {member.status !== 'ACCEPTED' && (
                <>
                  <span>•</span>
                  <span className={`${
                    member.status === 'PENDING' ? 'text-yellow-500' :
                    member.status === 'REJECTED' ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {member.status}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MembersList;
