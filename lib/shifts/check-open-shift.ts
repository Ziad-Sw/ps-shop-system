import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checks whether a shop currently has any open shift.
 *
 * Used by every settings API route that must be locked while a shift is open
 * (pricing rules, component toggles, products, shifts_per_day). The shop name
 * is intentionally exempt from this lock — it does not affect financial integrity.
 *
 * Source of truth for "open": `shifts.status = 'open'` (single source, see
 * PROGRESS / TECH_INSTRUCTIONS section 8 — one source for any sensitive logic).
 */
export async function hasOpenShift(shopId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("id")
    .eq("shop_id", shopId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("hasOpenShift lookup failed", error);
    // Fail closed: if we can't determine shift state, refuse the mutation.
    return true;
  }

  return data !== null;
}
