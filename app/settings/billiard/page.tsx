import { cookies } from "next/headers";

import AuthenticatedShell from "@/components/layout/authenticated-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import BilliardSettingsForm from "@/components/settings/billiard-settings-form";
import type { PricingRule } from "@/types";

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
    .select("id, name, billiard_enabled")
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

async function getPricingRules(shopId: string) {
  const supabase = createAdminClient();
  const { data: rules, error } = await supabase
    .from("pricing_rules")
    .select("id, station_type, mode, unit, rate")
    .eq("shop_id", shopId)
    .eq("station_type", "billiard");

  if (error) {
    return [];
  }

  return (rules as PricingRule[]) || [];
}

export default async function BilliardSettingsPage() {
  const user = await getCurrentUser();
  const shopData = user ? await getShopData(user.shop_id) : null;
  const shopName = user ? await getShopName(user.shop_id) : "المحل";
  const pricingRules = user ? await getPricingRules(user.shop_id) : [];

  if (!user || !shopData) {
    return <div>Error loading settings</div>;
  }

  return (
    <AuthenticatedShell user={user} shopName={shopName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">إعدادات البلياردو</h1>
          <p className="mt-2 text-foreground-muted">إدارة طاولات البلياردو وتسعيرها</p>
        </div>

        <BilliardSettingsForm
          initialBilliardEnabled={shopData.billiard_enabled}
          initialPricingRules={pricingRules}
        />
      </div>
    </AuthenticatedShell>
  );
}
