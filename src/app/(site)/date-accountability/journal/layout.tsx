import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal | Amorolle',
  description: 'Private journal entries with optional AI insights, tags, and mood tracking.',
};

export default function PrayerJournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 