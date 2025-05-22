// /src/app/(site)/community/groups/[id]/components/ProfileImageModal.tsx

// Purpose: Client Component that displays a profile image in a modal
//  Relationships: Used in GroupClient.tsx to display user images

// Key Functions:
//  Displays a profile image in a modal
//  Handles modal state and close functionality

'use client';

import Image from 'next/image';
import { Dialog } from '@headlessui/react';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  name: string;
}

export default function ProfileImageModal({ isOpen, onClose, imageUrl, name }: ProfileImageModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative rounded-lg overflow-hidden max-w-2xl w-full">
          <div className="relative aspect-square w-full">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-lg font-semibold">{name}</p>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 