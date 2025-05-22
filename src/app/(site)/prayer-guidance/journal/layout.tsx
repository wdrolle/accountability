import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Journal | CStudios',
  description: 'Keep track of your prayers and spiritual journey over time.',
};

export default function PrayerJournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 