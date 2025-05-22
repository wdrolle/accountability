"use client";

import { useState, useEffect, useRef } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { ScrollShadow, Accordion, AccordionItem, Button } from "@heroui/react";
import ReactMarkdown from 'react-markdown';
import { AIMessage } from '@/types/ai-agents';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import JSZip from 'jszip';

import { saveAs } from 'file-saver';
import { useSession } from 'next-auth/react';

interface CodeBlock {
  language: string;
  filename: string;
  code: string;
  path?: string;
}

interface FileStructure {
  rootDir: string;
  files: string[];
}

export function AIChat() {
  const { data: session } = useSession();
  const { messages, isLoading, error, sendMessage, debugInfo, thinkingState } = useAIChat();
  const [input, setInput] = useState('');
  const rawFirstName =
  session?.user?.name?.split(' ')[0] ||
  session?.user?.email?.split('@')[0] ||
  'User';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1) + '\'s Prompt';
  const [extractedCode, setExtractedCode] = useState<CodeBlock[]>([]);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [fileStructure, setFileStructure] = useState<FileStructure | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract code blocks when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content.includes('```')) {
        const blocks = extractCodeBlocks(lastMessage.content);
        setExtractedCode(blocks);
        setCurrentMessageId(lastMessage.id); // You'll need to add an id field to AIMessage
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input.trim());
    setInput('');
  };

  const extractCodeBlocks = (content: string): CodeBlock[] => {
    const blocks: CodeBlock[] = [];
    // Updated regex to better handle code blocks with language and path
    const regex = /```([\w-]+)?:?([^\n]+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const [_, language, filepath, code] = match;
      
      // Skip if this is just a regular code block without a filepath
      if (!filepath) continue;

      // Clean and validate the code content
      const cleanCode = code.trim();
      if (!cleanCode) continue;

      // Split filepath into path and filename
      const parts = filepath.trim().split('/');
      const filename = parts.pop() || '';
      const path = parts.join('/');

      console.log('Found code block:', {
        language,
        filepath,
        filename,
        path,
        codeLength: cleanCode.length
      });

      blocks.push({
        language: language || 'text',
        filename,
        code: cleanCode,
        path: path || undefined
      });
    }

    return blocks;
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
      console.log('Code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const downloadAsZip = async (blocks: CodeBlock[]) => {
    try {
      if (!blocks || blocks.length === 0) {
        console.error('No valid code blocks to download');
        return;
      }

      console.log('Preparing to create zip with blocks:', blocks);
      const zip = new JSZip();
      const createdFolders = new Set<string>();

      // Sort blocks to ensure parent directories are created first
      const sortedBlocks = [...blocks].sort((a, b) => 
        (a.path?.length || 0) - (b.path?.length || 0)
      );

      for (const block of sortedBlocks) {
        if (!block.filename || !block.code) {
          console.warn('Skipping invalid block:', block);
          continue;
        }

        // Create full path
        const fullPath = block.path 
          ? `${block.path}/${block.filename}`
          : block.filename;

        // Create all necessary parent folders
        if (block.path) {
          const folders = block.path.split('/');
          let currentPath = '';
          for (const folder of folders) {
            currentPath = currentPath ? `${currentPath}/${folder}` : folder;
            if (!createdFolders.has(currentPath)) {
              zip.folder(currentPath);
              createdFolders.add(currentPath);
              console.log(`Created folder: ${currentPath}`);
            }
          }
        }

        // Add file to zip
        zip.file(fullPath, block.code);
        console.log(`Added file to zip: ${fullPath} (${block.code.length} bytes)`);
      }

      // Generate zip file
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 }
      });

      if (content.size === 0) {
        throw new Error('Generated zip file is empty');
      }

      console.log(`Generated zip file (${content.size} bytes) with ${blocks.length} files`);
      saveAs(content, "generated-code.zip");
    } catch (error) {
      console.error('Error creating zip:', error);
    }
  };

  const extractFileStructure = (content: string): FileStructure | null => {
    const structureMatch = content.match(/File Structure\n\n([\s\S]*?)\n\n/);
    if (structureMatch) {
      const lines = structureMatch[1].split('\n');
      const rootDir = lines[0].trim();
      const files = lines
        .slice(1)
        .filter(line => line.includes('.'))
        .map(line => line.trim().replace(/[│├└─\s]/g, ''));
      return { rootDir, files };
    }
    return null;
  };

  const renderFileStructure = (structure: FileStructure) => (
    <div className="my-4 p-4 border border-default-200 rounded-lg bg-default-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold">Project Structure</h3>
        <Button
          size="sm"
          onClick={() => copyToClipboard(structure.files.join('\n'))}
          className="text-tiny"
        >
          Copy Structure
        </Button>
      </div>
      <pre className="text-sm overflow-x-auto">
        {structure.rootDir}
        {structure.files.map(file => `\n  ${file}`)}
      </pre>
    </div>
  );

  const renderMessage = (message: AIMessage) => (
    <>
      {/* Extract and show file structure if present */}
      {message.role === 'assistant' && message.agent === 'deepseek' && (
        <>
          {fileStructure && renderFileStructure(fileStructure)}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              onClick={() => {
                const blocks = extractCodeBlocks(message.content);
                console.log(`Found ${blocks.length} code blocks to download`);
                downloadAsZip(blocks);
              }}
              className="text-tiny bg-primary text-white"
              startContent={<span className="material-icons text-sm">download</span>}
              disabled={!message.content.includes('```')}
            >
              Download All Files ({extractCodeBlocks(message.content).length})
            </Button>
            <Button
              onClick={() => copyToClipboard(message.content)}
              className="text-tiny"
              startContent={<span className="material-icons text-sm">content_copy</span>}
            >
              Copy All Code
            </Button>
          </div>
        </>
      )}

      <ReactMarkdown 
        className="whitespace-pre-wrap prose dark:prose-invert max-w-none prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 prose-headings:my-1"
        components={{
          p: ({children}) => <p className="my-0">{children}</p>,
          ul: ({children}) => <ul className="list-disc pl-4 my-0">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-4 my-0">{children}</ol>,
          li: ({children}) => <li className="my-0">{children}</li>,
          code: ({children, className}) => {
            if (className?.includes(':')) {
              const [lang, filename] = className.replace('language-', '').split(':');
              const codeContent = children as string;
              
              return (
                <div className="relative my-4 rounded-lg overflow-hidden border border-default-200">
                  <div className="flex justify-between items-center p-2 bg-default-100">
                    <span className="text-sm text-default-500">{filename}</span>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(codeContent)}
                      className="text-tiny"
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="p-4 bg-default-50 overflow-x-auto">
                    <code className="text-sm">{codeContent}</code>
                  </pre>
                </div>
              );
            }
            return <code className="bg-default-300 rounded px-1">{children}</code>;
          },
          pre: ({children}) => <pre className="bg-default-300 rounded p-2 my-1">{children}</pre>,
          h1: ({children}) => <h1 className="text-xl font-bold my-1">{children}</h1>,
          h2: ({children}) => <h2 className="text-lg font-bold my-1">{children}</h2>,
          h3: ({children}) => <h3 className="text-base font-bold my-1">{children}</h3>,
        }}
      >
        {typeof debugInfo?.llama_feedback === 'object' 
          ? debugInfo.llama_feedback.analysis 
          : String(debugInfo?.llama_feedback)}
      </ReactMarkdown>
    </>
  );

  // Group messages by conversation
  const messageGroups = messages.reduce((groups: any[], message, index) => {
    if (message.role === 'user') {
      groups.push([message]);
    } else {
      if (groups.length === 0) groups.push([]);
      // Add Llama's initial response and analysis
      if (message.agent === 'llama3' && !message.hidden) {
        groups[groups.length - 1].push({
          ...message,
          title: 'Llama Analysis',
          hidden: true,
          content: `
### Code Implementation Review

${message.content}

### Analysis
${debugInfo?.llama_feedback || 'Code implementation looks good and follows best practices.'}

### Recommendations
- Ensure proper error handling is implemented
- Add input validation where necessary
- Consider adding unit tests
- Review security practices
`
        });
      }
      groups[groups.length - 1].push(message);
    }
    return groups;
  }, []);

  // Update the deepseek prompt to ensure complete file list
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.agent === 'deepseek') {
        const structure = extractFileStructure(lastMessage.content);
        if (structure) {
          setFileStructure(structure);
        }
      }
    }
  }, [messages]);

  // Add auto-resize function
  const autoResize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    const newHeight = Math.min(Math.max(element.scrollHeight, 44), 400); // 44px min, 400px max (10 rows approx)
    element.style.height = `${newHeight}px`;
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(87vh-100px)]">
      <ScrollShadow className="flex-1 w-full">
        <div className="max-w-4xl mx-auto space-y-6">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              {/* User message */}
              {group[0]?.role === 'user' && (
                <div className="p-4 border border-default-100 rounded-lg bg-primary/10 ml-auto">
                  <p className="text-sm font-medium mb-1">{firstName}</p>
                  <p>{group[0].content}</p>
                </div>
              )}

              {/* AI responses */}
              {group.slice(1).map((message: AIMessage, i: number) => (
                message.hidden ? (
                  <Accordion 
                    key={i} 
                    variant="bordered" 
                    className="bg-transparent"
                    defaultExpandedKeys={[]}
                  >
                    <AccordionItem 
                      key={`${groupIndex}-${i}`}
                      aria-label={message.title || `${message.agent} Analysis`}
                      title={message.title || `${message.agent.charAt(0).toUpperCase() + message.agent.slice(1)} Analysis`}
                      className="px-5"
                    >
                      {renderMessage(message)}
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div key={i} className="p-4 border border-default-100 rounded-lg bg-transparent">
                    <p className="text-sm font-medium mb-1">{message.title || 'DeepSeek Final Response'}</p>
                    {renderMessage(message)}
                  </div>
                )
              ))}
            </div>
          ))}

          {isLoading && (
            <div className="space-y-2">
              {thinkingState.deepseek && (
                <div className="p-4 border border-default-100 rounded-lg bg-transparent">
                  <p className="text-sm font-medium mb-1">DeepSeek is thinking...</p>
                  <div className="flex items-center gap-2">
                    <LoadingIndicator />
                    {thinkingState.currentThought && (
                      <p className="text-sm text-default-500">{thinkingState.currentThought}</p>
                    )}
                  </div>
                </div>
              )}
              {thinkingState.llama && (
                <div className="p-4 border border-default-100 rounded-lg bg-transparent">
                  <p className="text-sm font-medium mb-1">Llama is thinking...</p>
                  <div className="flex items-center gap-2">
                    <LoadingIndicator />
                    <p className="text-sm text-default-500">Generating initial code implementation...</p>
                  </div>
                </div>
              )}
              {thinkingState.finalizing && (
                <div className="p-4 border border-default-100 rounded-lg bg-transparent">
                  <p className="text-sm font-medium mb-1">Finalizing response...</p>
                  <LoadingIndicator />
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="p-4 rounded-lg bg-danger-100 text-danger">
              {error}
            </div>
          )}
        </div>
      </ScrollShadow>

      {/* Input form at bottom */}
      <div className="flex flex-col gap-2 mt-4 w-full">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto w-full">
          <div className="flex gap-2">
            {/* Expand/Collapse Button */}
            <button
              type="button"
              onClick={() => {
                setIsExpanded(!isExpanded);
                if (textareaRef.current) {
                  // Reset height when collapsing
                  if (isExpanded) {
                    textareaRef.current.style.height = '44px';
                  } else {
                    autoResize(textareaRef.current);
                  }
                }
              }}
              className="self-start mt-3 p-2 rounded-full hover:bg-default-200 transition-colors"
            >
              {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              )}
            </button>

            {/* Textarea Container */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (!isExpanded) {
                    autoResize(e.target);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask me anything..."
                className={`w-full bg-content1 rounded-lg resize-none transition-all duration-200 p-3 pr-3 ${
                  isExpanded ? 'min-h-[400px]' : 'min-h-[44px]'
                }`}
                disabled={isLoading}
                rows={1}
                style={{ height: isExpanded ? '400px' : 'auto' }}
              />
              <p className="text-tiny text-default-400 mt-1">
                AI can make mistakes. Consider checking important information.
              </p>
            </div>

            {/* Send Button - Outside of textarea */}
            <div className="self-start mt-3">
              <Button
                type="submit"
                isLoading={isLoading}
                className="bg-primary text-white px-8 min-w-[100px] h-[44px]"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 