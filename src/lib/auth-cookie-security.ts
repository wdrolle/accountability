/** NextAuth cookies stay under /accountability so they do not collide with Trading/Scripture. */

export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/** Safe for Edge middleware — do not import Prisma from files that use this. */
export function isDevAutoLoginEnabled(requestUrl: string, headers?: Headers): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.DEV_AUTO_LOGIN === "false") return false;

  const host = (headers?.get("x-forwarded-host") || headers?.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (host.includes("amorolle.com")) return false;

  try {
    const url = new URL(requestUrl);
    if (url.hostname.includes("amorolle.com")) return false;
    if (isLocalDevHost(url.hostname)) return true;
  } catch {
    // ignore invalid URLs
  }

  if (host && isLocalDevHost(host.split(":")[0])) return true;
  return process.env.NODE_ENV === "development";
}

export function authCookiePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || "/accountability";
}

export function useSecureAuthCookies(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.NEXTAUTH_INSECURE_COOKIES === "true") return false;
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
  if (nextAuthUrl.startsWith("http://")) return false;
  if (nextAuthUrl.startsWith("https://")) return true;
  return true;
}

export function authSessionCookieName() {
  return useSecureAuthCookies()
    ? "__Secure-accountability.session-token"
    : "accountability.session-token";
}

export function authCookieOptions() {
  const secure = useSecureAuthCookies();
  return {
    sessionToken: {
      name: authSessionCookieName(),
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: authCookiePath(),
        secure,
      },
    },
  };
}

export function authApiBasePath() {
  return `${authCookiePath()}/api/auth`;
}
