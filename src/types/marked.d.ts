/**
 * types/marked.d.ts
 * Type definitions for the marked markdown parser library
 * 
 * This file provides TypeScript type definitions for the marked library which:
 * - Converts markdown text to HTML
 * - Supports GitHub Flavored Markdown (GFM)
 * - Allows customization of parsing behavior
 * 
 * Used by:
 * - app/(main)/(routes)/agents-chat/page.tsx (For rendering markdown messages)
 * - Any component that needs to parse markdown to HTML
 * 
 * Related files:
 * - package.json (where marked is listed as a dependency)
 * - tsconfig.json (where these type definitions are included)
 */

declare module 'marked' {
  /**
   * Configuration options for the marked parser
   * Controls how markdown is parsed and rendered
   */
  interface MarkedOptions {
    breaks?: boolean;        // Respect line breaks in markdown
    gfm?: boolean;          // Use GitHub Flavored Markdown
    headerIds?: boolean;    // Add IDs to headers
    headerPrefix?: string;  // Prefix for header IDs
    langPrefix?: string;    // Prefix for code block language classes
    mangle?: boolean;       // Escape autolinks
    pedantic?: boolean;     // Use pedantic markdown
    sanitize?: boolean;     // Sanitize HTML input
    silent?: boolean;       // Ignore errors
    smartLists?: boolean;   // Use smarter list behavior
    smartypants?: boolean;  // Use smart punctuation
    xhtml?: boolean;        // Use self-closing XHTML tags
  }

  /**
   * Main function to convert markdown to HTML
   * @param text The markdown text to parse
   * @param options Configuration options for parsing
   * @returns The parsed HTML as a string
   */
  export function marked(text: string, options?: MarkedOptions): string;

  /**
   * Alternative name for the marked function
   * Provided for compatibility with some markdown processors
   */
  export function parse(text: string, options?: MarkedOptions): string;
} 