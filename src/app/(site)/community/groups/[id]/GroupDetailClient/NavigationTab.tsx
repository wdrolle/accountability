'use client';

import React from 'react';
import { Book, Users, FileText, Heart, MessageSquare } from 'lucide-react';
import { TabType } from './types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    icon: <Book className="w-4 h-4" />
  },
  {
    id: 'info',
    label: 'Info',
    icon: <Book className="w-4 h-4" />
  },
  {
    id: 'members',
    label: 'Members',
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: <FileText className="w-4 h-4" />
  },
  {
    id: 'prayers',
    label: 'Prayers',
    icon: <Heart className="w-4 h-4" />
  },
  {
    id: 'chat',
    label: 'Group Chat',
    icon: <MessageSquare className="w-4 h-4" />
  }
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex justify-between border-b border-white/20 dark:border-white/10 mb-4">
      <div className="flex gap-4 h-12">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-body-color hover:text-primary'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}; 