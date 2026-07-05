import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/lib/auth/session";

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

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid shop name" },
        { status: 400 }
      );
    }

    // Get user shop_id
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

    // Update shop name
    const { data: updatedShop, error: updateError } = await supabase
      .from("shops")
      .update({ name: name.trim() })
      .eq("id", user.shop_id)
      .select("id, name")
      .maybeSingle();

    if (updateError || !updatedShop) {
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
