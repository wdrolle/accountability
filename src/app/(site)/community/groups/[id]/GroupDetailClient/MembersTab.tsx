'use client';

import React, { useEffect, useState } from 'react';
import { Group, Member } from './types';
import { Card } from '@nextui-org/card';
import { Avatar } from '@nextui-org/avatar';
import { Chip } from '@nextui-org/chip';
import { Button } from '@nextui-org/button';
import { Spinner } from '@nextui-org/spinner';

interface MembersTabProps {
  group: Group;
  onManageMembers: () => void;
  members: Member[];
}

export function MembersTab({ group, onManageMembers, members: initialMembers }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/agents-study-groups/${group.id}/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setMembers(data.members);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    if (initialMembers.length === 0) {
      setLoading(true);
      fetchMembers();
    }
  }, [group.id, initialMembers]);

  const sortedMembers = [...members].sort((a, b) => {
    // Sort by role (leader first)
    if (a.role === 'LEADER' && b.role !== 'LEADER') return -1;
    if (a.role !== 'LEADER' && b.role === 'LEADER') return 1;
    
    // Then by status (active first)
    if (a.status === 'ACCEPTED' && b.status !== 'ACCEPTED') return -1;
    if (a.status !== 'ACCEPTED' && b.status === 'ACCEPTED') return 1;
    
    // Then by name
    return a.user.name.localeCompare(b.user.name);
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Members ({members.length})</h2>
        <Button 
          color="primary"
          variant="flat"
          onPress={onManageMembers}
        >
          Manage Members
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedMembers.map((member) => (
          <Card 
            key={member.user_id}
            className="p-4 light:bg-white dark:bg-dark"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={member.user.image}
                  name={member.user.name}
                  className="w-12 h-12"
                />
                <div>
                  <h3 className="font-semibold">{member.user.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Chip
                      size="sm"
                      color={member.role === 'LEADER' ? 'primary' : 'default'}
                      className={member.role === 'LEADER' ? 'text-white' : ''}
                    >
                      {member.role.toLowerCase()}
                    </Chip>
                    <Chip
                      size="sm"
                      color={member.status === 'ACCEPTED' ? 'success' : 'warning'}
                      variant="flat"
                    >
                      {member.status.toLowerCase()}
                    </Chip>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {member.last_active_at ? (
                  <span>
                    Last active:{' '}
                    {formatDate(member.last_active_at)}
                  </span>
                ) : (
                  <span>Never active</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 