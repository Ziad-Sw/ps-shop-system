"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

interface PricingRule {
  id: string;
  station_type: string;
  mode: string;
  unit: string;
  rate: number;
}

interface PingpongSettingsFormProps {
  initialPingpongEnabled: boolean;
  initialPricingRules: PricingRule[];
  initialTableCount: number;
}

export default function PingpongSettingsForm({
  initialPingpongEnabled,
  initialPricingRules,
  initialTableCount,
}: PingpongSettingsFormProps) {
  const { showToast } = useToast();
  const [pingpongEnabled, setPingpongEnabled] = useState(
    initialPingpongEnabled
  );
  const [singleRate, setSingleRate] = useState(
    initialPricingRules.find((r) => r.mode === "single")?.rate || 0
  );
  const [multiRate, setMultiRate] = useState(
    initialPricingRules.find((r) => r.mode === "multi")?.rate || 0
  );
  const [tableCount, setTableCount] = useState(initialTableCount);
  const [isSavingToggle, setIsSavingToggle] = useState(false);
  const [isSavingSingle, setIsSavingSingle] = useState(false);
  const [isSavingMulti, setIsSavingMulti] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isSavingTableCount, setIsSavingTableCount] = useState(false);

  const handleSaveToggle = async () => {
    setIsSavingToggle(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pingpong_enabled: !pingpongEnabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast("error", error.error || "حدث خطأ أثناء تحديث الإعدادات");
        return;
      }

      setPingpongEnabled(!pingpongEnabled);
      showToast("success", pingpongEnabled
        ? "تم تعطيل البينغ بونغ بنجاح"
        : "تم تفعيل البينغ بونغ بنجاح");
    } catch (err) {
      console.error("Error toggling pingpong:", err);
      showToast("error", "حدث خطأ أثناء تحديث الإعدادات");
    } finally {
      setIsSavingToggle(false);
    }
  };

  const handleSaveTableCount = async () => {
    if (tableCount < 0) {
      showToast("error", "عدد الطاولات لا يمكن أن يكون سالباً");
      return;
    }

    setIsSavingTableCount(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pingpong_table_count: tableCount }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast("error", error.error || "حدث خطأ أثناء حفظ عدد الطاولات");
        return;
      }

      showToast("success", "تم حفظ عدد الطاولات بنجاح");
    } catch (err) {
      console.error("Error saving table count:", err);
      showToast("error", "حدث خطأ أثناء حفظ عدد الطاولات");
    } finally {
      setIsSavingTableCount(false);
    }
  };

  const handleSavePricing = async (mode: "single" | "multi", rate: number) => {
    if (mode === "single") {
      setIsSavingSingle(true);
    } else {
      setIsSavingMulti(true);
    }
    try {
      const response = await fetch("/api/pricing-rules/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_type: "pingpong",
          mode,
          rate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast("error", error.error || "حدث خطأ أثناء حفظ السعر");
        return;
      }

      showToast("success", "تم حفظ السعر بنجاح");
    } catch (err) {
      console.error("Error saving pricing:", err);
      showToast("error", "حدث خطأ أثناء حفظ السعر");
    } finally {
      if (mode === "single") {
        setIsSavingSingle(false);
      } else {
        setIsSavingMulti(false);
      }
    }
  };

  const handleSaveAllPricing = async () => {
    setIsSavingAll(true);
    try {
      // Save single rate
      const singleResponse = await fetch("/api/pricing-rules/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_type: "pingpong",
          mode: "single",
          rate: singleRate,
        }),
      });

      if (!singleResponse.ok) {
        const error = await singleResponse.json();
        showToast("error", error.error || "حدث خطأ أثناء حفظ الأسعار");
        return;
      }

      // Save multi rate
      const multiResponse = await fetch("/api/pricing-rules/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_type: "pingpong",
          mode: "multi",
          rate: multiRate,
        }),
      });

      if (!multiResponse.ok) {
        const error = await multiResponse.json();
        showToast("error", error.error || "حدث خطأ أثناء حفظ الأسعار");
        return;
      }

      showToast("success", "تم حفظ جميع الأسعار بنجاح");
    } catch (err) {
      console.error("Error saving all pricing:", err);
      showToast("error", "حدث خطأ أثناء حفظ الأسعار");
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">تفعيل البينغ بونغ</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          قم بتفعيل أو تعطيل خدمة البينغ بونغ في المحل
        </p>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleSaveToggle}
            disabled={isSavingToggle}
            className={`min-h-[44px] rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
              pingpongEnabled
                ? "bg-primary text-surface-page hover:bg-primary/90"
                : "bg-surface-page border border-foreground-muted/20 text-foreground hover:border-primary/50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSavingToggle
              ? "جاري الحفظ..."
              : pingpongEnabled
              ? "مفعّل — اضغط للتعطيل"
              : "معطّل — اضغط للتفعيل"}
          </button>
        </div>
      </div>

      {/* Table Count Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">عدد الطاولات</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          حدد عدد طاولات البينغ بونغ الموجودة في المحل
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={tableCount}
            onChange={(e) => setTableCount(parseInt(e.target.value) || 0)}
            className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="0"
          />
          <button
            onClick={handleSaveTableCount}
            disabled={isSavingTableCount}
            className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingTableCount ? "جاري..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">أسعار البينغ بونغ</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          الأسعار بالجيم لكل نوع لعب
        </p>

        <div className="mt-4 space-y-4">
          {/* Single Player */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              لعب فردي (جنيه/جيم)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={singleRate}
                onChange={(e) => setSingleRate(parseFloat(e.target.value) || 0)}
                className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="0.00"
              />
              <button
                onClick={() => handleSavePricing("single", singleRate)}
                disabled={isSavingSingle}
                className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingSingle ? "جاري..." : "حفظ"}
              </button>
            </div>
          </div>

          {/* Multi Player */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              لعب مالتي (جنيه/جيم)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={multiRate}
                onChange={(e) => setMultiRate(parseFloat(e.target.value) || 0)}
                className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="0.00"
              />
              <button
                onClick={() => handleSavePricing("multi", multiRate)}
                disabled={isSavingMulti}
                className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingMulti ? "جاري..." : "حفظ"}
              </button>
            </div>
          </div>

          {/* Save All Button */}
          <div className="pt-4 border-t border-foreground-muted/20">
            <button
              onClick={handleSaveAllPricing}
              disabled={isSavingAll}
              className="w-full min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingAll ? "جاري حفظ جميع الأسعار..." : "حفظ جميع الأسعار"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
