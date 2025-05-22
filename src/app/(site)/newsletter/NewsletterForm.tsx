// src/app/(site)/newsletter/NewsletterForm.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast, Toast } from 'react-hot-toast';
import {
  Card as MTCard,
  CardBody as MTCardBody,
  CardHeader as MTCardHeader,
  Typography as MTTypography,
} from '@material-tailwind/react';
import ReactMarkdown from 'react-markdown';
import Button from '@/components/CustomButtons/Button';
import { MESSAGE_THEMES, MessageTheme } from '@/types/messageTypes';

// Type assertions for Material Tailwind components
const Card = MTCard as React.ComponentType<any>;
const CardBody = MTCardBody as React.ComponentType<any>;
const CardHeader = MTCardHeader as React.ComponentType<any>;
const Typography = MTTypography as React.ComponentType<any>;

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
  plan: user_plan_enum;
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
  family_plan?: Array<{ id: string; name: string }>;
  family_count?: number;
  congregation?: string[];
  subscription_plan?: string;
  newsletter_subscribed?: boolean;
  newsletter_subscribed_at?: string | null;
}

const CustomToast = ({ message }: { message: string }) => (
  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
    <div className="bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 px-6 py-4 rounded-lg shadow-lg border border-green-200 dark:border-green-700">
      <div className="flex items-center space-x-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <p className="font-medium">{message}</p>
      </div>
      <div className="mt-2 w-full bg-green-200 dark:bg-green-700 rounded-full h-1">
        <div
          className="bg-green-600 dark:bg-green-300 h-1 rounded-full transition-all duration-5000 ease-linear"
          style={{ width: '100%', animation: 'shrink 5s linear forwards' }}
        />
      </div>
    </div>
  </div>
);

const INITIAL_PRAYER = {
  text: "> Afterward he appeared unto the eleven as they sat at meat, and upbraided them with their unbelief and hardness of heart, because they believed not them which had seen him after he was risen. And he said unto them, Go ye into all the world, and preach the gospel to every creature.",
  source: "*Mark 16:14-15 (King James Version)*"
};

export default function NewsletterForm() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState(INITIAL_PRAYER);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>(MESSAGE_THEMES[0].name);
  const isGenerating = useRef(false);

  // Typing animation effect
  useEffect(() => {
    if (isTyping && currentPrayer.text) {
      let index = 0;
      setDisplayedText('');
      
      typingInterval.current = setInterval(() => {
        if (index < currentPrayer.text.length) {
          setDisplayedText(prev => prev + currentPrayer.text[index]);
          index++;
        } else {
          setIsTyping(false);
          if (typingInterval.current) {
            clearInterval(typingInterval.current);
          }
        }
      }, 30); // Adjust typing speed here
    }
    
    return () => {
      if (typingInterval.current) {
        clearInterval(typingInterval.current);
      }
    };
  }, [isTyping, currentPrayer]);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      const data = await response.json();

      if (response.ok) {
        const sub = data.subscription;
        const subscriptionData: SubscriptionInfo = {
          status: sub.status || subscription_status_enum.TRIAL,
          plan: sub.subscription_plan || user_plan_enum.STARTER,
          start_date: sub.start_date || new Date().toISOString(),
          end_date: sub.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            messages_sent: sub.usage?.messages_sent || 0,
            messages_limit: sub.usage?.messages_limit || 0,
            ai_chats_used: sub.usage?.ai_chats_used || 0,
            ai_chats_limit: sub.usage?.ai_chats_limit || 0,
            family_members: sub.usage?.family_members || 0,
            family_members_limit: sub.usage?.family_members_limit || 0
          },
          stripe_customer_id: sub.stripe_customer_id,
          stripe_subscription_id: sub.stripe_subscription_id,
          payment_status: sub.payment_status,
          trial_ends_at: sub.trial_ends_at,
          family_plan: sub.family_members || [],
          family_count: sub.family_members?.length || 0,
          congregation: sub.congregation || [],
          subscription_plan: sub.subscription_plan,
          newsletter_subscribed: sub.newsletter_subscribed || false,
          newsletter_subscribed_at: sub.newsletter_subscribed_at || null
        };
        setSubscription(subscriptionData);
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      toast.error('Failed to load subscription information');
    }
  };

  // Fetch new prayer and correct it with debouncing
  const fetchAndCorrectPrayer = async () => {
    if (isGenerating.current) return;
    
    try {
      isGenerating.current = true;
      const response = await fetch('/api/prayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Create an inspiring quote about ${currentTheme.toLowerCase()} from a biblical perspective. The quote should be concise, impactful, and include a relevant agents verse that supports this theme. Format the response with:
1. The quote starting with ">"
2. Each paragraph starting with ">"
3. A relevant agents verse properly cited with book, chapter, verse, and version in italics using markdown (*)
4. Ensure the quote reflects the theme: ${currentTheme}`,
          maxWords: 150,
          theme: currentTheme,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let formattedText = data.message;
        
        // Update theme from response
        if (data.theme) {
          setCurrentTheme(data.theme);
        }
        
        // Additional safeguards
        formattedText = formattedText
          .replace(/\*?undefined\*?/g, '') // Remove undefined with potential asterisks
          .replace(/undefined/g, '') // Remove any remaining undefined
          .replace(/\s*undefined\s*/gi, '') // Remove undefined with spaces
          .replace(/\*With faith and love.*$/gm, '') // Remove any trailing signature
          .replace(/--undefined/g, '--Zoe') // Replace --undefined with --Zoe
          .replace(/\*$/, '') // Remove trailing asterisk if any
          .trim();

        // Split into quote and source if source exists
        const parts = formattedText.split('\n\n'); // Split on double newline
        const text = parts[0]?.replace(/^\*|\*$/g, '*') || ''; // Ensure single asterisk at start/end
        const source = parts.length > 1 ? parts[parts.length - 1] : '--Zoe';

        setCurrentPrayer({ text, source });
        setIsTyping(true);
      }
    } catch (error) {
      console.error('Error in quote generation:', error);
      setCurrentPrayer(INITIAL_PRAYER);
      setIsTyping(true);
    } finally {
      isGenerating.current = false;
    }
  };

  // Update quote every 30 seconds with debouncing
  useEffect(() => {
    let isSubscribed = true;
    let lastFetchTime = 0;
    const FETCH_INTERVAL = 30000; // 30 seconds

    const updateQuote = async () => {
      const now = Date.now();
      if (!isSubscribed || isGenerating.current || now - lastFetchTime < FETCH_INTERVAL) return;
      
      lastFetchTime = now;
      await fetchAndCorrectPrayer();
    };

    // Initial fetch only if we don't have content
    if (currentPrayer === INITIAL_PRAYER) {
      updateQuote();
    }
    
    updateInterval.current = setInterval(updateQuote, FETCH_INTERVAL);
    
    return () => {
      isSubscribed = false;
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [currentTheme]);

  // Fetch subscription info only once when session changes
  useEffect(() => {
    let isSubscribed = true;

    const getSubscription = async () => {
      if (!session?.user?.email || subscription) return;
      
      try {
        const response = await fetch('/api/user/subscription');
        if (!isSubscribed) return;
        
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
          if (session.user.email) {
            setEmail(session.user.email);
          }
        }
      } catch (error) {
        console.error('Error fetching subscription info:', error);
      }
    };

    getSubscription();

    return () => {
      isSubscribed = false;
    };
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.custom(
          (t: Toast) => (
            <CustomToast
              message={
                subscription?.newsletter_subscribed
                  ? 'Welcome back! Your newsletter subscription has been updated.'
                  : 'Thank you for subscribing to our newsletter!'
              }
            />
          ),
          {
            duration: 5000,
            position: 'top-center',
          }
        );
        await fetchSubscriptionInfo();
      } else {
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to subscribe to newsletter');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      <div className="flex min-h-[calc(50vh-50px)] flex-col items-center justify-center p-4 pt-10">
        <div className="w-[50%] mx-auto space-y-8 pt-10">
          {/* Quote Card */}
          <Card className="w-full light:bg-transparent dark:bg-transparent shadow-lg">
            <CardHeader
              color="green"
              className="relative h-12 flex items-center justify-center w-full bg-gradient-to-r from-green-400/90 to-green-600/90 dark:from-green-600/90 dark:to-green-800/90 backdrop-blur-sm"
              floated={true}
              shadow={true}
            >
              <h3 className="text-white text-lg font-medium">{currentTheme}</h3>
            </CardHeader>
            <CardBody className="p-6 bg-[url(/images/cta/grid.svg)] dark:bg-[url(/images/cta/grid.svg)]">
              <div className="min-h-[50px] pt-5 p-5 flex flex-col justify-between">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {displayedText || currentPrayer.text}
                  </ReactMarkdown>
                </div>
                <div className="prose dark:prose-invert max-w-none mt-4">
                  <ReactMarkdown>
                    {currentPrayer.source}
                  </ReactMarkdown>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Subscription Form Card */}
          <div className="max-w-md mx-auto w-full">
            <Card className="w-full bg-transparent dark:bg-transparent shadow-lg">
              <CardHeader
                color="indigo"
                className="relative h-12 flex items-center justify-center w-full bg-gradient-to-r from-indigo-400/90 to-purple-600/90 dark:from-indigo-600/90 dark:to-purple-800/90 backdrop-blur-sm"
                floated={false}
                shadow={false}
              >
                <h3 className="text-white text-lg font-medium light:text-white dark:text-white">Subscribe to our Newsletter</h3>
              </CardHeader>
              <CardBody className="p-6 bg-[url(/images/cta/grid.svg)] dark:bg-[url(/images/cta/grid.svg)]">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="rounded-md">
                    <input
                      type="email"
                      required
                      className="block w-full rounded-lg border-1 light:border-gray-200 dark:border-gray-700 bg-transparent dark:bg-transparent py-2 px-4 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 transition-colors"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Button
                      type="submit"
                      color="primary"
                      disabled={isLoading}
                      className="w-full light:text-white dark:text-white"
                    >
                      {isLoading ? 'Subscribing...' : subscription?.newsletter_subscribed ? 'Update Subscription' : 'Subscribe'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
