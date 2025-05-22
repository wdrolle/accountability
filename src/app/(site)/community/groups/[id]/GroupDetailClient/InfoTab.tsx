'use client';

import React from 'react';
import { Video, Clock, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Group } from './types';
import { ZoomMeetingForm } from '@/components/ZoomMeetingForm';
import ZoomMeetingModal from '@/components/ZoomMeetingModal';
import type { ZoomMeetingDetails } from '@/lib/zoom';
import { Card } from '@nextui-org/card';
import { Avatar } from '@nextui-org/avatar';
import { Divider } from '@nextui-org/divider';

interface InfoTabProps {
  group: Group;
}

export function InfoTab({ group }: InfoTabProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center space-x-4">
        <Avatar
          src={group.leader.image}
          name={group.leader.name}
          size="lg"
          className="w-16 h-16"
        />
        <div>
          <h2 className="text-2xl font-bold">{group.name}</h2>
          <p className="text-gray-500">Led by {group.leader.name}</p>
        </div>
      </div>

      <Divider />

      <Card className="p-4 light:bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-gray-600 dark:text-gray-300">
          {group.description || 'No description provided'}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 light:bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-2">Meeting Schedule</h3>
          <ZoomMeetingForm groupId={group.id} />
          <p className="text-gray-600 dark:text-gray-300">
            {group.meeting_schedule || 'Not specified'}
          </p>
        </Card>

        <Card className="p-4 light:bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-2">Location</h3>
          <p className="text-gray-600 dark:text-gray-300">
            {group.location || 'Not specified'}
          </p>
        </Card>

        <Card className="p-4 light:bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-2">Current Topic</h3>
          <p className="text-gray-600 dark:text-gray-300">
            {group.current_topic || 'Not specified'}
          </p>
        </Card>

        <Card className="p-4 light:bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-2">Group Details</h3>
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              Language: {group.language}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Members: {group.member_count}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Visibility: {group.visibility.toLowerCase()}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
} 