import { cookies } from "next/headers";

import AuthenticatedShell from "@/components/layout/authenticated-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import SettingsForm from "@/components/settings/settings-form";

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

async function getShopData(shopId: string) {
  const supabase = createAdminClient();
  const { data: shop, error } = await supabase
    .from("shops")
    .select("id, name, ps_enabled, billiard_enabled, shifts_per_day")
    .eq("id", shopId)
    .limit(1)
    .maybeSingle();

  if (error || !shop) {
    return null;
  }

  return shop;
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

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const shopData = user ? await getShopData(user.shop_id) : null;
  const shopName = user ? await getShopName(user.shop_id) : "المحل";

  if (!user) {
    return <div>خطأ: لم يتم العثور على المستخدم. يرجى تسجيل الدخول.</div>;
  }

  if (!shopData) {
    return <div>خطأ: لم يتم العثور على بيانات المحل. يرجى التواصل مع الدعم.</div>;
  }

  return (
    <AuthenticatedShell user={user} shopName={shopName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">الإعدادات</h1>
          <p className="mt-2 text-foreground-muted">إدارة إعدادات المحل</p>
        </div>

        <SettingsForm initialShopData={shopData} />
      </div>
    </AuthenticatedShell>
  );
}
