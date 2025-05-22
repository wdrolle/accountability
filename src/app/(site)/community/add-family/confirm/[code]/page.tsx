// /src/app/(site)/community/add-family/confirm/[code]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card from '@/components/Card/Card';
import CardBody from '@/components/Card/CardBody';
import CardHeader from '@/components/Card/CardHeader';
import Button from '@/components/CustomButtons/Button';
import Breadcrumb from '@/components/Breadcrumb';

interface Invitation {
  id: string;
  status: string;
  expires_at: string;
  inviter_name: string;
  email: string;
}

interface UserDetails {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function AddFamilyConfirmPage() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (code) {
      fetchInvitation();
    }
  }, [code]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/family/invitations/${code}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch invitation');
      }
      
      const data = await response.json();
      setInvitation(data.invitation);
    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      toast.error(error.message || 'Failed to fetch invitation');
      router.push('/community/add-family');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userDetails.password !== userDetails.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (userDetails.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/family/invitations/${code}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          phone: userDetails.phone,
          password: userDetails.password
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server response was not valid JSON');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to create account');
      }

      toast.success('Account created successfully! Please Log In.');
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb pageTitle=" " />
      <div className="max-w-2xl mx-auto px-4 py-20">
        <Card className="text-center">
          <CardHeader color="primary" className="text-xl font-semibold light:text-white dark:text-white shadow-lg">
            Join Your Friends and Family on CStudios
          </CardHeader>
          <CardBody>
            {invitation ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  You have been invited to join a family plan on CStudios. As a family member, you'll get access to all premium features associated with the subscription plan that the user who invited you has.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="text-left">
                    <span className="text-gray-500 dark:text-gray-400 font-bold">Invited by:</span>
                    <p className="text-black dark:text-white font-medium pl-5">
                      {invitation.inviter_name || 'A CStudios user'}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-gray-500 dark:text-gray-400 font-bold">Your Email:</span>
                    <p className="text-black dark:text-white font-medium pl-5">
                      {invitation.email}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-gray-500 dark:text-gray-400 font-bold">Invitation expires:</span>
                    <p className="text-black dark:text-white font-medium pl-5">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAcceptInvitation} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={userDetails.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-4 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={userDetails.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-4 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={userDetails.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-4 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={userDetails.password}
                      onChange={handleInputChange}
                      required
                      minLength={8}
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-4 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={userDetails.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={8}
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-4 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 transition-colors"
                    />
                  </div>

                  <Button
                    color="primary"
                    type="submit"
                    disabled={loading}
                    fullWidth
                    className="light:text-white dark:text-white border border-gray-300 dark:border-gray-600 hover:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {loading ? 'Creating Account...' : 'Create Account & Join'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
} 