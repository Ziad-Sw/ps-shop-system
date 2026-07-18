import { createAdminClient } from "@/lib/supabase/admin";

export interface ActiveUserInfo {
  id: string;
  shop_id: string;
  role: "owner" | "staff";
}

export async function verifyUserActive(
  userId: string
): Promise<ActiveUserInfo | null> {
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, shop_id, role")
    .eq("id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!user) return null;
  return user;
}
