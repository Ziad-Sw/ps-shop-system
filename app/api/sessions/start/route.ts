import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import { hasOpenShift } from "@/lib/shifts/check-open-shift";
import { assertPermission, PermissionError } from "@/lib/auth/permissions";
import type { BillingMode } from "@/types";

/**
 * POST /api/sessions/start — starts a new session on a station
 * Body: { station_id: string, mode: 'single' | 'multi', billing_mode: 'time' | 'games', games_count?: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySessionCookieValue(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await assertPermission(session.user_id, "manage_sessions");

    // Parse body
    const body = await request.json();
    const { station_id, mode, billing_mode, games_count } = body ?? {};

    if (typeof station_id !== "string" || station_id.trim().length === 0) {
      return NextResponse.json(
        { error: "معرف الجهاز مطلوب." },
        { status: 400 }
      );
    }

    if (mode !== "single" && mode !== "multi") {
      return NextResponse.json(
        { error: "وضع الجلسة غير صالح." },
        { status: 400 }
      );
    }

    if (billing_mode !== "time" && billing_mode !== "games") {
      return NextResponse.json(
        { error: "طريقة الفوترة غير صالحة." },
        { status: 400 }
      );
    }

    if (games_count !== undefined) {
      if (
        typeof games_count !== "number" ||
        !Number.isFinite(games_count) ||
        !Number.isInteger(games_count) ||
        games_count < 0
      ) {
        return NextResponse.json(
          { error: "عدد الجيمات يجب أن يكون رقمًا صحيحًا غير سالب." },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Get user shop_id
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

    // Verify station belongs to the shop
    const { data: station, error: stationError } = await supabase
      .from("stations")
      .select("id, station_type")
      .eq("id", station_id)
      .eq("shop_id", shopId)
      .limit(1)
      .maybeSingle();

    if (stationError || !station) {
      return NextResponse.json(
        { error: "الجهاز غير موجود." },
        { status: 404 }
      );
    }

    // Verify there's an open shift
    const shiftOpen = await hasOpenShift(shopId);
    if (!shiftOpen) {
      return NextResponse.json(
        { error: "لا توجد وردية مفتوحة. افتح وردية أولاً." },
        { status: 409 }
      );
    }

    // Get the current open shift
    const { data: openShift, error: shiftError } = await supabase
      .from("shifts")
      .select("id")
      .eq("shop_id", shopId)
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (shiftError || !openShift) {
      return NextResponse.json(
        { error: "Failed to get open shift" },
        { status: 500 }
      );
    }

    // Check if there's already an active session on this station
    const { data: existingSession, error: existingError } = await supabase
      .from("sessions")
      .select("id")
      .eq("station_id", station_id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to check existing session:", existingError);
      return NextResponse.json(
        { error: "Failed to check existing session" },
        { status: 500 }
      );
    }

    if (existingSession) {
      return NextResponse.json(
        { error: "يوجد جلسة نشطة بالفعل على هذا الجهاز." },
        { status: 409 }
      );
    }

    // Create the new session
    const { data: newSession, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        shop_id: shopId,
        shift_id: openShift.id,
        station_id: station_id,
        mode: mode,
        billing_mode: billing_mode as BillingMode,
        status: "active",
        start_time: new Date().toISOString(),
        ...(games_count !== undefined ? { games_count } : {}),
      })
      .select()
      .maybeSingle();

    if (sessionError || !newSession) {
      console.error("Failed to create session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, session: newSession });
  } catch (err) {
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Error starting session:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
