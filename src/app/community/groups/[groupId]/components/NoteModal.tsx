import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import Button from '@/components/CustomButtons/Button';
import { ChevronDown, ChevronUp, MessageCircle, Send } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: string | Date;
  user: User;
}

interface Note {
  id: string;
  content: string;
  title: string | null;
  created_at: string | Date;
  user: User;
  agents_group_note_replies: Reply[];
}

interface NoteModalProps {
  note: Note;
  onClose: () => void;
  onReply: (content: string) => void;
}

export function NoteModal({ note, onClose, onReply }: NoteModalProps) {
  const [currentSection, setCurrentSection] = useState<'note' | 'replies' | 'editor'>('note');
  const [replyContent, setReplyContent] = useState('');
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: 'note' | 'replies' | 'editor') => {
    setCurrentSection(section);
    if (containerRef.current) {
      const sectionElement = containerRef.current.querySelector(`#${section}-section`);
      sectionElement?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent);
      setReplyContent('');
      scrollToSection('replies');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl h-[80vh] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Navigation Buttons */}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <Button
            color="transparent"
            className="bg-gray-800/50 backdrop-blur-sm w-8 h-8 rounded-full"
            onClick={onClose}
          >
            ×
          </Button>
        </div>

        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4">
          <Button
            color="transparent"
            className={`bg-gray-800/50 backdrop-blur-sm w-8 h-8 rounded-full ${
              currentSection === 'note' ? 'text-purple-500' : ''
            }`}
            onClick={() => scrollToSection('note')}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            color="transparent"
            className={`bg-gray-800/50 backdrop-blur-sm w-8 h-8 rounded-full ${
              currentSection === 'replies' ? 'text-purple-500' : ''
            }`}
            onClick={() => scrollToSection('replies')}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button
            color="transparent"
            className={`bg-gray-800/50 backdrop-blur-sm w-8 h-8 rounded-full ${
              currentSection === 'editor' ? 'text-purple-500' : ''
            }`}
            onClick={() => scrollToSection('editor')}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <div 
          ref={containerRef}
          className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {/* Note Section */}
          <section 
            id="note-section"
            className="min-h-full p-8 snap-start flex flex-col justify-center"
          >
            <div className="max-w-3xl mx-auto w-full space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={note.user?.image || '/images/default-avatar.png'}
                  alt={note.user?.name || 'User'}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold">{note.title}</h2>
                  <div className="text-gray-400">
                    {note.user?.name} • {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
          </section>

          {/* Replies Section */}
          <section 
            id="replies-section"
            className="min-h-full p-8 snap-start bg-gray-900/50"
          >
            <div className="max-w-3xl mx-auto w-full">
              <h3 className="text-xl font-semibold mb-6">
                Replies ({note.agents_group_note_replies.length})
              </h3>
              <div className="space-y-6">
                {note.agents_group_note_replies.map((reply: Reply) => (
                  <div 
                    key={reply.id}
                    className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={reply.user?.image || '/images/default-avatar.png'}
                        alt={reply.user?.name || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-semibold">{reply.user.name}</div>
                        <div className="text-sm text-gray-400">
                          {format(new Date(reply.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div 
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: reply.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Editor Section */}
          <section 
            id="editor-section"
            className="min-h-full p-8 snap-start bg-gray-900/30"
          >
            <div className="max-w-3xl mx-auto w-full space-y-6">
              <h3 className="text-xl font-semibold">Write a Reply</h3>
              <Editor
                onInit={(evt, editor) => editorRef.current = editor}
                value={replyContent}
                onEditorChange={(content) => setReplyContent(content)}
                init={{
                  height: 400,
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
                  skin: 'oxide-dark',
                  content_css: 'dark',
                  content_style: `
                    body { 
                      background: #1f2937;
                      color: #e5e7eb;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                      font-size: 16px;
                      line-height: 1.5;
                      padding: 1rem;
                    }
                  `,
                }}
              />
              <div className="flex justify-end">
                <Button
                  color="primary"
                  className="text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  onClick={handleSaveReply}
                >
                  <Send className="w-4 h-4" />
                  Send Reply
                </Button>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
} 