import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getShopIdFromRequest } from "@/lib/auth/require-shop";
import { hasOpenShift } from "@/lib/shifts/check-open-shift";

/**
 * Creates a new product (drink) for the authenticated shop.
 *
 * Body: { name: string, price: number }
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
    const { name, price } = body ?? {};

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "اسم المشروب مطلوب." },
        { status: 400 }
      );
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        { error: "السعر يجب أن يكون رقمًا موجبًا." },
        { status: 400 }
      );
    }

    if (await hasOpenShift(shopId)) {
      return NextResponse.json(
        {
          error:
            "لا يمكن إضافة مشروبات أثناء وجود وردية مفتوحة. أغلق الوردية أولًا.",
        },
        { status: 409 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        shop_id: shopId,
        name: name.trim(),
        price,
        is_active: true,
      })
      .select("id, name, price, is_active")
      .maybeSingle();

    if (error || !data) {
      console.error("product create failed:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, product: data });
  } catch (err) {
    console.error("Error creating product:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
