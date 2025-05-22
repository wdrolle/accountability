import Link from 'next/link'
import React from 'react'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 p-6 text-center light:bg-white dark:bg-dark dark:border-gray-700">
        <h1 className="mb-4 text-2xl font-bold">Membership Required</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Please sign in or create an account to access this content.
        </p>
        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="block w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
          >
            Create Account
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Please refresh the page after signing in.
        </p>
      </div>
    </div>
  )
} 