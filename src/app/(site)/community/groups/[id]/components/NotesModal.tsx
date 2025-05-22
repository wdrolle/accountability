// /src/app/(site)/community/groups/[id]/components/NotesModal.tsx

// Purpose: Client Component that manages the notes modal
//  Relationships: Used in GroupClient.tsx to display and manage notes

// Key Functions:
//  Fetches notes for a specific group
//  Handles note creation and visibility
//  Displays notes in a grid layout

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Note } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  userId: string;
  isLeader: boolean;
  onNoteAdded: (note: Note) => void;
}

export default function NotesModal({ isOpen, onClose, groupId, userId, isLeader, onNoteAdded }: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    visibility: 'PRIVATE'
  });

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/notes`);
        if (!response.ok) {
          if (response.status === 403) {
            toast.error('You must be a member of the group to view notes');
            return;
          }
          throw new Error('Failed to fetch notes');
        }
        const data = await response.json();
        setNotes(data.notes || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
        // Don't show error toast for empty notes
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchNotes();
    }
  }, [groupId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/groups/${groupId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create note');
      }

      const data = await response.json();
      const note = data.note;
      setNotes([note, ...notes]);
      onNoteAdded(note);
      setIsAddingNote(false);
      setNewNote({ title: '', content: '', visibility: 'PRIVATE' });
      toast.success('Note created successfully');
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create note');
    }
  };

  const canViewNote = (note: Note) => {
    if (note.visibility === 'GROUP') return true;
    if (note.visibility === 'LEADER' && isLeader) return true;
    return note.user.id === userId;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-4xl rounded-lg overflow-hidden">
          {/* Bevel gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur-xl border border-purple-500/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          
          {/* Content */}
          <div className="relative p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold text-white">
                Group Notes
              </Dialog.Title>
              <button
                onClick={() => setIsAddingNote(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg shadow-purple-500/20"
              >
                Add Note
              </button>
            </div>

            {isAddingNote ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Content
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-400"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Visibility
                  </label>
                  <select
                    value={newNote.visibility}
                    onChange={(e) => setNewNote({ ...newNote, visibility: e.target.value as 'PRIVATE' | 'LEADER' | 'GROUP' })}
                    className="w-full rounded-lg bg-purple-950/50 text-white px-4 py-2 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="PRIVATE">Private (Only Me)</option>
                    <option value="LEADER">Leader Only</option>
                    <option value="GROUP">Entire Group</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-4 py-2 rounded-lg bg-purple-950/50 text-white hover:bg-purple-900/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-purple-500/30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg shadow-purple-500/20"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : notes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.filter(canViewNote).map((note) => (
                      <div
                        key={note.id}
                        className="backdrop-blur-sm bg-white/5 dark:bg-dark/5 rounded-lg border border-white/10 dark:border-white/10 p-6"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            {note.user.image ? (
                              <Image
                                src={note.user.image}
                                alt={note.user.name || ''}
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
                ) : (
                  <p className="text-center text-gray-400 py-8">No notes found</p>
                )}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 