// /src/app/(site)/community/add-family/page.tsx

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Card from '@/components/Card/Card';
import CardBody from '@/components/Card/CardBody';
import CardHeader from '@/components/Card/CardHeader';
import Button from '@/components/CustomButtons/Button';
import Breadcrumb from '@/components/Breadcrumb';

export default function AddFamilyPage() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    if (emails.length < 5) {
      setEmails([...emails, '']);
    } else {
      toast.error('Maximum 5 family members allowed');
    }
  };

  const removeEmailField = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.email || !session?.user?.id) {
      toast.error('Please Log In to invite family members');
      return;
    }

    const validEmails = emails.filter(email => email.trim() !== '');
    if (validEmails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(
        validEmails.map(async (email) => {
          const response = await fetch('/api/family/invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              inviterId: session.user.id,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send invitation');
          }

          const data = await response.json();
          return { email, success: true, message: data.message };
        })
      );

      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        toast.success(`Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}`);
        setEmails(['']);
      }
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      toast.error(error.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Please Log In to invite family members</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle=" " />
      <div className="max-w-2xl mx-auto px-4 py-20">
        <Card className="text-center">
          <CardHeader color="primary" className="text-xl font-semibold light:text-white dark:text-white shadow-lg">
            Add Family Members
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Invite your family members to join your subscription. They will have access to all premium features as long as your subscription remains active.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <label htmlFor={`email-${index}`} className="block text-black dark:text-white mb-2">
                      Email Address {index + 1}
                    </label>
                    <input
                      type="email"
                      id={`email-${index}`}
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="Enter family member's email"
                      required
                      className="w-full rounded-lg border-2 text-center border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-4 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 transition-colors"
                    />
                  </div>
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="mt-8 p-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200 hover:shadow-lg shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <div className="flex justify-center mt-4">
                {emails.length < 5 && (
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="w-full py-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg rounded-lg bg-white dark:bg-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Another Email
                  </button>
                )}
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  color="primary"
                  type="submit"
                  disabled={loading}
                  fullWidth
                  className="light:text-white dark:text-white border border-gray-300 dark:border-gray-600 hover:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? 'Sending Invitations...' : 'Send Invitations'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
} 