// /src/app/(site)/community/groups/[id]/components/ManageAdminsModal.tsx

// Purpose: Client Component that manages the manage admins modal
//  Relationships: Used in GroupClient.tsx to manage group members

// Key Functions:
//  Fetches group members
//  Handles member role updates
//  Displays member list and search functionality

'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Group, Member } from '../types';

interface ManageAdminsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onUpdate: (updatedGroup: Group) => void;
}

export default function ManageAdminsModal({ isOpen, onClose, group, onUpdate }: ManageAdminsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [role, setRole] = useState('ADMIN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/agents-study-groups/${group.id}/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setMembers(data.members);
        setFilteredMembers(data.members);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to fetch group members');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchMembers();
    }
  }, [group.id, isOpen]);

  useEffect(() => {
    const filtered = members.filter(member => 
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedMember.id,
          role: role,
        }),
      });

      if (!response.ok) throw new Error('Failed to update member role');

      const data = await response.json();
      onUpdate(data.group);
      toast.success('Member role updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
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
              Manage Group Members
            </Dialog.Title>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
              />
            </div>

            <div className="max-h-96 overflow-y-auto mb-6">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedMember?.id === member.id
                          ? 'bg-purple-700/50 border border-purple-500/30'
                          : 'bg-purple-950/50 hover:bg-purple-800/50'
                      }`}
                    >
                      <div>
                        <p className="text-white font-medium">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-gray-400 text-sm">{member.email}</p>
                      </div>
                      <span className="text-purple-300 text-sm">{member.role || 'Member'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No members found</p>
                )}
              </div>
            </div>

            {selectedMember && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Role for {selectedMember.first_name} {selectedMember.last_name}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4">
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
                    Update Role
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 