'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/modal';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { Avatar } from '@nextui-org/avatar';
import { Member } from '../GroupDetailClient/types';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: Member[];
  isLeader: boolean;
  onMembersChange: () => void;
  onAddMembers: (memberIds: string[]) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onUpdateRole: (memberId: string, role: string) => Promise<void>;
}

export default function ManageMembersModal({
  isOpen,
  onClose,
  groupId,
  members,
  isLeader,
  onMembersChange,
  onAddMembers,
  onRemoveMember,
  onUpdateRole
}: ManageMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

  const filteredMembers = members.filter(member => 
    member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedMembers.some(selected => selected.user_id === member.user_id)
  );

  const handleAddMember = (memberId: string) => {
    const member = members.find(m => m.user_id === memberId);
    if (member) {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.user_id !== memberId));
  };

  const handleSave = async () => {
    try {
      await onAddMembers(selectedMembers.map(member => member.user_id));
      setSelectedMembers([]);
      onClose();
    } catch (error) {
      console.error('Failed to add members:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>Manage Members</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Selected Members</h3>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {selectedMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={member.user.image}
                        name={member.user.name}
                        className="w-8 h-8"
                      />
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-gray-500">{member.role.toLowerCase()}</p>
                      </div>
                    </div>
                    <Button
                      color="danger"
                      variant="light"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {selectedMembers.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No members selected
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Available Members</h3>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {filteredMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={member.user.image}
                        name={member.user.name}
                        className="w-8 h-8"
                      />
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-gray-500">{member.role.toLowerCase()}</p>
                      </div>
                    </div>
                    <Button
                      color="primary"
                      variant="light"
                      size="sm"
                      onClick={() => handleAddMember(member.user_id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No members found
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSave}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 