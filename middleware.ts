import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth paths
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // 2. Retrieve session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Verify session validity
  const session = await verifySessionCookieValue(sessionCookie.value);

  if (!session) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "جلسة العمل غير صالحة أو منتهية." }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    // Clear the invalid cookie
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any files with an extension (e.g. logo.png, robots.txt)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
