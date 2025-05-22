"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || null;

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'EmailCreateAccount':
        return 'There was a problem creating your account. Please try again.';
      case 'Verification':
        return 'The verification link is invalid or has expired. Please try loging in again.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Back to Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 