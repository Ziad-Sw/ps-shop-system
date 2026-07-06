import Link from "next/link";
import { cookies } from "next/headers";

import AuthenticatedShell from "@/components/layout/authenticated-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/auth/session";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  const session = await verifySessionCookieValue(sessionCookie);
  if (!session) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("login_id, display_name, shop_id")
    .eq("id", session.user_id)
    .limit(1)
    .maybeSingle();

  if (error || !user) {
    return null;
  }

  return user;
}

async function getShopName(shopId: string) {
  const supabase = createAdminClient();
  const { data: shop, error } = await supabase
    .from("shops")
    .select("name")
    .eq("id", shopId)
    .limit(1)
    .maybeSingle();

  if (error || !shop) {
    return "المحل";
  }

  return shop.name;
}

async function getOwnerName(shopId: string) {
  const supabase = createAdminClient();
  const { data: shop, error } = await supabase
    .from("shops")
    .select("owner_name")
    .eq("id", shopId)
    .limit(1)
    .maybeSingle();

  if (error || !shop) {
    return null;
  }

  return shop.owner_name;
}

export default async function Home() {
  const user = await getCurrentUser();
  const shopName = user ? await getShopName(user.shop_id) : "المحل";
  const ownerName = user ? await getOwnerName(user.shop_id) : null;

  const title = user
    ? `مرحبًا ${user.display_name || user.login_id}`
    : "مرحبًا بك في نظام إدارة المحل";
  const subtitle = user
    ? `تم تسجيل الدخول كـ ${user.login_id}`
    : "يجب أن تقودك هذه الصفحة بعد تسجيل دخول ناجح إلى النظام.";

  const content = (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-xl bg-surface-card p-8 shadow-none">
        <p className="text-sm text-foreground-muted">نظام إدارة المحل</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-4 text-foreground-muted">{subtitle}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {user ? null : (
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-surface-page"
            >
              الانتقال إلى تسجيل الدخول
            </Link>
          )}
          <span className="inline-flex h-11 items-center justify-center rounded-lg border border-foreground-muted/30 px-6 text-sm text-foreground-muted">
            Dark mode فقط
          </span>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return content;
  }

  return <AuthenticatedShell user={user} shopName={shopName} ownerName={ownerName}>{content}</AuthenticatedShell>;
}
