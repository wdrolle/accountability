'use client';

import { Suspense } from 'react';
import { PrayerRequestList } from '@/components/Prayer/PrayerRequestList';
import CreatePrayerRequestButton from '@/components/Prayer/CreatePrayerRequestButton';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  PenTool, 
  Heart, 
  Bell, 
  Lock, 
  BarChart, 
  Users 
} from 'lucide-react';

const prayerFeatures = [
  {
    id: 1,
    title: "Create Prayer Requests",
    description: "Share your prayer needs with our caring community. Add details about your request, choose privacy settings, and receive support from fellow believers.",
    icon: PenTool,
  },
  {
    id: 2,
    title: "Pray for Others",
    description: "Support others through prayer. Leave encouraging messages, share contact information if desired, and build meaningful connections in faith.",
    icon: Heart,
  },
  {
    id: 3,
    title: "Email Notifications",
    description: "Receive instant notifications when someone prays for your request. Stay connected with those supporting you through prayer.",
    icon: Bell,
  },
  {
    id: 4,
    title: "Privacy Controls",
    description: "Choose to remain anonymous, control who sees your contact information, and manage your prayer request visibility.",
    icon: Lock,
  },
  {
    id: 5,
    title: "Prayer Tracking",
    description: "See how many people have prayed for each request, track responses, and witness the power of community prayer.",
    icon: BarChart,
  },
  {
    id: 6,
    title: "Community Support",
    description: "Connect with a global community of believers, share burdens, and experience the strength of united prayer.",
    icon: Users,
  },
];

export default function PrayersPage() {
  return (
    <>
    <Breadcrumb pageTitle="Prayer Requests" />
    <div className="min-h-screen bg-gradient-to-b from-background/50 to-background">
      <div className="container mx-auto px-0 py-2">

        <div className="flex flex-col items-center justify-center mt-5 mb-5">
          <CreatePrayerRequestButton />
        </div>

        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-900/10 rounded-lg -m-2" />
          <div className="relative bg-card/40 backdrop-blur-sm rounded-lg p-6">
            <Suspense fallback={<div>Loading...</div>}>
              <PrayerRequestList />
            </Suspense>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prayerFeatures.map((feature) => (
              <div
                key={feature.id}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-900/10 rounded-lg -m-2" />
                <div className="relative p-6 rounded-lg bg-card/40 backdrop-blur-sm transition-transform duration-300 ease-in-out transform hover:-translate-y-1">
                  <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-900/20 mb-4 ring-1 ring-border">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
} 