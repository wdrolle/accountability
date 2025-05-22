'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmail() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!token) {
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token, mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/[0.05] rounded-lg">
        {status === 'loading' && (
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Verifying your email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Email Verified!</h2>
            <p className="mb-4">Your email has been successfully verified.</p>
            <Link 
              href="/auth/login"
              className="hero-button-gradient inline-block px-6 py-2 rounded-lg"
            >
              Log In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Verification Failed</h2>
            <p className="mb-4">Sorry, we couldn't verify your email. The link may be expired or invalid.</p>
            <Link 
              href="/auth/signup"
              className="hero-button-gradient inline-block px-6 py-2 rounded-lg"
            >
              Back to Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 