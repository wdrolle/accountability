'use client';

import React, { useState } from 'react';
import { Group, Member } from './types';
import { Card } from '@nextui-org/card';
import { Avatar } from '@nextui-org/avatar';
import { Chip } from '@nextui-org/chip';
import { Button } from '@nextui-org/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Editor } from '@tinymce/tinymce-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { MoreVertical, MessageCircle, Reply as ReplyIcon, Trash2 } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'react-hot-toast';
import useSWR from 'swr';

export interface Reply {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  visibility: 'PRIVATE' | 'LEADER' | 'GROUP';
  created_at: string;
  updated_at: string;
  group_id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
  replies: Reply[];
}

interface NotesTabProps {
  notes: Note[];
  group: Group;
  members: Member[];
  godV2UserId: string | null;
  onSaveNote: (note: { title: string; content: string; visibility: 'PRIVATE' | 'LEADER' | 'GROUP' }) => Promise<{ note: Note }>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onReplyToNote: (noteId: string, content: string, isPrivate: boolean) => Promise<{ reply: Reply }>;
  onDeleteReply: (noteId: string, replyId: string) => Promise<void>;
}

async function handleFileUpload(fileOrBlobInfo: File | any): Promise<string> {
  const formData = new FormData();
  const file = fileOrBlobInfo instanceof File ? fileOrBlobInfo : fileOrBlobInfo.blob();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.url;
}

export default function NotesTab({ 
  notes: initialNotes, 
  group, 
  members, 
  godV2UserId, 
  onSaveNote, 
  onDeleteNote,
  onReplyToNote,
  onDeleteReply 
}: NotesTabProps) {
  const { data: notes = initialNotes, mutate } = useSWR<Note[]>(
    `/api/agents-study-groups/${group.id}/notes`,
    async (url) => {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId || ''
        }
      });
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      console.log('API Response:', data);
      console.log('Notes with replies:', data.notes);
      
      // Ensure replies is always an array and log each note's replies
      const notesWithReplies = data.notes.map((note: Note) => {
        console.log(`Note ${note.id} replies:`, note.replies);
        return {
          ...note,
          replies: Array.isArray(note.replies) ? note.replies : []
        };
      });
      
      console.log('Processed notes:', notesWithReplies);
      return notesWithReplies;
    },
    {
      fallbackData: initialNotes.map(note => {
        console.log('Initial note replies:', note.replies);
        return {
          ...note,
          replies: Array.isArray(note.replies) ? note.replies : []
        };
      }),
      revalidateOnFocus: false,
      revalidateOnMount: true,
      dedupingInterval: 0
    }
  );

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<'PRIVATE' | 'LEADER' | 'GROUP'>('GROUP');
  const [replyingToNote, setReplyingToNote] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isReplyPrivate, setIsReplyPrivate] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const isLeader = godV2UserId && group?.leader_id ? godV2UserId === group.leader_id : false;
  const isAdmin = members.some(member => 
    member.user_id === godV2UserId && 
    member.role === 'ADMIN' && 
    member.status === 'ACCEPTED'
  );

  const canDeleteNote = (note: Note) => {
    return isLeader || isAdmin || note.user_id === godV2UserId;
  };

  const canViewNote = (note: Note) => {
    if (!godV2UserId) return false;
    if (isLeader || isAdmin) return true;
    if (note.user_id === godV2UserId) return true;
    if (note.visibility === 'GROUP') return true;
    if (note.visibility === 'LEADER' && (isLeader || isAdmin)) return true;
    if (note.visibility === 'PRIVATE' && note.user_id === godV2UserId) return true;
    return false;
  };

  const handleReply = async (noteId: string) => {
    if (!replyContent.trim()) {
      toast.error('Reply content cannot be empty');
      return;
    }

    try {
      console.log('Adding reply to note:', noteId);
      const optimisticReply: Reply = {
        id: 'temp-' + Date.now(),
        note_id: noteId,
        user_id: godV2UserId || '',
        content: replyContent.trim(),
        is_private: isReplyPrivate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: godV2UserId || '',
          name: 'You',
          image: '/images/default-avatar.png'
        }
      };

      console.log('Optimistic reply:', optimisticReply);

      await mutate(
        (currentNotes) => {
          if (!currentNotes) return currentNotes;
          const updatedNotes = currentNotes.map(note => {
            if (note.id === noteId) {
              console.log('Current note replies:', note.replies);
              const updatedNote = {
                ...note,
                replies: [...(note.replies || []), optimisticReply]
              };
              console.log('Updated note replies:', updatedNote.replies);
              return updatedNote;
            }
            return note;
          });
          console.log('Updated notes:', updatedNotes);
          return updatedNotes;
        },
        { revalidate: false }
      );

      const response = await onReplyToNote(noteId, replyContent.trim(), isReplyPrivate);
      console.log('API response for reply:', response);
      
      // Update with real data
      await mutate(
        (currentNotes) => {
          if (!currentNotes) return currentNotes;
          return currentNotes.map(note => {
            if (note.id === noteId) {
              console.log('Updating note with real reply:', response.reply);
              return {
                ...note,
                replies: [...(note.replies || []).filter(r => r.id !== optimisticReply.id), response.reply]
              };
            }
            return note;
          });
        },
        { revalidate: true }
      );

      setReplyingToNote(null);
      setReplyContent("");
      setIsReplyPrivate(false);
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add reply');
      await mutate();
    }
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    try {
      // Optimistic update
      const optimisticNote: Note = {
        id: 'temp-' + Date.now(),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        visibility: noteVisibility,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        group_id: group.id,
        user_id: godV2UserId || '',
        user: {
          id: godV2UserId || '',
          name: 'You',
          image: '/images/default-avatar.png'
        },
        replies: []
      };

      await mutate(
        (currentNotes) => {
          if (!currentNotes) return [optimisticNote];
          return [optimisticNote, ...currentNotes];
        },
        { revalidate: false }
      );

      const { note } = await onSaveNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        visibility: noteVisibility
      });

      // Update with real data
      await mutate(
        (currentNotes) => {
          if (!currentNotes) return [note];
          return [note, ...currentNotes.filter(n => n.id !== optimisticNote.id)];
        },
        { revalidate: true }
      );

      setIsAddNoteOpen(false);
      setNoteTitle("");
      setNoteContent("");
      setNoteVisibility('GROUP');
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save note');
      // Revalidate on error to ensure data consistency
      await mutate();
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="w-full px-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Group Notes</h2>
          <p className="text-gray-400 mt-1">Share thoughts and insights with your group members</p>
        </div>
        <Button
          color="secondary"
          className="text-white"
          size="lg"
          startContent={<span className="text-xl">+</span>}
          onPress={() => setIsAddNoteOpen(true)}
        >
          New Note
        </Button>
      </div>

      {/* Notes Grid - Updated to 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNotes.length > 0 ? (
          sortedNotes.map((note, noteIndex) => (
            canViewNote(note) && (
              <Card 
                key={`note-${note.id}-${noteIndex}`}
                className="p-6 light:bg-white dark:bg-[#0D0C22] border border-gray-200 dark:border-gray-800 h-full flex flex-col cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => {
                  console.log('Card clicked, note:', note);
                  setSelectedNote(note);
                }}
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={note.user?.image || '/images/default-avatar.png'}
                      name={note.user?.name || 'Anonymous'}
                      className="w-8 h-8"
                    />
                    <div>
                      <h3 className="text-lg font-semibold line-clamp-2">{note.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span className="line-clamp-1">{note.user?.name || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        !note.visibility || note.visibility === 'PRIVATE'
                          ? 'danger'
                          : note.visibility === 'LEADER'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {(note.visibility || 'PRIVATE').toLowerCase()}
                    </Chip>
                    {canDeleteNote(note) && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => onDeleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Note Content */}
                <div 
                  className="prose dark:prose-invert max-w-none mb-6 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
                />

                {/* Replies Section */}
                <div className="mt-auto border-t dark:border-gray-800 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">
                      Replies ({note.replies?.length || 0})
                    </h4>
                    <Button
                      size="sm"
                      variant="light"
                      color="secondary"
                      startContent={<ReplyIcon className="w-4 h-4" />}
                      onPress={() => {
                        setReplyingToNote(note.id);
                        setSelectedNote(note);
                      }}
                    >
                      Add Reply
                    </Button>
                  </div>
                </div>
              </Card>
            )
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-gray-400 mb-4">No notes have been added yet</p>
            <Button
              color="secondary"
              className="text-white"
              onPress={() => setIsAddNoteOpen(true)}
            >
              Create the First Note
            </Button>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      <Modal 
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        size="full"
        scrollBehavior="inside"
        hideCloseButton
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        placement="center"
        classNames={{
          base: "bg-background m-[5px]",
          body: "p-0",
          backdrop: "bg-black/80",
          wrapper: "z-[100]",
          header: "border-b border-gray-200 dark:border-gray-700",
          footer: "border-t border-gray-200 dark:border-gray-700 px-6",
          closeButton: "hidden"
        }}
      >
        <ModalContent className="bg-white dark:bg-[#0D0C22] h-[calc(95vh-10px)]">
          {(onClose) => (
            <>
              <ModalHeader className="px-4 py-2">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-xl font-semibold">
                    Add New Note
                  </h2>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </ModalHeader>
              <ModalBody className="px-6 pt-2">
                <div className="space-y-4">
                  <div className="flex gap-4 pt-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      <label htmlFor="noteTitle" className="block text-2xl font-bold mt-5 mb-4">
                        Title
                      </label>
                      <Input
                        id="noteTitle"
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full text-xl"
                        size="lg"
                        placeholder="Enter note title..."
                      />
                    </div>
                    <div className="w-48">
                      <label className="block text-2xl font-bold mt-5 mb-4">
                        Visibility
                      </label>
                      <Select
                        selectedKeys={[noteVisibility]}
                        className="w-full"
                        onChange={(e) => setNoteVisibility(e.target.value as 'PRIVATE' | 'LEADER' | 'GROUP')}
                      >
                        <SelectItem key="PRIVATE" value="PRIVATE">Private</SelectItem>
                        <SelectItem key="LEADER" value="LEADER">Leaders Only</SelectItem>
                        <SelectItem key="GROUP" value="GROUP">Entire Group</SelectItem>
                      </Select>
                    </div>
                  </div>

                  <div className="h-[calc(80vh-220px)]">
                    <div className="h-full">
                      <Editor
                        apiKey={process.env.NEXT_PUBLIC_TINY_MCE_API_KEY}
                        value={noteContent}
                        onEditorChange={(content) => {
                          console.log('Editor content changed:', content);
                          setNoteContent(content);
                        }}
                        init={{
                          height: '100%',
                          width: "100%",
                          menubar: true,
                          statusbar: true,
                          resize: false,
                          min_height: 500,
                          toolbar_sticky: true,
                          toolbar_sticky_offset: 0,
                          autoresize_bottom_margin: 0,
                          fullscreen_native: true,
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                            'preview', 'anchor', 'searchreplace', 'visualblocks',
                            'code', 'fullscreen', 'insertdatetime', 'media', 'table',
                            'help', 'wordcount', 'emoticons', 'codesample'
                          ],
                          toolbar: 'undo redo | blocks | ' +
                            'bold italic | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist | ' +
                            'image media | emoticons | help',
                          skin: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'oxide-dark' : 'oxide',
                          content_css: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                          promotion: false,
                          branding: false,
                          automatic_uploads: true,
                          file_picker_types: 'file image media',
                          images_upload_handler: handleFileUpload,
                          file_picker_callback: function(callback, value, meta) {
                            const input = document.createElement('input');
                            input.setAttribute('type', 'file');
                            
                            if (meta.filetype === 'image') {
                              input.setAttribute('accept', 'image/*');
                            } else if (meta.filetype === 'media') {
                              input.setAttribute('accept', 'video/*,audio/*');
                            } else {
                              input.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx');
                            }
            
                            input.onchange = async function() {
                              const file = input.files?.[0];
                              if (!file) return;
            
                              try {
                                const result = await handleFileUpload(file);
                                callback(result, { 
                                  title: file.name,
                                  alt: file.name,
                                  width: '800',
                                  height: meta.filetype === 'image' ? '600' : '400',
                                  source: result,
                                  "data-filename": file.name
                                });
                              } catch (error) {
                                console.error('File upload error:', error);
                                toast.error('Failed to upload file');
                              }
                            };
            
                            input.click();
                          },
                          extended_valid_elements: 'img[class|src|alt|title|width|height|data-filename],video[*],source[*],audio[*]',
                          setup: function (editor) {
                            editor.on('ObjectSelected', function (e) {
                              if (e.target.nodeName === 'IMG' && !e.target.getAttribute('alt')) {
                                const filename = e.target.getAttribute('data-filename') || 'image';
                                e.target.setAttribute('alt', filename);
                              }
                            });

                            editor.on('init', () => {
                              const isDarkMode = document.documentElement.classList.contains('dark');
                              if (isDarkMode) {
                                editor.getBody().classList.add('dark-theme');
                              }
                            });
                          },
                          content_style: `
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                              font-size: 16px;
                              line-height: 1.5;
                              padding: 1rem;
                              min-height: 400px;
                              direction: ltr !important;
                              text-align: left !important;
                              ${typeof document !== 'undefined' && document.documentElement.classList.contains('dark') 
                                ? 'background-color: rgb(31 41 55); color: rgb(229 231 235);' 
                                : 'background-color: rgb(255 255 255); color: rgb(17 24 39);'
                              }
                            }
                          `
                        }}
                      />
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="py-2">
                <Button
                  color="secondary"
                  variant="light"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  className="text-white"
                  onPress={async () => {
                    await handleSaveNote();
                    onClose();
                  }}
                >
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Note Details Modal */}
      <Modal 
        isOpen={selectedNote !== null}
        onOpenChange={(isOpen) => {
          console.log('Modal open state changed:', isOpen);
          if (!isOpen) {
            setSelectedNote(null);
            setReplyingToNote(null);
          }
        }}
        size="3xl"
        scrollBehavior="inside"
        placement="center"
        backdrop="blur"
        classNames={{
          base: [
            "bg-background",
            "bg-white dark:bg-[#0D0C22]",
            "shadow-2xl dark:shadow-purple-900/20",
            "transition-transform duration-300 ease-out",
            "data-[entering=true]:translate-y-0 data-[entering=true]:opacity-100 data-[entering=true]:scale-100",
            "data-[exiting=true]:translate-y-2 data-[exiting=true]:opacity-0 data-[exiting=true]:scale-95",
            "data-[entering=true]:rotate-0 data-[exiting=true]:rotate-1",
            "rounded-lg overflow-hidden",
            "border border-gray-200 dark:border-gray-800",
            "transform perspective-1000",
            "hover:shadow-purple-500/10",
            "max-h-[90vh]"
          ].join(" "),
          backdrop: "bg-black/70 backdrop-blur-sm",
          wrapper: "transform-gpu",
          body: "p-0",
          closeButton: "z-50",
          header: "border-b border-gray-200 dark:border-gray-800",
          footer: "border-t border-gray-200 dark:border-gray-800"
        }}
      >
        <ModalContent>
          {(onClose) => {
            console.log('Modal rendering with selectedNote:', selectedNote);
            return selectedNote && (
              <>
                <ModalHeader className="flex flex-col gap-1 p-6">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={selectedNote.user?.image || '/images/default-avatar.png'}
                        name={selectedNote.user?.name || 'Anonymous'}
                        className="w-10 h-10"
                      />
                      <div>
                        <h2 className="text-xl font-bold">{selectedNote.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{selectedNote.user?.name || 'Anonymous'}</span>
                          <span>•</span>
                          <span>{new Date(selectedNote.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        !selectedNote.visibility || selectedNote.visibility === 'PRIVATE'
                          ? 'danger'
                          : selectedNote.visibility === 'LEADER'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {(selectedNote.visibility || 'PRIVATE').toLowerCase()}
                    </Chip>
                  </div>
                </ModalHeader>
                <ModalBody className="px-6 py-4">
                  <div className="flex flex-col h-full">
                    <div 
                      className="prose dark:prose-invert max-w-none mb-8"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedNote.content) }}
                    />

                    <div className="border-t dark:border-gray-800 pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                        <span>Replies ({selectedNote.replies?.length || 0})</span>
                        {replyingToNote !== selectedNote.id && (
                          <Button
                            size="sm"
                            color="secondary"
                            variant="light"
                            startContent={<ReplyIcon className="w-4 h-4" />}
                            onPress={() => setReplyingToNote(selectedNote.id)}
                          >
                            Add Reply
                          </Button>
                        )}
                      </h3>
                      
                      <div className="space-y-2 max-h-[calc(90vh-400px)] overflow-y-auto">
                        {selectedNote.replies?.map((reply, index) => (
                          <div 
                            key={`modal-reply-${reply.id}-${index}`}
                            className="flex items-start gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg transform transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
                          >
                            <Avatar
                              src={reply.user?.image || '/images/default-avatar.png'}
                              name={reply.user?.name || 'Anonymous'}
                              className="w-8 h-8"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold truncate">{reply.user?.name || 'Anonymous'}</span>
                                  <span className="text-gray-400 text-sm">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </span>
                                  {reply.is_private && (
                                    <Chip size="sm" variant="flat" color="danger" className="ml-2">
                                      private
                                    </Chip>
                                  )}
                                </div>
                                {(reply.user_id === godV2UserId || isLeader || isAdmin) && (
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => onDeleteReply(selectedNote.id, reply.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              <div 
                                className="prose dark:prose-invert max-w-none text-sm"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.content) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply Input in Modal */}
                      {replyingToNote === selectedNote.id && (
                        <div className="mt-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
                          <Editor
                            apiKey={process.env.NEXT_PUBLIC_TINY_MCE_API_KEY}
                            value={replyContent}
                            onEditorChange={(content) => setReplyContent(content)}
                            init={{
                              height: 200,
                              menubar: false,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                'preview', 'anchor', 'searchreplace', 'visualblocks',
                                'code', 'fullscreen', 'insertdatetime', 'media', 'table',
                                'help', 'wordcount', 'emoticons'
                              ],
                              toolbar: 'undo redo | blocks | ' +
                                'bold italic | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist | ' +
                                'image media | emoticons | help',
                              skin: document.documentElement.classList.contains('dark') ? 'oxide-dark' : 'oxide',
                              content_css: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                              promotion: false,
                              branding: false,
                              automatic_uploads: true,
                              file_picker_types: 'file image media',
                              images_upload_handler: handleFileUpload
                            }}
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="modalPrivateReply"
                                checked={isReplyPrivate}
                                onChange={(e) => setIsReplyPrivate(e.target.checked)}
                                className="rounded border-gray-300 dark:border-gray-700"
                              />
                              <label htmlFor="modalPrivateReply" className="text-sm">
                                Private reply to note creator
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => {
                                  setReplyingToNote(null);
                                  setReplyContent("");
                                  setIsReplyPrivate(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                color="secondary"
                                className="text-white"
                                onPress={() => handleReply(selectedNote.id)}
                              >
                                Post Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="px-6 py-4">
                  <Button
                    color="secondary"
                    variant="light"
                    onPress={onClose}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </div>
  );
} 