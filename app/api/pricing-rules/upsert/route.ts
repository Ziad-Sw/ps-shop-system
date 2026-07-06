import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getShopIdFromRequest } from "@/lib/auth/require-shop";
import { hasOpenShift } from "@/lib/shifts/check-open-shift";
import type { StationType, PricingMode, PricingUnit } from "@/types";

/**
 * Upserts a single pricing rule (one station_type + mode combination).
 *
 * Body: { station_type: 'playstation' | 'billiard', mode: 'single' | 'multi', rate: number }
 *
 * The `unit` is derived from station_type (hour for playstation, game for billiard)
 * and never comes from the client — there is one source for that mapping.
 *
 * Locked while a shift is open.
 */
export async function POST(request: NextRequest) {
  try {
    const shopId = await getShopIdFromRequest();
    if (!shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { station_type, mode, rate } = body ?? {};

    // 1. Validate station_type
    if (
      station_type !== "playstation" &&
      station_type !== "billiard"
    ) {
      return NextResponse.json(
        { error: "نوع الجهاز غير صالح." },
        { status: 400 }
      );
    }

    // 2. Validate mode
    if (mode !== "single" && mode !== "multi") {
      return NextResponse.json(
        { error: "نوع اللعب (فردي/مالتي) غير صالح." },
        { status: 400 }
      );
    }

    // 3. Validate rate (server-side, mirrors DB CHECK (rate >= 0))
    if (
      typeof rate !== "number" ||
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      return NextResponse.json(
        { error: "السعر يجب أن يكون رقمًا موجبًا." },
        { status: 400 }
      );
    }

    // 4. Shift-lock
    if (await hasOpenShift(shopId)) {
      return NextResponse.json(
        {
          error:
            "لا يمكن تعديل الأسعار أثناء وجود وردية مفتوحة. أغلق الوردية أولًا.",
        },
        { status: 409 }
      );
    }

    // 5. Derive unit from station_type (single source for this mapping)
    const unit: PricingUnit =
      station_type === "playstation" ? "hour" : "game";

    // 6. Upsert — relies on UNIQUE (shop_id, station_type, mode)
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pricing_rules")
      .upsert(
        {
          shop_id: shopId,
          station_type: station_type as StationType,
          mode: mode as PricingMode,
          unit,
          rate,
        },
        { onConflict: "shop_id,station_type,mode" }
      )
      .select("id, station_type, mode, unit, rate")
      .maybeSingle();

    if (error || !data) {
      console.error("pricing_rules upsert failed:", error);
      return NextResponse.json(
        { error: "Failed to save pricing rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, pricingRule: data });
  } catch (err) {
    console.error("Error upserting pricing rule:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
