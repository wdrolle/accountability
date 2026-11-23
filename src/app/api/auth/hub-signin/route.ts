import { NextResponse } from "next/server";
import {
  buildSignedInRedirect,
  isDevAutoLoginEnabled,
  publicAppOrigin,
  readHubAccessTokenFromCookie,
  resolveAccountabilityUserFromHub,
  resolveDevAutoLoginUser,
} from "@/lib/hub-sso";

export const dynamic = "force-dynamic";

function safeNext(value: string | null) {
  if (!value) return "/journal";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/journal";
  }
  return value.replace(/^\/date-accountability(?=\/|$)/, "/journal");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/accountability";
  const home = `${basePath}/journal`;

  try {
    const queryToken = url.searchParams.get("access_token") || "";
    const cookieToken = readHubAccessTokenFromCookie(request.headers.get("cookie") || "");
    const accessToken = queryToken || cookieToken;

    if (accessToken) {
      const user = await resolveAccountabilityUserFromHub(accessToken);
      if (user) {
        return buildSignedInRedirect({ user, request, next });
      }
    }

    if (isDevAutoLoginEnabled(request.url, request.headers)) {
      const devUser = await resolveDevAutoLoginUser();
      if (devUser) {
        return buildSignedInRedirect({ user: devUser, request, next });
      }
    }

    const login = new URL("https://amorolle.com/login");
    const origin = publicAppOrigin(request.url, request.headers);
    const returnTo = `${origin}${basePath}/api/auth/hub-signin?next=${encodeURIComponent(next)}`;
    login.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(login);
  } catch (error) {
    console.error("hub-signin failed:", error);
    return NextResponse.redirect(new URL(home, publicAppOrigin(request.url, request.headers)));
  }
}
