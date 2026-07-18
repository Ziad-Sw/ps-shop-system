import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getShopIdFromRequest } from "@/lib/auth/require-shop";
import { assertPermission, PermissionError, getUserIdFromRequest } from "@/lib/auth/permissions";
import { calculateSessionCost } from "@/lib/pricing/calculation";

/**
 * POST /api/sessions/confirm-close — confirms and closes a session (writes to DB)
 * Body: { session_id: string }
 * Called when user clicks "تأكيد القفل" in the receipt popup.
 * Pricing is resolved from billing_mode on the session.
 */
export async function POST(request: NextRequest) {
  try {
    const shopId = await getShopIdFromRequest();
    if (!shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await assertPermission(userId, "manage_sessions");

    const body = await request.json();
    const { session_id } = body ?? {};

    if (typeof session_id !== "string" || session_id.trim().length === 0) {
      return NextResponse.json(
        { error: "معرف الجلسة مطلوب." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get session with station info
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        id,
        start_time,
        mode,
        billing_mode,
        games_count,
        status,
        station_id,
        stations!inner (
          station_type
        )
      `)
      .eq("id", session_id)
      .eq("shop_id", shopId)
      .limit(1)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "الجلسة غير موجودة." },
        { status: 404 }
      );
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "الجلسة ليست نشطة." },
        { status: 409 }
      );
    }

    // Derive unit from billing_mode
    const unit = session.billing_mode === "time" ? "hour" : "game";

    // Get pricing rule for this station type, mode, and derived unit
    const { data: pricingRule, error: pricingError } = await supabase
      .from("pricing_rules")
      .select("rate, unit")
      .eq("shop_id", shopId)
      .eq("station_type", session.stations.station_type)
      .eq("mode", session.mode)
      .eq("unit", unit)
      .limit(1)
      .maybeSingle();

    if (pricingError || !pricingRule) {
      return NextResponse.json(
        { error: "قاعدة التسعير غير موجودة." },
        { status: 404 }
      );
    }

    // Get sale items for this session
    const { data: saleItems, error: itemsError } = await supabase
      .from("sale_items")
      .select("total_price")
      .eq("session_id", session_id)
      .eq("shop_id", shopId);

    if (itemsError) {
      console.error("Failed to fetch sale items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch sale items" },
        { status: 500 }
      );
    }

    // Calculate drinks cost
    const drinksCost = saleItems.reduce((sum, item) => sum + Number(item.total_price), 0);

    // Calculate session cost using the centralized function
    const costResult = calculateSessionCost({
      station_type: session.stations.station_type,
      mode: session.mode,
      unit: pricingRule.unit,
      rate: Number(pricingRule.rate),
      start_time: session.start_time,
      end_time: new Date().toISOString(),
      games_count: session.games_count,
      sale_items_total: drinksCost,
    });

    // Update session with end time, duration, and calculated cost
    const { data: updatedSession, error: updateError } = await supabase
      .from("sessions")
      .update({
        end_time: new Date().toISOString(),
        status: "completed",
        duration_hours: costResult.duration_hours,
        calculated_cost: costResult.total_cost,
      })
      .eq("id", session_id)
      .eq("shop_id", shopId)
      .select()
      .maybeSingle();

    if (updateError || !updatedSession) {
      console.error("Failed to close session:", updateError);
      return NextResponse.json(
        { error: "Failed to close session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, session: updatedSession });
  } catch (err) {
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Error confirming session close:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
