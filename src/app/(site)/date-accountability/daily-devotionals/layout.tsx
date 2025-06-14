import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Devotionals | CStudios',
  description: 'Review your daily devotionals and prayers.',
};

export default function DailyDevotionalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 