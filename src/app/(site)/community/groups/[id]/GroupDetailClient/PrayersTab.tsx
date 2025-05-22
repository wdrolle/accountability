'use client';

import React from 'react';
import { Group, PrayerRequest, Member } from './types';
import { Card } from '@nextui-org/card';
import { Avatar } from '@nextui-org/avatar';
import { Chip } from '@nextui-org/chip';
import { Button } from '@nextui-org/button';

interface PrayersTabProps {
  prayers: PrayerRequest[];
  group: Group;
  members: Member[];
  godV2UserId: string | null;
  onSavePrayer: (prayer: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }) => Promise<void>;
  onDeletePrayer: (prayerId: string) => Promise<void>;
  onPrayForRequest: (prayerId: string) => Promise<void>;
}

export default function PrayersTab({ prayers, group, members, godV2UserId, onSavePrayer, onDeletePrayer, onPrayForRequest }: PrayersTabProps) {
  const sortedPrayers = [...prayers].sort((a, b) => {
    // Sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Prayer Requests ({prayers.length})</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedPrayers.map((prayer) => (
          <Card 
            key={prayer.id}
            className="p-4 light:bg-gray-50 dark:bg-gray-800"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar
                    src={prayer.user.image}
                    name={prayer.user.name}
                    className="w-8 h-8"
                  />
                  <div>
                    <h3 className="font-semibold">{prayer.title}</h3>
                    <p className="text-sm text-gray-500">
                      by {prayer.user.name} • {new Date(prayer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={
                      prayer.visibility === 'PRIVATE'
                        ? 'danger'
                        : prayer.visibility === 'LEADER'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {prayer.visibility.toLowerCase()}
                  </Chip>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="text-white"
                  >
                    🙏 {prayer.prayer_count}
                  </Button>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {prayer.content}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {prayers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No prayer requests have been added yet.
          </div>
        )}
      </div>
    </div>
  );
} 