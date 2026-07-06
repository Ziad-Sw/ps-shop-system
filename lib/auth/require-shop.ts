import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/auth/session";

/**
 * Resolves the authenticated shop_id from the signed session cookie.
 * Returns null if there is no cookie, the cookie is invalid, or the
 * session has expired. Used by API routes that only need shop-scoping
 * (the shop_id is HMAC-signed inside the cookie, so it is trustworthy).
 */
export async function getShopIdFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const session = await verifySessionCookieValue(cookie);
  if (!session) return null;

  return session.shop_id;
}
