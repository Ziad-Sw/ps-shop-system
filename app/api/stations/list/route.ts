import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getShopIdFromRequest } from "@/lib/auth/require-shop";

/**
 * GET /api/stations/list — returns stations for the shop, optionally filtered by station_type
 * Query params: station_type (optional) - 'playstation', 'billiard', or 'pingpong'
 * Returns: stations with their current status (empty/active) based on active sessions
 */
export async function GET(request: NextRequest) {
  try {
    const shopId = await getShopIdFromRequest();
    if (!shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stationType = searchParams.get("station_type");

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from("stations")
      .select(`
        id,
        name,
        station_type,
        sort_order,
        is_active,
        sessions (
          id,
          status
        )
      `)
      .eq("shop_id", shopId)
      .eq("is_active", true);

    if (stationType) {
      const validTypes = ["playstation", "billiard", "pingpong"] as const;
      if (validTypes.includes(stationType as any)) {
        query = query.eq("station_type", stationType as any);
      }
    }

    const { data: stations, error } = await query.order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch stations:", error);
      return NextResponse.json(
        { error: "Failed to fetch stations" },
        { status: 500 }
      );
    }

    // Determine station status based on active sessions
    const stationsWithStatus = stations.map((station) => {
      const hasActiveSession = station.sessions && station.sessions.some(
        (session) => session.status === "active"
      );
      return {
        id: station.id,
        name: station.name,
        station_type: station.station_type,
        sort_order: station.sort_order,
        is_active: station.is_active,
        status: hasActiveSession ? "active" : "empty",
      };
    });

    return NextResponse.json({ stations: stationsWithStatus });
  } catch (err) {
    console.error("Error fetching stations:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
