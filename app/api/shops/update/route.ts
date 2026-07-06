import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import { hasOpenShift } from "@/lib/shifts/check-open-shift";

/**
 * Partial update for the authenticated user's shop.
 *
 * Accepted fields (all optional):
 *   - name             (always allowed — exempt from shift lock)
 *   - owner_name       (always allowed — exempt from shift lock)
 *   - ps_enabled       (locked while a shift is open)
 *   - billiard_enabled (locked while a shift is open)
 *   - shifts_per_day   (locked while a shift is open; validated 1..3 here AND in DB)
 *
 * Only fields present in the body are applied. Unknown fields are ignored.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySessionCookieValue(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const {
      name,
      owner_name,
      ps_enabled,
      billiard_enabled,
      shifts_per_day,
    } = body ?? {};

    // 3. Build update payload — only known, type-valid fields are applied.
    const update: Partial<{ name: string; owner_name: string | null; ps_enabled: boolean; billiard_enabled: boolean; shifts_per_day: number }> = {};

    if (typeof name === "string") {
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        return NextResponse.json(
          { error: "اسم المحل لا يمكن أن يكون فارغًا." },
          { status: 400 }
        );
      }
      update.name = trimmed;
    }

    if (typeof owner_name === "string") {
      const trimmed = owner_name.trim();
      if (trimmed.length === 0) {
        return NextResponse.json(
          { error: "اسم صاحب المحل لا يمكن أن يكون فارغًا." },
          { status: 400 }
        );
      }
      update.owner_name = trimmed;
    }

    if (typeof ps_enabled === "boolean") {
      update.ps_enabled = ps_enabled;
    }

    if (typeof billiard_enabled === "boolean") {
      update.billiard_enabled = billiard_enabled;
    }

    if (shifts_per_day !== undefined) {
      // Server-side validation — enforced here regardless of DB constraint
      // (decision: sensitive validation must come from the server, not only DB).
      if (
        typeof shifts_per_day !== "number" ||
        !Number.isInteger(shifts_per_day) ||
        shifts_per_day < 1 ||
        shifts_per_day > 4
      ) {
        return NextResponse.json(
          { error: "عدد الورديات اليومية يجب أن يكون عددًا صحيحًا بين 1 و 4." },
          { status: 400 }
        );
      }
      update.shifts_per_day = shifts_per_day;
    }

    // 4. Nothing to update?
    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "لم يتم إرسال أي حقل صالح للتحديث." },
        { status: 400 }
      );
    }

    // 5. Get user shop_id
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("shop_id")
      .eq("id", session.user_id)
      .limit(1)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const shopId = user.shop_id;

    // 6. Shift-lock check for sensitive fields.
    // `name` is exempt (financially inert); everything else is locked.
    const touchesLockedFields =
      "ps_enabled" in update ||
      "billiard_enabled" in update ||
      "shifts_per_day" in update;

    if (touchesLockedFields) {
      const blockedByOpenShift = await hasOpenShift(shopId);
      if (blockedByOpenShift) {
        return NextResponse.json(
          {
            error:
              "لا يمكن تعديل هذه الإعدادات أثناء وجود وردية مفتوحة. يمكنك التعديل فقط بين الورديات أو عندما لا تكون هناك وردية شغالة.",
          },
          { status: 409 }
        );
      }
    }

    // 7. Apply update
    const { data: updatedShop, error: updateError } = await supabase
      .from("shops")
      .update(update)
      .eq("id", shopId)
      .select("id, name, owner_name, ps_enabled, billiard_enabled, shifts_per_day")
      .maybeSingle();

    if (updateError || !updatedShop) {
      console.error("Failed to update shop:", updateError);
      return NextResponse.json(
        { error: "Failed to update shop" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      shop: updatedShop,
    });
  } catch (err) {
    console.error("Error updating shop:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
