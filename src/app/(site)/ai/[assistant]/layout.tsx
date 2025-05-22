import { Suspense } from 'react';

export default function AILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

// Use static metadata instead of dynamic
export const metadata = {
  title: 'AI Chat',
  description: 'Chat with your AI Assistant',
  openGraph: {
    title: 'AI Chat',
    description: 'Interactive chat with your AI Assistant',
  },
};

export const dynamic = 'force-dynamic';
export const dynamicParams = true; 