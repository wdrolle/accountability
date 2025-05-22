// components/ui/styled-input.tsx

'use client';

/**
 * Styled Input Component
 * 
 * Purpose:
 * - Provides a themed, customizable textarea input component
 * - Adapts styling based on current theme (light/dark)
 * - Built on top of NextUI's Textarea component with custom styling
 * 
 * Used By:
 * - agents-chat/page.tsx (For chat input)
 * - Any form or input area needing themed text input
 * 
 * How to Use:
 * 1. Basic usage:
 *    <StyledInput
 *      value={inputValue}
 *      onChange={(e) => setInputValue(e.target.value)}
 *      placeholder="Type something..."
 *    />
 * 
 * 2. With custom styling:
 *    <StyledInput
 *      className="custom-class"
 *      classNames={{
 *        input: "custom-input",
 *        inputWrapper: "custom-wrapper"
 *      }}
 *      minRows={2}
 *      maxRows={4}
 *    />
 */

import { Textarea } from "@nextui-org/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useTheme } from "styled-components/dist/base";

// Props interface for the StyledInput component
interface StyledInputProps {
  value: string;                // Current input value
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;  // Change handler
  placeholder?: string;         // Optional placeholder text
  className?: string;          // Optional container class
  classNames?: {              // Optional class names for subcomponents
    input?: string;
    inputWrapper?: string;
    [key: string]: string | undefined;
  };
  isClearable?: boolean;      // Whether to show clear button
  fullWidth?: boolean;        // Whether to take full width
  size?: "sm" | "md" | "lg";  // Input size variant
  "aria-label"?: string;      // Accessibility label
  minRows?: number;           // Minimum number of rows
  maxRows?: number;           // Maximum number of rows
}

export function StyledInput(props: StyledInputProps) {
  // Get current theme from context
  const { resolvedTheme: theme } = useTheme();
  
  // Construct base classes with theme-aware styling
  const baseClasses = `
    flex-1 
    min-h-[80px] 
    rounded-lg
    mx-0
    my-0
    px-0
    py-0
    resize-none
    ${theme === 'dark' 
      ? 'bg-transparent text-white focus:border-0 focus:ring-0 border-0' 
      : 'bg-transparent text-gray-900 focus:border-0 focus:ring-0 border-0'
    } 
    shadow-inner 
    transition-colors 
    duration-200 
    ${props.className || ''}
  `;

  return (
    <Textarea
      {...props}
      className={baseClasses}
      classNames={{
        input: "px-4 py-2",                           // Input padding
        inputWrapper: "bg-transparent dark:bg-transparent",  // Wrapper background
        ...(props.classNames || {})                   // Custom classNames override
      }}
      minRows={props.minRows || 1}
      maxRows={props.maxRows || 4}
    />
  );
} 