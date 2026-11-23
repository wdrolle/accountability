import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import {
  authCookiePath,
  authSessionCookieName,
  isDevAutoLoginEnabled,
  isLocalDevHost,
  useSecureAuthCookies,
} from "./auth-cookie-security";

export { isDevAutoLoginEnabled, isLocalDevHost };

async function getPrisma() {
  const { default: prisma } = await import("./prisma");
  return prisma;
}

const HUB_SUPABASE_URL =
  process.env.NEXT_PUBLIC_HUB_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fbsnszkmtillujdcwnnq.supabase.co";
const HUB_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_yeTRa3En8TmwnICQKV9Ung_pKaszZCk";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HUB_OWNER_EMAIL = "w.d.rolle@gmail.com";
const HUB_ADMIN_EMAILS = new Set([
  "w.d.rolle@gmail.com",
  "whitney@iolence.com",
]);

export type HubIdentity = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

export type AccountabilityHubUser = {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  is_super_admin: boolean;
};

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export async function resolveDevAutoLoginUser(): Promise<AccountabilityHubUser | null> {
  const email = (process.env.DEV_AUTO_LOGIN_EMAIL || "whitney@iolence.com").trim().toLowerCase();
  if (!email) return null;

  try {
    return await ensureAccountabilityUser({
      id: "",
      email,
      first_name: "Whitney",
      last_name: null,
    });
  } catch (error) {
    console.error("resolveDevAutoLoginUser:", error);
    return {
      id: crypto.randomUUID(),
      email,
      name: "Whitney",
      role: "ADMIN",
      is_super_admin: true,
    };
  }
}

export function namesFromUserMeta(meta: unknown, fallbackName?: string | null) {
  const data = (meta && typeof meta === "object" ? meta : {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };
  let first = pick("first_name", "given_name", "givenName");
  let last = pick("last_name", "family_name", "familyName");
  const full = pick("full_name", "name", "display_name") || (fallbackName || "").trim();
  if ((!first || !last) && full) {
    const parts = full.split(/\s+/).filter(Boolean);
    first = first || parts[0] || "";
    last = last || parts.slice(1).join(" ");
  }
  return {
    first_name: first || null,
    last_name: last || null,
  };
}

export function publicAppOrigin(requestUrl?: string, headers?: Headers): string {
  const forwardedHost = headers?.get("x-forwarded-host") || headers?.get("host") || "";
  let requestProto = "";
  try {
    if (requestUrl) requestProto = new URL(requestUrl).protocol.replace(":", "");
  } catch {
    // ignore
  }
  const forwardedProto = (headers?.get("x-forwarded-proto") || requestProto || "https")
    .split(",")[0]
    .trim();
  const host = forwardedHost.split(",")[0].trim();

  if (host && (host.includes("localhost") || host.startsWith("127.0.0.1"))) {
    return `${requestProto || "http"}://${host}`;
  }
  if (host && !host.includes("localhost") && host !== "127.0.0.1") {
    return `${forwardedProto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "https://amorolle.com";
}

export async function verifyHubAccessToken(
  accessToken: string,
): Promise<HubIdentity | null> {
  if (!accessToken) return null;
  try {
    const response = await fetch(`${HUB_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: HUB_SUPABASE_ANON_KEY,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as {
      id?: string;
      email?: string;
      user_metadata?: unknown;
    };
    if (!user?.email) return null;
    const names = namesFromUserMeta(user.user_metadata);
    return {
      id: user.id || "",
      email: user.email.toLowerCase(),
      first_name: names.first_name,
      last_name: names.last_name,
    };
  } catch {
    return null;
  }
}

function readNamedCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const chunks: { index: number; value: string }[] = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq);
    const value = decodeURIComponent(part.slice(eq + 1));
    if (key === name) chunks.push({ index: 0, value });
    else if (key.startsWith(`${name}.`)) {
      const index = Number(key.slice(name.length + 1));
      if (!Number.isNaN(index)) chunks.push({ index, value });
    }
  }
  if (!chunks.length) return "";
  chunks.sort((a, b) => a.index - b.index);
  return chunks.map((chunk) => chunk.value).join("");
}

export function readHubAccessTokenFromCookie(cookieHeader: string) {
  const named = readNamedCookie(cookieHeader, "amorolle_hub_at");
  if (named) return named;

  const projectRef = new URL(HUB_SUPABASE_URL).hostname.split(".")[0];
  const prefix = `sb-${projectRef}-auth-token`;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const chunks: { index: number; value: string }[] = [];

  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq);
    const value = decodeURIComponent(part.slice(eq + 1));
    if (name === prefix) {
      chunks.push({ index: 0, value });
    } else if (name.startsWith(`${prefix}.`)) {
      const index = Number(name.slice(prefix.length + 1));
      if (!Number.isNaN(index)) chunks.push({ index, value });
    }
  }

  if (!chunks.length) return "";
  chunks.sort((a, b) => a.index - b.index);
  let raw = chunks.map((chunk) => chunk.value).join("");
  if (raw.startsWith("base64-")) {
    try {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf8");
    } catch {
      return "";
    }
  }
  try {
    const parsed = JSON.parse(raw) as
      | { access_token?: string }
      | Array<{ access_token?: string }>;
    if (Array.isArray(parsed)) return parsed[0]?.access_token || "";
    return parsed.access_token || "";
  } catch {
    return "";
  }
}

export async function ensureAccountabilityUser(hubUser: HubIdentity): Promise<AccountabilityHubUser> {
  const email = hubUser.email.toLowerCase();
  const isAdmin = HUB_ADMIN_EMAILS.has(email) || email === HUB_OWNER_EMAIL;
  const prisma = await getPrisma();

  let authId = "";
  try {
    const authUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true, is_super_admin: true, role: true },
    });
    authId = authUser?.id || "";
  } catch (error) {
    console.error("ensureAccountabilityUser auth lookup:", error);
  }

  // accountability.user.id FK → auth.users(id). Never invent a new id.
  const id = authId || (isUuid(hubUser.id) ? hubUser.id : "");
  const firstName = hubUser.first_name;
  const lastName = hubUser.last_name;
  const role = isAdmin ? "ADMIN" : "USER";

  if (!id) {
    return {
      id: crypto.randomUUID(),
      email,
      name: `${firstName || ""} ${lastName || ""}`.trim() || email,
      role,
      is_super_admin: isAdmin,
    };
  }

  try {
    const rows = await prisma.$queryRaw<
      { id: string; email: string; role: string | null }[]
    >`
      INSERT INTO accountability."user" (
        id, email, first_name, last_name, role, subscription_status
      )
      VALUES (
        ${id}::uuid,
        ${email},
        ${firstName},
        ${lastName},
        ${role}::accountability.user_role_enum,
        'TRIAL'::accountability.subscription_status_enum
      )
      ON CONFLICT (email) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, accountability."user".first_name),
        last_name = COALESCE(EXCLUDED.last_name, accountability."user".last_name),
        role = CASE
          WHEN ${isAdmin} THEN 'ADMIN'::accountability.user_role_enum
          ELSE accountability."user".role
        END,
        updated_at = now()
      RETURNING id, email, role::text AS role
    `;

    const row = rows[0];
    await prisma.$executeRaw`
      INSERT INTO accountability.user_preferences (user_id)
      VALUES (${row?.id || id}::uuid)
      ON CONFLICT (user_id) DO NOTHING
    `;

    return {
      id: row?.id || id,
      email,
      name: `${firstName || ""} ${lastName || ""}`.trim() || email,
      role: row?.role || role,
      is_super_admin: isAdmin,
    };
  } catch (error) {
    console.error("ensureAccountabilityUser upsert:", error);
    return {
      id,
      email,
      name: `${firstName || ""} ${lastName || ""}`.trim() || email,
      role,
      is_super_admin: isAdmin,
    };
  }
}

export async function resolveAccountabilityUserFromHub(
  accessToken: string,
): Promise<AccountabilityHubUser | null> {
  const hubUser = await verifyHubAccessToken(accessToken);
  if (!hubUser?.email) return null;
  return ensureAccountabilityUser(hubUser);
}

export async function buildSignedInRedirect(options: {
  user: AccountabilityHubUser;
  request: Request;
  next: string;
}): Promise<NextResponse> {
  const { user, request, next } = options;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/accountability";
  const secret = process.env.NEXTAUTH_SECRET;
  const origin = publicAppOrigin(request.url, request.headers);
  const home = `${basePath}/`;

  if (!secret) {
    return NextResponse.redirect(new URL(home, origin));
  }

  const token = await encode({
    token: {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_super_admin: user.is_super_admin,
    },
    secret,
    maxAge: 30 * 24 * 60 * 60,
  });

  const destinationPath =
    !next || next.startsWith("/tinymce") || next.includes(".")
      ? "/journal"
      : next.replace(/^\/date-accountability(?=\/|$)/, "/journal");
  const destination = new URL(
    `${basePath}${destinationPath === "/" ? "/journal" : destinationPath}`,
    origin,
  );
  destination.searchParams.set("hub", "1");

  const response = NextResponse.redirect(destination);
  const secure = useSecureAuthCookies() || origin.startsWith("https:");
  response.cookies.set(authSessionCookieName(), token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: authCookiePath() || basePath,
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
