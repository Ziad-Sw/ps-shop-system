"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface ShopData {
  id: string;
  name: string;
  owner_name: string | null;
  ps_enabled: boolean;
  billiard_enabled: boolean;
  shifts_per_day: number;
}

interface SettingsFormProps {
  initialShopData: ShopData;
}

export default function SettingsForm({ initialShopData }: SettingsFormProps) {
  const { showToast } = useToast();
  const [shopName, setShopName] = useState(initialShopData.name);
  const [ownerName, setOwnerName] = useState(initialShopData.owner_name || "");
  const [isSavingShopName, setIsSavingShopName] = useState(false);
  const [isSavingOwnerName, setIsSavingOwnerName] = useState(false);

  const handleSaveShopName = async () => {
    if (!shopName.trim()) {
      showToast("error", "يجب إدخال اسم للمحل");
      return;
    }

    setIsSavingShopName(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update shop name");
      }

      showToast("success", "تم حفظ اسم المحل بنجاح");
    } catch (err) {
      console.error("Error saving shop name:", err);
      showToast("error", "حدث خطأ أثناء حفظ اسم المحل");
    } finally {
      setIsSavingShopName(false);
    }
  };

  const handleSaveOwnerName = async () => {
    if (!ownerName.trim()) {
      showToast("error", "يجب إدخال اسم صاحب المحل");
      return;
    }

    setIsSavingOwnerName(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_name: ownerName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update owner name");
      }

      showToast("success", "تم حفظ اسم صاحب المحل بنجاح");
    } catch (err) {
      console.error("Error saving owner name:", err);
      showToast("error", "حدث خطأ أثناء حفظ اسم صاحب المحل");
    } finally {
      setIsSavingOwnerName(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shop Name Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">اسم المحل</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          غيّر اسم المحل الذي يظهر في الشريط العلوي
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="مثال: محل البلايستيشن"
          />

          <button
            onClick={handleSaveShopName}
            disabled={isSavingShopName || shopName === initialShopData.name}
            className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingShopName ? "جاري الحفظ..." : "حفظ اسم المحل"}
          </button>
        </div>
      </div>

      {/* Owner Name Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">اسم صاحب المحل</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          غيّر اسم صاحب المحل الذي يظهر في القائمة المنسدلة
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="مثال: محمد أحمد"
          />

          <button
            onClick={handleSaveOwnerName}
            disabled={isSavingOwnerName || ownerName === (initialShopData.owner_name || "")}
            className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingOwnerName ? "جاري الحفظ..." : "حفظ اسم صاحب المحل"}
          </button>
        </div>
      </div>

      {/* PlayStation Settings Card */}
      <Link
        href="/settings/ps"
        className="block rounded-xl bg-surface-card p-6 transition-colors hover:border-primary/50 hover:bg-surface-card/90 border border-transparent"
      >
        <h2 className="text-lg font-semibold text-foreground">البلايستيشن</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          إدارة أجهزة البلايستيشن وتسعيرها
        </p>
        <div className="mt-3 text-sm text-primary">إعدادات ←</div>
      </Link>

      {/* Billiard Settings Card */}
      <Link
        href="/settings/billiard"
        className="block rounded-xl bg-surface-card p-6 transition-colors hover:border-primary/50 hover:bg-surface-card/90 border border-transparent"
      >
        <h2 className="text-lg font-semibold text-foreground">البلياردو</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          إدارة طاولات البلياردو وتسعيرها
        </p>
        <div className="mt-3 text-sm text-primary">إعدادات ←</div>
      </Link>

      {/* Products Settings Card */}
      <Link
        href="/settings/products"
        className="block rounded-xl bg-surface-card p-6 transition-colors hover:border-primary/50 hover:bg-surface-card/90 border border-transparent"
      >
        <h2 className="text-lg font-semibold text-foreground">المشروبات</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          إضافة وتعديل وحذف المشروبات وأسعارها
        </p>
        <div className="mt-3 text-sm text-primary">إعدادات ←</div>
      </Link>

      {/* Shifts Settings Card */}
      <Link
        href="/settings/shifts"
        className="block rounded-xl bg-surface-card p-6 transition-colors hover:border-primary/50 hover:bg-surface-card/90 border border-transparent"
      >
        <h2 className="text-lg font-semibold text-foreground">الورديات</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          تحديد عدد الورديات اليومية المسموح بها
        </p>
        <div className="mt-3 text-sm text-primary">إعدادات ←</div>
      </Link>
    </div>
  );
}
