"use client";
import { SessionProvider } from "next-auth/react";

const authBasePath = `${process.env.NEXT_PUBLIC_BASE_PATH || "/accountability"}/api/auth`;

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider basePath={authBasePath}>{children}</SessionProvider>;
}
