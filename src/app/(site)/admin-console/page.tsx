// src/app/(site)/admin-console/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  User,
  Users, 
  MessageSquare, 
  Settings, 
  BarChart, 
  Clock,
  Calendar,
  Bell,
  Database,
  CreditCard,
  Mic
} from 'lucide-react';

const adminFeatures = [
  {
    title: "User Management",
    description: "Manage user accounts and permissions",
    icon: User,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "View Users", href: "/admin-console/users" },
      // { label: "Manage Roles", href: "/admin-console/roles" }
    ]
  },
  {
    title: "Update Users",
    description: "Update user metadata",
    icon: Users,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "Update Auth.Users", href: "/admin-console/update-users" }
    ]
  },
  {
    title: "Meeting Recorder",
    description: "Record and transcribe meetings with AI analysis",
    icon: Mic,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "Record Meeting", href: "/admin-console/meetings" }
    ]
  },
  {
    title: "Automated Messages",
    description: "Manage daily devotional messages sent to users and families",
    icon: MessageSquare,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "Message Queue", href: "/admin-console/messages/queue" },
      { label: "Schedule Settings", href: "/admin-console/messages/schedule" }
    ]
  },
  {
    title: "CRON Jobs",
    description: "Monitor and manage automated tasks",
    icon: Settings,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "View Jobs", href: "/admin-console/jobs" }
    ]
  },
  {
    title: "Message Settings",
    description: "Configure message delivery times and cron jobs",
    icon: Clock,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "Configure", href: "/admin-console/messages/settings" }
    ]
  },
  {
    title: "Analytics",
    description: "Monitor system performance and user engagement",
    icon: BarChart,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "View Reports", href: "/admin-console/analytics" }
    ]
  },
  {
    title: "Scheduling",
    description: "Manage automated tasks and message delivery",
    icon: Calendar,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "View Schedule", href: "/admin-console/schedule" }
    ]
  },
  {
    title: "Notifications",
    description: "Manage system notifications and alerts",
    icon: Bell,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "Configure", href: "/admin-console/notifications" }
    ]
  },
  {
    title: "Database",
    description: "Monitor and manage database operations",
    icon: Database,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "View Status", href: "/admin-console/database" }
    ]
  },
  {
    title: "Payments",
    description: "Monitor and manage payment transactions",
    icon: CreditCard,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
    actions: [
      { label: "View Payments", href: "/admin-console/payments" }
    ]
  }
];

export default function AdminConsolePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Debug session state
    console.log('Admin Console - Session:', {
      session,
      status,
      is_super_admin: session?.user?.is_super_admin,
      role: session?.user?.role
    });

    // Only update loading state when we have session data
    if (status !== 'loading') {
      if (!session?.user?.is_super_admin && session?.user?.role !== 'ADMIN') {
        router.push('/auth/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (isLoading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If not admin, show access denied message
  if (!session?.user?.is_super_admin && session?.user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // If we get here, user is authenticated and is super admin
  return (
    <>
      <Breadcrumb pageTitle="Admin Console" className="mb-4 text-center"/>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <p className="text-center text-gray-300 dark:text-gray-300 light:text-black max-w-2xl mx-auto">
            Manage users, automated messages, and system settings from this centralized admin console.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {adminFeatures.map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-xl p-8 h-full transition-all border border-gray-300/20 dark:border-gray-600/20 shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
              style={{
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)',
                transform: 'perspective(1000px) rotateX(2deg)'
              }}
            >
              <div className="relative z-10">
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-full ${feature.bgColor} mb-6 border border-black/10 transform hover:scale-105 transition-transform`}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                  <div className="absolute inset-[1px] rounded-full ring-1 ring-white/10 shadow-inner" />
                  <div className="absolute inset-0 rounded-full shadow-lg" />
                  <feature.icon className={`h-8 w-8 ${feature.color} relative z-10 drop-shadow-lg`} />
                </div>
                <h3 className="text-xl font-semibold text-white dark:text-white light:text-black mb-4 transform hover:-translate-y-0.5 transition-transform">
                  {feature.title}
                </h3>
                <p className="text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform mb-6">
                  {feature.description}
                </p>
                <div className="space-y-2">
                  {feature.actions.map((action) => (
                    <a
                      key={action.label}
                      href={action.href}
                      className="button-border-gradient hover:button-gradient-hover relative flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm text-white dark:text-white light:text-black shadow-button hover:shadow-none w-full"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 