// /src/app/(site)/community/groups/[id]/GroupClient.tsx

// Purpose: Client Component that renders the group details page UI
//  Relationships: Receives data from page.tsx and manages all client-side interactions

// Key Functions:
//  Displays group details, members, and notes
//  Manages state for modals
//  Handles client-side interactions

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

interface Note {
  id: string;
  title: string;
  content: string;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  created_at: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

interface Group {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  meeting_schedule: string;
  location: string;
  current_topic: string;
  language: string;
  visibility: string;
  created_at: string;
  leader: {
    name: string;
    image: string;
  };
  member_count: number;
  members: Array<{
    user_id: string;
    role: string;
    name: string;
    image: string | null;
  }>;
}

interface GroupClientProps {
  initialGroup: Group;
  initialNotes: Note[];
}

export default function GroupClient({ initialGroup, initialNotes }: GroupClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [group, setGroup] = useState<Group>(initialGroup);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageAdminsModalOpen, setIsManageAdminsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  const isLeader = session?.user?.id === group.leader_id;
  const isAdmin = group.members?.some(
    (member) => member.user_id === session?.user?.id && member.role === 'ADMIN'
  );

  return (
    <>
      <Breadcrumb pageTitle="Group Details" />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Group Details Card */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{group.name}</h1>
                  <p className="text-gray-400">{group.description}</p>
                </div>
                {(isLeader || isAdmin) && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Edit Group
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                  <div className="space-y-2">
                    <p className="text-gray-400">
                      <span className="font-medium text-white">Leader:</span>{' '}
                      {group.leader.name}
                    </p>
                    <p className="text-gray-400">
                      <span className="font-medium text-white">Members:</span>{' '}
                      {group.member_count}
                    </p>
                    <p className="text-gray-400">
                      <span className="font-medium text-white">Language:</span>{' '}
                      {group.language}
                    </p>
                    <p className="text-gray-400">
                      <span className="font-medium text-white">Visibility:</span>{' '}
                      {group.visibility}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Schedule</h3>
                  <div className="space-y-2">
                    {group.meeting_schedule && (
                      <p className="text-gray-400">
                        <span className="font-medium text-white">Meets:</span>{' '}
                        {group.meeting_schedule}
                      </p>
                    )}
                    {group.location && (
                      <p className="text-gray-400">
                        <span className="font-medium text-white">Location:</span>{' '}
                        {group.location}
                      </p>
                    )}
                    {group.current_topic && (
                      <p className="text-gray-400">
                        <span className="font-medium text-white">Current Topic:</span>{' '}
                        {group.current_topic}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Members Card */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Members</h2>
                {(isLeader || isAdmin) && (
                  <button
                    onClick={() => setIsManageAdminsModalOpen(true)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Manage Admins
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {group.members?.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center cursor-pointer"
                        onClick={() => member.image && setSelectedImage({ url: member.image, name: member.name })}
                      >
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={member.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="text-lg text-purple-300">
                            {member.name[0] || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-sm text-gray-400">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Group Notes</h2>
                <button
                  onClick={() => setIsNotesModalOpen(true)}
                  className="hero-button-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white font-medium hover:opacity-80 transition duration-300"
                >
                  Add Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No notes yet. Be the first to add a note!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="backdrop-blur-sm bg-white/5 dark:bg-dark/5 rounded-lg border border-white/10 dark:border-white/10 p-6"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div 
                          className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center cursor-pointer"
                          onClick={() => note.user.image && setSelectedImage({ url: note.user.image, name: note.user.name })}
                        >
                          {note.user.image ? (
                            <Image
                              src={note.user.image}
                              alt={note.user.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-lg text-purple-300">
                              {note.user.name[0] || '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                            {note.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {note.user.name} • {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-400 line-clamp-3 mb-4">{note.content}</p>
                      <div className="border-t border-white/10 pt-4">
                        <span className="text-sm text-purple-400">
                          {note.visibility === 'PRIVATE'
                            ? 'Private Note'
                            : note.visibility === 'LEADER'
                            ? 'Leaders Only'
                            : 'Group Note'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="relative rounded-lg overflow-hidden max-w-2xl w-full">
              <div className="relative aspect-square w-full">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-lg font-semibold">{selectedImage.name}</p>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </>
  );
} 