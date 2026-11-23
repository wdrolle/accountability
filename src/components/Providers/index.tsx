'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

const authBasePath = `${process.env.NEXT_PUBLIC_BASE_PATH || "/accountability"}/api/auth`;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath={authBasePath}>
      {children}
    </SessionProvider>
  );
} 