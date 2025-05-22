'use client';

import { Card, CardBody, Button } from '@nextui-org/react';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

export default function MessagesPage() {
  const router = useRouter();

  return (
    <>
      <Breadcrumb 
        pageTitle="Messages" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              Message Management
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              Manage message delivery and settings.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white dark:bg-[#18181b]">
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white">Message Settings</h3>
                    <p className="text-small text-default-500">Configure message delivery times and cron jobs</p>
                  </div>
                  <Settings className="w-6 h-6" />
                </div>
                <Button
                  color="primary"
                  onPress={() => router.push('/admin-console/messages/settings')}
                >
                  Configure Settings
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 