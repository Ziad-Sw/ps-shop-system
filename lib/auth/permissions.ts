import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffPermissions } from "@/types/database";

export type StaffPermissionKey = keyof StaffPermissions;

export class PermissionError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "PermissionError";
  }
}

export async function getUserIdFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  const session = await verifySessionCookieValue(cookie);
  if (!session) return null;
  return session.user_id;
}

export async function assertPermission(
  userId: string,
  permission: StaffPermissionKey
): Promise<void> {
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("role, permissions")
    .eq("id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !user) {
    throw new PermissionError("Unauthorized", 401);
  }

  if (user.role === "owner") return;

  if (user.role === "staff") {
    const perms = user.permissions as StaffPermissions;
    if (!perms[permission]) {
      throw new PermissionError("ليس لديك صلاحية لهذا الإجراء", 403);
    }
    return;
  }

  throw new PermissionError("Unauthorized", 401);
}

export async function getUserPermissions(
  userId: string
): Promise<{ role: string; permissions: StaffPermissions } | null> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("role, permissions")
    .eq("id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!user) return null;

  return {
    role: user.role,
    permissions: user.permissions as StaffPermissions,
  };
}
