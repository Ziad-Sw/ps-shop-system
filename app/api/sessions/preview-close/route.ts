import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getShopIdFromRequest } from "@/lib/auth/require-shop";
import { assertPermission, PermissionError, getUserIdFromRequest } from "@/lib/auth/permissions";
import { calculateSessionCost, calculateBilliardGameEntriesCost, formatDuration } from "@/lib/pricing/calculation";

/**
 * POST /api/sessions/preview-close — calculates receipt preview (read-only, no DB updates)
 * Body: { session_id: string }
 * Returns: receipt preview with costs computed from billing_mode
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
        station_id,
        play_type,
        play_subtype,
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

    // Derive unit from billing_mode
    const unit: "hour" | "game" = session.billing_mode === "time" ? "hour" : "game";
    const stationType = session.stations.station_type;
    const isBilliardGames = stationType === "billiard" && session.billing_mode === "games";

    // For billiard/games sessions, cost comes from game entries; pricing rule not needed
    // For all other sessions, look up pricing rule by (shop_id, station_type, play_type='normal', play_subtype=mode, unit)
    let rate = 0;
    let pricingUnit: "hour" | "game" = unit;
    let billiardGameEntriesCost = 0;

    if (isBilliardGames) {
      // Fetch billiard game entries and sum them
      const { data: gameEntries, error: entriesError } = await supabase
        .from("billiard_game_entries")
        .select("games_count, price_per_game")
        .eq("session_id", session_id)
        .eq("shop_id", shopId);

      if (entriesError) {
        console.error("Failed to fetch billiard game entries:", entriesError);
        return NextResponse.json(
          { error: "Failed to fetch game entries" },
          { status: 500 }
        );
      }

      billiardGameEntriesCost = calculateBilliardGameEntriesCost(gameEntries ?? []);
      pricingUnit = "game";
    } else {
      const playSubtype = session.play_subtype ?? (session.mode === "multi" ? "multi" : "single");

      const { data: pricingRule, error: pricingError } = await supabase
        .from("pricing_rules")
        .select("rate, unit")
        .eq("shop_id", shopId)
        .eq("station_type", stationType)
        .eq("play_type", "normal")
        .eq("play_subtype", playSubtype)
        .eq("unit", unit)
        .limit(1)
        .maybeSingle();

      if (pricingError || !pricingRule) {
        return NextResponse.json(
          { error: "قاعدة التسعير غير موجودة." },
          { status: 404 }
        );
      }

      rate = Number(pricingRule.rate);
      pricingUnit = pricingRule.unit as "hour" | "game";
    }

    // Get sale items for this session
    const { data: saleItems, error: itemsError } = await supabase
      .from("sale_items")
      .select(`
        id,
        quantity,
        unit_price,
        total_price,
        products!inner (
          name
        )
      `)
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

    const previewEndTime = new Date().toISOString();

    // Calculate session cost using the centralized function
    const costResult = calculateSessionCost({
      station_type: stationType,
      mode: session.mode,
      unit: pricingUnit,
      rate,
      start_time: session.start_time,
      end_time: previewEndTime, // Preview uses current time
      games_count: isBilliardGames ? 0 : session.games_count,
      sale_items_total: drinksCost,
      billiard_game_entries_cost: billiardGameEntriesCost,
    });

    // Format items for response
    const items = saleItems.map((item) => ({
      id: item.id,
      product_name: item.products.name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price),
    }));

    return NextResponse.json({
      duration_hours: costResult.duration_hours,
      duration_formatted: formatDuration(costResult.duration_hours),
      time_cost: Math.round(costResult.session_cost * 100) / 100,
      drinks_cost: Math.round(costResult.products_cost * 100) / 100,
      game_entries_cost: Math.round(costResult.billiard_game_entries_cost * 100) / 100,
      total_cost: Math.round(costResult.total_cost * 100) / 100,
      items,
      start_time: session.start_time,
      end_time: previewEndTime,
      unit: pricingUnit,
      games_count: isBilliardGames ? 0 : session.games_count,
    });
  } catch (err) {
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Error previewing session close:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
