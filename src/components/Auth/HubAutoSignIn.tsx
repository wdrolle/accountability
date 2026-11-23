"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const PROTECTED_PREFIXES = [
  "/admin-console",
  "/account",
  "/community/discussions/create",
  "/community/prayers/create",
  "/community/groups/create",
];

function needsAutoSignIn(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * If Accountability has no NextAuth session on a protected page, bounce
 * through Amorolle hub sign-in. Public pages stay readable.
 */
export default function HubAutoSignIn() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const attempted = useRef(false);

  useEffect(() => {
    if (status === "loading" || attempted.current || session?.user?.email) return;
    if (new URLSearchParams(window.location.search).get("hub") === "1") return;

    const host = window.location.hostname;
    const isLocalDev =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local");
    if (!isLocalDev && !needsAutoSignIn(pathname || "/")) return;

    attempted.current = true;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const next = pathname && pathname !== "/" ? pathname : "/journal";
    window.location.replace(
      `${basePath}/api/auth/hub-signin?next=${encodeURIComponent(next)}`,
    );
  }, [pathname, session, status]);

  return null;
}
