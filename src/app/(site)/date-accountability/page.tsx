/**
 * AI Journal home
 * Path: /journal
 */

import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';

export const metadata: Metadata = {
  title: 'AI Journal | Amorolle',
  description: 'Private journal with AI insights, reminders, lists, and everyday follow-through.',
};

const journalFeatures = [
  {
    title: "Journal",
    description: "Write freely, add a mood, and keep any entry out of AI analysis.",
    href: "/journal/journal",
    cta: "Open journal",
  },
  {
    title: "Insights",
    description: "See mood trends, recurring themes, and gentle observations — never diagnoses.",
    href: "/journal/analysis",
    cta: "View insights",
  },
  {
    title: "Lists & bills",
    description: "To-dos, shopping lists, and lightweight bill reminders in one place.",
    href: "/journal/lists",
    cta: "Manage lists",
  },
  {
    title: "Reminders",
    description: "Quiet-hour friendly check-ins and habit reminders you control.",
    href: "/journal/date-reminders",
    cta: "Configure reminders",
  },
  {
    title: "Ask the AI",
    description: "Request a plan, a lookup, or help turning an intention into a next step.",
    href: "/ai/assistant",
    cta: "Open chat",
  },
  {
    title: "About & safety",
    description: "This is not therapy. Crisis support is 988. You choose what the AI can read.",
    href: "/about",
    cta: "Read about",
  },
];

export default async function DateAccountabilityPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Breadcrumb pageTitle="AI Journal" />
      <div className="w-full px-4 py-8 sm:px-6 lg:px-12">
        <h1 className="mb-4 text-2xl font-bold text-black dark:text-white sm:text-3xl">AI Journal</h1>
        <p className="mb-6 w-full max-w-none text-gray-600 dark:text-gray-400">
          A private writing space with an assistant that can notice patterns and help with
          reminders, recaps, and everyday lists — only with your consent. Not a mental health
          provider and not a substitute for professional care.
        </p>
        {!session && (
          <Button
            as={Link}
            href="/api/auth/hub-signin?next=/journal/journal"
            className="mb-8 bg-black text-white"
          >
            Sign in to start writing
          </Button>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {journalFeatures.map((feature) => (
            <Card key={feature.title} className="border border-gray-200 bg-gray-50 text-black dark:border-white/10 dark:bg-dark-6 dark:text-white">
              <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
                <h2 className="text-xl font-semibold text-black dark:text-white">{feature.title}</h2>
              </CardHeader>
              <CardBody className="px-4 pb-5 sm:px-6 sm:pb-6">
                <p className="mb-4 text-gray-600 dark:text-gray-400">{feature.description}</p>
                <Button as={Link} href={feature.href} color="secondary" variant="flat">
                  {feature.cta}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
