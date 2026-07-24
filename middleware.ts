import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";
import { verifyUserActive } from "@/lib/auth/verify-active";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  function addNoCacheHeaders(response: NextResponse): NextResponse {
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // Apply no-cache to all responses including static assets
  if (pathname.startsWith("/_next/static")) {
    return addNoCacheHeaders(NextResponse.next());
  }

  // Allow public auth paths
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/cron/")
  ) {
    return addNoCacheHeaders(NextResponse.next());
  }

  // Retrieve session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify session signature and expiry
  const session = await verifySessionCookieValue(sessionCookie.value);

  if (!session) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "جلسة العمل غير صالحة أو منتهية." }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Verify user still exists and is active in the database
  const activeUser = await verifyUserActive(session.user_id);

  if (!activeUser) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "تم تعطيل حسابك. الرجاء التواصل مع صاحب المحل." }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return addNoCacheHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths — middleware handles static vs dynamic internally
     */
    "/((?!_next/image|favicon.ico).*)",
  ],
};
