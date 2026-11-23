'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/Breadcrumb';
import { Card, CardBody, CardHeader, Progress, Button, Chip } from '@heroui/react';
import Link from 'next/link';
import { appApiUrl } from '@/lib/journal';

enum subscription_status_enum {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL'
}

interface SubscriptionInfo {
  status: subscription_status_enum;
  plan: string;
  subscription_plan?: string;
  start_date: string;
  end_date: string;
  usage?: {
    messages_sent?: number;
    messages_limit?: number;
    ai_chats_used?: number;
    ai_chats_limit?: number;
    family_members?: number;
    family_members_limit?: number;
  };
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  payment_status?: string;
  trial_ends_at?: string;
  family_plan?: Array<{id: string; name: string}>;
  family_count?: number;
  congregation?: string[];
  study_groups_member?: number;
  study_groups_leader?: number;
  study_groups_admin?: number;
  discussions_created?: number;
  prayers_created?: number;
  prayers_replied?: number;
  newsletter_subscribed?: boolean;
}

const SubscriptionPage = () => {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchSubscriptionInfo();
    }
  }, [session]);

  const fetchSubscriptionInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(appApiUrl('/api/user/subscription'));
      const data = await response.json();

      if (response.ok) {
        setSubscription(data.subscription);
      } else {
        toast.error(data.error || 'Failed to load subscription information');
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl text-black dark:text-white">Please log in to view your subscription</p>
      </div>
    );
  }

  const usage = subscription?.usage || {};
  const messagesSent = usage.messages_sent || 0;
  const messagesLimit = usage.messages_limit || 0;
  const chatsUsed = usage.ai_chats_used || 0;
  const chatsLimit = usage.ai_chats_limit || 0;

  return (
    <>
      <Breadcrumb pageTitle="Subscription Details" />
      <section className="pb-5 pt-5">
        <div className="container mx-auto max-w-5xl px-4">
          <Card className="border border-gray-200 bg-gray-50 text-black dark:border-white/10 dark:bg-dark-6 dark:text-white">
            <CardHeader className="flex flex-col items-start justify-between gap-3 px-4 pt-5 sm:flex-row sm:items-center sm:px-6 sm:pt-6">
              <h4 className="text-xl font-bold text-black dark:text-white sm:text-2xl">Subscription Details</h4>
              <Button as={Link} href="/pricing" className="bg-gray-900 text-white dark:bg-white/15 dark:text-white">
                Upgrade Plan
              </Button>
            </CardHeader>
            <CardBody className="px-4 pb-6 sm:px-6 sm:pb-8">
              {isLoading && (
                <p className="text-gray-600 dark:text-gray-400">Loading your plan details…</p>
              )}
              {!isLoading && !subscription && (
                <p className="text-gray-600 dark:text-gray-400">Could not load your plan details. Try refreshing.</p>
              )}
              {subscription && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                    <CardBody>
                      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">Status</h3>
                      <Chip
                        color={
                          subscription.status === 'ACTIVE' ? 'success' :
                          subscription.status === 'TRIAL' ? 'warning' :
                          subscription.status === 'PAUSED' ? 'default' :
                          'danger'
                        }
                      >
                        {subscription.status}
                      </Chip>
                    </CardBody>
                  </Card>

                  <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                    <CardBody>
                      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">Plan</h3>
                      <p className="text-black dark:text-white">{subscription.plan || subscription.subscription_plan || 'Starter'}</p>
                    </CardBody>
                  </Card>

                  <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                    <CardBody>
                      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">Period</h3>
                      <p className="text-black dark:text-white">
                        {subscription.start_date && subscription.end_date
                          ? `${new Date(subscription.start_date).toLocaleDateString()} - ${new Date(subscription.end_date).toLocaleDateString()}`
                          : 'Not Available'}
                      </p>
                    </CardBody>
                  </Card>

                  {subscription.trial_ends_at && (
                    <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                      <CardBody>
                        <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">Trial Ends</h3>
                        <p className="text-black dark:text-white">{new Date(subscription.trial_ends_at).toLocaleDateString()}</p>
                      </CardBody>
                    </Card>
                  )}

                  <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                    <CardBody>
                      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">Messages Sent</h3>
                      <p className="text-black dark:text-white">{messagesSent} / {messagesLimit || '—'}</p>
                      <Progress
                        value={Math.min((messagesSent / (messagesLimit || 1)) * 100, 100)}
                        color="secondary"
                        className="mt-2"
                      />
                    </CardBody>
                  </Card>

                  <Card className="border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-dark-7/70">
                    <CardBody>
                      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">AI Chats Used</h3>
                      <p className="text-black dark:text-white">{chatsUsed} / {chatsLimit || '—'}</p>
                      <Progress
                        value={Math.min((chatsUsed / (chatsLimit || 1)) * 100, 100)}
                        color="secondary"
                        className="mt-2"
                      />
                    </CardBody>
                  </Card>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
};

export default SubscriptionPage;
