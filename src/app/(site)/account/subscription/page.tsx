// /account/subscription

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/Breadcrumb';
import { Card, Progress, Button, Badge } from '@heroui/react';
import Link from 'next/link';

enum subscription_status_enum {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL'
}

enum user_plan_enum {
  STARTER = 'STARTER',
  PREMIUM = 'PREMIUM',
  FAMILY = 'FAMILY'
}

interface SubscriptionInfo {
  status: subscription_status_enum;
  plan: string;
  subscription_plan?: string;
  start_date: string;
  end_date: string;
  usage: {
    messages_sent: number;
    messages_limit: number;
    ai_chats_used: number;
    ai_chats_limit: number;
    family_members: number;
    family_members_limit: number;
  };
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  payment_status?: string;
  trial_ends_at?: string;
  family_plan?: Array<{id: string; name: string}>;
  family_count?: number;
  congregation?: string[];
  // Activity stats
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

  useEffect(() => {
    if (session?.user?.email) {
      fetchSubscriptionInfo();
    }
  }, [session]);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      const data = await response.json();
  
      if (response.ok) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      toast.error('Failed to load subscription information');
    }
  };
  

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Please Log In to view your subscription</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Subscription Details" />
      <section className="pb-5 pt-5 md:pb-5 md:pt-5 xl:pb-5 xl:pt-5">
        <div className="container">
          <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
            style={{
              transform: 'perspective(1000px) rotateX(2deg)',
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
            }}
          >
            {subscription && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-2xl font-bold text-black dark:text-white">Subscription Details</h4>
                  <Button
                    as={Link}
                    href="/pricing"
                    color="primary"
                    variant="shadow"
                  >
                    Upgrade Plan
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Status Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Status</h3>
                    <Badge
                      color={
                        subscription.status === 'ACTIVE' ? 'success' :
                        subscription.status === 'TRIAL' ? 'warning' :
                        subscription.status === 'PAUSED' ? 'default' :
                        'danger'
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </Card>

                  {/* Plan Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Plan</h3>
                    <div className="text-black dark:text-white">
                      {subscription.plan || subscription.subscription_plan || 'Starter'}
                    </div>
                  </Card>

                  {/* Period Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Period</h3>
                    <div className="text-black dark:text-white">
                      {subscription.start_date && subscription.end_date ? 
                        `${new Date(subscription.start_date).toLocaleDateString()} - ${new Date(subscription.end_date).toLocaleDateString()}` :
                        'Not Available'}
                    </div>
                  </Card>

                  {/* Trial Ends Card */}
                  {subscription.trial_ends_at && (
                    <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                      style={{
                        transform: 'perspective(1000px) rotateX(2deg)',
                        boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <h3 className="text-xl font-bold text-black dark:text-white mb-2">Trial Ends</h3>
                      <div className="text-black dark:text-white">
                        {new Date(subscription.trial_ends_at).toLocaleDateString()}
                      </div>
                    </Card>
                  )}

                  {/* Family Members Card */}
                  {subscription.family_plan && subscription.family_plan.length > 0 && (
                    <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                      style={{
                        transform: 'perspective(1000px) rotateX(2deg)',
                        boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <h3 className="text-xl font-bold text-black dark:text-white mb-2">Family Members</h3>
                      <div className="text-black dark:text-white">
                        {subscription.family_plan.map(member => member.name).join(', ')}
                      </div>
                    </Card>
                  )}

                  {/* Messages Sent Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Messages Sent</h3>
                    <div className="text-black dark:text-white">
                      {subscription.usage.messages_sent || 0} / {subscription.usage.messages_limit || 0}
                      <Progress
                        value={Math.min(
                          ((subscription.usage.messages_sent || 0) / (subscription.usage.messages_limit || 1)) * 100,
                          100
                        )}
                        color="secondary"
                        className="mt-2"
                      />
                    </div>
                  </Card>

                  {/* AI Chats Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">AI Chats Used</h3>
                    <div className="text-black dark:text-white">
                      {subscription.usage.ai_chats_used || 0} / {subscription.usage.ai_chats_limit || 0}
                      <Progress
                        value={Math.min(
                          ((subscription.usage.ai_chats_used || 0) / (subscription.usage.ai_chats_limit || 1)) * 100,
                          100
                        )}
                        color="secondary"
                        className="mt-2"
                      />
                    </div>
                  </Card>

                  {/* Study Groups Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Study Groups</h3>
                    <div className="text-black dark:text-white space-y-1">
                      <div>Leader of: {subscription.study_groups_leader || 0} groups</div>
                      <div>Admin of: {subscription.study_groups_admin || 0} groups</div>
                      <div>Member of: {subscription.study_groups_member || 0} groups</div>
                    </div>
                  </Card>

                  {/* Discussions Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Discussions</h3>
                    <div className="text-black dark:text-white">
                      Created: {subscription.discussions_created || 0}
                    </div>
                  </Card>

                  {/* Prayers Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Prayers</h3>
                    <div className="text-black dark:text-white">
                      Created: {subscription.prayers_created || 0}<br/>
                      Replied: {subscription.prayers_replied || 0}
                    </div>
                  </Card>

                  {/* Newsletter Card */}
                  <Card className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] relative z-10"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Newsletter</h3>
                    <div className="text-black dark:text-white">
                      Status: {subscription.newsletter_subscribed ? 'Subscribed' : 'Not Subscribed'}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  );
};

export default SubscriptionPage; 