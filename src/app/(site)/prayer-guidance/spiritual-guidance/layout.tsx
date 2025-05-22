import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spiritual Guidance | Prayer Review',
  description: 'Get AI-powered insights and analysis of your prayer journey.',
};

export default function SpiritualGuidanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 