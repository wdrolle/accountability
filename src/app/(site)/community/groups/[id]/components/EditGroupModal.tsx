// /src/app/(site)/community/groups/[id]/components/EditGroupModal.tsx

// Purpose: Client Component that manages the edit group modal
//  Relationships: Used in GroupClient.tsx to edit group details

// Key Functions:
//  Handles form submission for group updates
//  Displays and updates group details
//  Manages modal state and close functionality

'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Group } from '../types';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onUpdate: (updatedGroup: Group) => void;
}

export default function EditGroupModal({ isOpen, onClose, group, onUpdate }: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
    meeting_schedule: group.meeting_schedule || '',
    location: group.location || '',
    current_topic: group.current_topic || '',
    language: group.language,
    visibility: group.visibility,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      const data = await response.json();
      onUpdate(data.group);
      onClose();
      toast.success('Group updated successfully');
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-2xl rounded-lg overflow-hidden">
          {/* Bevel gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur-xl border border-purple-500/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          
          {/* Content */}
          <div className="relative p-6">
            <Dialog.Title className="text-2xl font-bold text-white mb-4">
              Edit Group
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Meeting Schedule
                </label>
                <input
                  type="text"
                  value={formData.meeting_schedule}
                  onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                  className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Current Topic
                </label>
                <input
                  type="text"
                  value={formData.current_topic}
                  onChange={(e) => setFormData({ ...formData, current_topic: e.target.value })}
                  className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                >
                  <option value="ENGLISH">English</option>
                  <option value="SPANISH">Spanish</option>
                  <option value="FRENCH">French</option>
                  <option value="GERMAN">German</option>
                  <option value="CHINESE">Chinese</option>
                  <option value="JAPANESE">Japanese</option>
                  <option value="KOREAN">Korean</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-purple-950/50 text-white hover:bg-purple-900/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-purple-500/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg shadow-purple-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 