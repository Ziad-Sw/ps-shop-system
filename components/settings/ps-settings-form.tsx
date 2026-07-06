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

interface PsSettingsFormProps {
  initialPsEnabled: boolean;
  initialPricingRules: PricingRule[];
  initialStationCount: number;
}

export default function PsSettingsForm({
  initialPsEnabled,
  initialPricingRules,
  initialStationCount,
}: PsSettingsFormProps) {
  const { showToast } = useToast();
  const [psEnabled, setPsEnabled] = useState(initialPsEnabled);
  const [singleRate, setSingleRate] = useState(
    initialPricingRules.find((r) => r.mode === "single")?.rate || 0
  );
  const [multiRate, setMultiRate] = useState(
    initialPricingRules.find((r) => r.mode === "multi")?.rate || 0
  );
  const [stationCount, setStationCount] = useState(initialStationCount);
  const [isSavingToggle, setIsSavingToggle] = useState(false);
  const [isSavingSingle, setIsSavingSingle] = useState(false);
  const [isSavingMulti, setIsSavingMulti] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isSavingStationCount, setIsSavingStationCount] = useState(false);

  const handleSaveToggle = async () => {
    setIsSavingToggle(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ps_enabled: !psEnabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast("error", error.error || "حدث خطأ أثناء تحديث الإعدادات");
        return;
      }

      setPsEnabled(!psEnabled);
      showToast("success", psEnabled
        ? "تم تعطيل البلايستيشن بنجاح"
        : "تم تفعيل البلايستيشن بنجاح");
    } catch (err) {
      console.error("Error toggling PS:", err);
      showToast("error", "حدث خطأ أثناء تحديث الإعدادات");
    } finally {
      setIsSavingToggle(false);
    }
  };

  const handleSaveStationCount = async () => {
    if (stationCount < 0) {
      showToast("error", "عدد الأجهزة لا يمكن أن يكون سالباً");
      return;
    }

    setIsSavingStationCount(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ps_station_count: stationCount }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast("error", error.error || "حدث خطأ أثناء حفظ عدد الأجهزة");
        return;
      }

      showToast("success", "تم حفظ عدد الأجهزة بنجاح");
    } catch (err) {
      console.error("Error saving station count:", err);
      showToast("error", "حدث خطأ أثناء حفظ عدد الأجهزة");
    } finally {
      setIsSavingStationCount(false);
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
          station_type: "playstation",
          mode,
          rate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update pricing");
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
          station_type: "playstation",
          mode: "single",
          rate: singleRate,
        }),
      });

      if (!singleResponse.ok) {
        const error = await singleResponse.json();
        throw new Error(error.error || "Failed to update single pricing");
      }

      // Save multi rate
      const multiResponse = await fetch("/api/pricing-rules/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_type: "playstation",
          mode: "multi",
          rate: multiRate,
        }),
      });

      if (!multiResponse.ok) {
        const error = await multiResponse.json();
        throw new Error(error.error || "Failed to update multi pricing");
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
        <h2 className="text-lg font-semibold text-foreground">تفعيل البلايستيشن</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          قم بتفعيل أو تعطيل خدمة البلايستيشن في المحل
        </p>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleSaveToggle}
            disabled={isSavingToggle}
            className={`min-h-[44px] rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
              psEnabled
                ? "bg-primary text-surface-page hover:bg-primary/90"
                : "bg-surface-page border border-foreground-muted/20 text-foreground hover:border-primary/50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSavingToggle
              ? "جاري الحفظ..."
              : psEnabled
              ? "مفعّل — اضغط للتعطيل"
              : "معطّل — اضغط للتفعيل"}
          </button>
        </div>
      </div>

      {/* Station Count Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">عدد الأجهزة</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          حدد عدد أجهزة البلايستيشن الموجودة في المحل
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={stationCount}
            onChange={(e) => setStationCount(parseInt(e.target.value) || 0)}
            className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="0"
          />
          <button
            onClick={handleSaveStationCount}
            disabled={isSavingStationCount}
            className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingStationCount ? "جاري..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">أسعار البلايستيشن</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          الأسعار بالساعة لكل نوع لعب
        </p>

        <div className="mt-4 space-y-4">
          {/* Single Player */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              لعب فردي (جنيه/ساعة)
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
              لعب مالتي (جنيه/ساعة)
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
