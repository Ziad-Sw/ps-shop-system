"use client";

import { useState } from "react";

interface ShopData {
  id: string;
  name: string;
  ps_enabled: boolean;
  billiard_enabled: boolean;
  shifts_per_day: number;
}

interface SettingsFormProps {
  initialShopData: ShopData;
}

export default function SettingsForm({ initialShopData }: SettingsFormProps) {
  const [shopName, setShopName] = useState(initialShopData.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSaveShopName = async () => {
    if (!shopName.trim()) {
      setSaveMessage({
        type: "error",
        text: "يجب إدخال اسم للمحل",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update shop name");
      }

      setSaveMessage({
        type: "success",
        text: "تم حفظ اسم المحل بنجاح",
      });

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Error saving shop name:", err);
      setSaveMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ اسم المحل",
      });
    } finally {
      setIsSaving(false);
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
            disabled={isSaving || shopName === initialShopData.name}
            className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ اسم المحل"}
          </button>

          {saveMessage && (
            <div
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                saveMessage.type === "success"
                  ? "bg-primary/10 text-primary"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Placeholder for future settings */}
      <div className="rounded-xl bg-surface-card p-6 opacity-50">
        <h2 className="text-lg font-semibold text-foreground">المكوّنات</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          تفعيل/تعطيل البلايستيشن والبلياردو (قريبًا)
        </p>
      </div>

      <div className="rounded-xl bg-surface-card p-6 opacity-50">
        <h2 className="text-lg font-semibold text-foreground">الورديات</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          عدد الورديات يوميًا (قريبًا)
        </p>
      </div>

      <div className="rounded-xl bg-surface-card p-6 opacity-50">
        <h2 className="text-lg font-semibold text-foreground">الأسعار</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          إدارة أسعار الأجهزة (قريبًا)
        </p>
      </div>
    </div>
  );
}
