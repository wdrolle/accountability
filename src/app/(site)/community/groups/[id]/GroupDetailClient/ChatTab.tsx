'use client';

import React, { useState } from 'react';
import { Group, Message, Member } from './types';
import { Card } from '@nextui-org/card';
import { Avatar } from '@nextui-org/avatar';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';

interface ChatTabProps {
  messages: Message[];
  group: Group;
  members: Member[];
  godV2UserId: string | null;
  onSendMessage: (content: string) => Promise<void>;
}

export default function ChatTab({ messages, group, members, godV2UserId, onSendMessage }: ChatTabProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sortedMessages = [...messages].sort((a, b) => {
    // Sort by date (oldest first for chat)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {sortedMessages.map((message) => (
          <Card 
            key={message.id}
            className="p-4 light:bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-start space-x-4">
              <Avatar
                src={message.user.image}
                name={message.user.name}
                className="w-8 h-8"
              />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{message.user.name}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No messages have been sent yet.
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button 
          color="primary"
          className="text-white"
          onClick={handleSend}
          isDisabled={!newMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
} 