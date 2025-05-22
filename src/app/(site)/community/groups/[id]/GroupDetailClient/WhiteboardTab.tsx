'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'react-hot-toast';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import type { Group, Member, WhiteBoardContent } from './types';

interface WhiteboardTabProps {
  group: Group;
  members: Member[];
  godV2UserId: string | null;
}

export default function WhiteboardTab({ group, members, godV2UserId }: WhiteboardTabProps) {
  const [isEditWhiteBoardOpen, setIsEditWhiteBoardOpen] = useState(false);
  const [whiteBoardTitle, setWhiteBoardTitle] = useState("");
  const [whiteBoardContent, setWhiteBoardContent] = useState("");
  const [whiteBoardDay, setWhiteBoardDay] = useState(new Date().toISOString().split('T')[0]);
  const [whiteBoards, setWhiteBoards] = useState<WhiteBoardContent[]>([]);
  const [selectedWhiteBoard, setSelectedWhiteBoard] = useState<WhiteBoardContent | null>(null);

  const isLeader = godV2UserId && group?.leader_id ? godV2UserId === group.leader_id : false;
  const isAdmin = members.some(member => 
    member.user_id === godV2UserId && 
    member.role === 'ADMIN' && 
    member.status === 'ACCEPTED'
  );

  const isGroupMember = (userId: string | undefined | null, members: Member[]) => {
    console.log('Checking membership for user:', userId);
    console.log('Members:', members);
    console.log('Group:', group);
    
    // Check if user is the leader
    if (userId === group.leader_id) {
      console.log('User is leader');
      return true;
    }

    // Check if user is a member
    const isMember = members.some(member => 
      member.user_id === userId && 
      member.status === 'ACCEPTED'
    );
    console.log('Is member:', isMember);
    return isMember;
  };

  const sortWhiteBoards = (whiteBoards: WhiteBoardContent[]) => {
    return [...whiteBoards].sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
  };

  const handleSaveWhiteBoard = async () => {
    if (!whiteBoardTitle.trim()) {
      toast.error('Please enter a title for the whiteboard');
      return;
    }
    if (!whiteBoardContent.trim()) {
      toast.error('Please enter some content for the whiteboard');
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/whiteboard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-god-v2-user-id': godV2UserId || ''
        },
        body: JSON.stringify({
          whiteboards: [{
            id: selectedWhiteBoard?.id,
            title: whiteBoardTitle,
            content: whiteBoardContent,
            day: whiteBoardDay
          }]
        }),
      });
      if (!response.ok) throw new Error('Failed to save whiteboard');
      const data = await response.json();
      
      if (selectedWhiteBoard) {
        setWhiteBoards(prevBoards => 
          prevBoards.map(board => 
            board.id === selectedWhiteBoard.id ? data.whiteboards[0] : board
          )
        );
      } else {
        setWhiteBoards(prevBoards => [...prevBoards, ...data.whiteboards]);
      }

      setIsEditWhiteBoardOpen(false);
      setWhiteBoardContent("");
      setWhiteBoardTitle("");
      setSelectedWhiteBoard(null);
      toast.success('Whiteboard saved successfully');
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      toast.error('Failed to save whiteboard');
    }
  };

  const loadWhiteBoards = async () => {
    try {
      const response = await fetch(`/api/agents-study-groups/${group.id}/whiteboard`, {
        headers: {
          'x-god-v2-user-id': godV2UserId || ''
        }
      });
      if (!response.ok) throw new Error('Failed to load whiteboards');
      const data = await response.json();
      setWhiteBoards(data.whiteboards || []);
    } catch (error) {
      console.error('Error loading whiteboards:', error);
      toast.error('Failed to load whiteboards');
    }
  };

  useEffect(() => {
    loadWhiteBoards();
  }, [group.id]);

  // Add debug log before the member check
  console.log('Current user ID:', godV2UserId);
  console.log('All members:', members);
  console.log('Group:', group);

  if (!godV2UserId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          Please log in to view the whiteboard content.
        </p>
      </div>
    );
  }

  if (!isGroupMember(godV2UserId, members)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          You must be a member of this group to view the whiteboard content.
        </p>
      </div>
    );
  }

  const sortedWhiteBoards = sortWhiteBoards(whiteBoards || []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold whitespace-nowrap">{group.name} Whiteboard</h2>
        </div>
        <div className="flex items-center gap-4">
          {whiteBoards && whiteBoards.length > 0 && !selectedWhiteBoard && (
            <Select
              label="Select Whiteboard"
              className="min-w-[200px]"
              onChange={(e) => {
                const selected = whiteBoards.find(board => board.id === e.target.value);
                if (selected) {
                  setSelectedWhiteBoard(selected);
                  setWhiteBoardTitle(selected.title);
                  setWhiteBoardContent(selected.content);
                  setWhiteBoardDay(selected.day);
                }
              }}
            >
              {sortedWhiteBoards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.title}
                </SelectItem>
              ))}
            </Select>
          )}
          {selectedWhiteBoard && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">{selectedWhiteBoard.title}</span>
              <Button
                size="sm"
                variant="light"
                onClick={() => setSelectedWhiteBoard(null)}
              >
                View All
              </Button>
            </div>
          )}
          {(isLeader || isAdmin) && (
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setSelectedWhiteBoard(null);
                  setWhiteBoardTitle('');
                  setWhiteBoardContent('');
                  setWhiteBoardDay(new Date().toISOString().split('T')[0]);
                  setIsEditWhiteBoardOpen(true);
                }}
                color="secondary"
                className="text-white whitespace-nowrap"
              >
                New WhiteBoard
              </Button>
              {selectedWhiteBoard && (
                <Button 
                  onClick={() => setIsEditWhiteBoardOpen(true)}
                  color="secondary"
                  variant="bordered"
                >
                  Edit Selected
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-8">
          {sortedWhiteBoards.length > 0 ? (
            (selectedWhiteBoard ? [selectedWhiteBoard] : sortedWhiteBoards).map((board: WhiteBoardContent, index: number) => (
              <div key={`${board.day}-${index}`} className="p-4 rounded-lg border light:bg-white dark:bg-dark">
                <h3 className="text-xl font-semibold mb-4">{board.title}</h3>
                <div 
                  className="prose dark:prose-invert max-w-none" 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(board.content) }} 
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No whiteboards created yet.</p>
              {(isLeader || isAdmin) && (
                <p className="mt-2">
                  Click the "New WhiteBoard" button to create one.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isEditWhiteBoardOpen} 
        onClose={() => setIsEditWhiteBoardOpen(false)}
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
                    {selectedWhiteBoard ? 'Edit Whiteboard' : 'New Whiteboard'}
                  </h2>
                  {whiteBoards && whiteBoards.length > 0 && (
                    <Select
                      label="Select Whiteboard"
                      className="max-w-xs"
                      selectedKeys={selectedWhiteBoard ? [selectedWhiteBoard.id] : []}
                      onChange={(e) => {
                        const selected = whiteBoards.find(board => board.id === e.target.value);
                        if (selected) {
                          setSelectedWhiteBoard(selected);
                          setWhiteBoardTitle(selected.title);
                          setWhiteBoardContent(selected.content);
                          setWhiteBoardDay(selected.day);
                        }
                      }}
                    >
                      {whiteBoards.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.title}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>
              </ModalHeader>
              <ModalBody className="px-6 pt-2">
                <div className="space-y-4">
                  <div className="flex gap-4 pt-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      <label htmlFor="whiteBoardTitle" className="block text-2xl font-bold mt-5 mb-4">
                        Title
                      </label>
                      <Input
                        id="whiteBoardTitle"
                        type="text"
                        value={whiteBoardTitle}
                        onChange={(e) => setWhiteBoardTitle(e.target.value)}
                        className="w-full text-xl"
                        size="lg"
                        placeholder="Enter whiteboard title..."
                      />
                    </div>
                    <div className="w-48">
                      <label htmlFor="whiteBoardDay" className="block text-2xl font-bold mt-5 mb-4">
                        Date
                      </label>
                      <Popover>
                        <PopoverTrigger>
                          <Button 
                            variant="bordered" 
                            className="w-full justify-start text-left text-xl font-normal h-14"
                          >
                            {new Date(whiteBoardDay).toLocaleDateString()}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="p-4">
                            <input
                              type="date"
                              value={whiteBoardDay}
                              onChange={(e) => setWhiteBoardDay(e.target.value)}
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xl"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="h-[calc(80vh-220px)]">
                    <div className="h-full">
                      <Editor
                        apiKey={process.env.NEXT_PUBLIC_TINY_MCE_API_KEY}
                        value={whiteBoardContent}
                        onEditorChange={(content) => {
                          console.log('Editor content changed:', content);
                          setWhiteBoardContent(content);
                        }}
                        init={{
                          height: "100%",
                          menubar: true,
                          branding: false,
                          promotion: false,
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                            'emoticons', 'imagetools', 'paste'
                          ],
                          toolbar: 'undo redo | blocks | ' +
                            'bold italic | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | link image media emoticons | help',
                          content_style: `
                            body { 
                              font-family: Helvetica, Arial, sans-serif; 
                              font-size: 14px;
                              background-color: #ffffff;
                              color: #000000;
                              margin: 0;
                              padding: 1.5rem;
                              height: 100%;
                              min-height: 100%;
                            }
                            body.dark-theme { 
                              background-color: #0D0C22;
                              color: #ffffff;
                            }
                            .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
                              color: #6b7280;
                            }
                          `,
                          skin: document.documentElement.classList.contains('dark') ? 'oxide-dark' : 'oxide',
                          content_css: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                          file_picker_types: 'file image media',
                          file_picker_callback: function(callback, value, meta) {
                            const input = document.createElement('input');
                            input.setAttribute('type', 'file');
                            
                            // Set accept attribute based on file type
                            if (meta.filetype === 'image') {
                              input.setAttribute('accept', 'image/*');
                            } else if (meta.filetype === 'media') {
                              input.setAttribute('accept', 'video/*,audio/*');
                            } else if (meta.filetype === 'file') {
                              input.setAttribute('accept', '*/*');
                            }

                            input.onchange = function() {
                              if (!input.files || input.files.length === 0) return;
                              
                              const file = input.files[0];
                              const reader = new FileReader();

                              reader.onload = function() {
                                const id = 'blobid' + (new Date()).getTime();
                                const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
                                const base64 = (reader.result as string).split(',')[1];
                                const blobInfo = blobCache.create(id, file, base64);
                                blobCache.add(blobInfo);

                                callback(blobInfo.blobUri(), { title: file.name });
                              };
                              reader.readAsDataURL(file);
                            };

                            input.click();
                          },
                          paste_data_images: true,
                          automatic_uploads: true,
                          image_advtab: true,
                          image_dimensions: false,
                          media_live_embeds: true,
                          statusbar: false,
                          setup: function (editor) {
                            editor.on('init', function () {
                              const isDarkMode = document.documentElement.classList.contains('dark');
                              if (isDarkMode) {
                                editor.getBody().classList.add('dark-theme');
                              }
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="py-2">
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  className="text-white"
                  onPress={async () => {
                    await handleSaveWhiteBoard();
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
    </div>
  );
} 