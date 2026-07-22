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
  canEdit?: boolean;
}

export default function PsSettingsForm({
  initialPsEnabled,
  initialPricingRules,
  initialStationCount,
  canEdit = true,
}: PsSettingsFormProps) {
  const { showToast } = useToast();
  const [psEnabled, setPsEnabled] = useState(initialPsEnabled);
  const [singleHourRate, setSingleHourRate] = useState(
    initialPricingRules.find((r) => r.mode === "single" && r.unit === "hour")?.rate?.toString() || ""
  );
  const [multiHourRate, setMultiHourRate] = useState(
    initialPricingRules.find((r) => r.mode === "multi" && r.unit === "hour")?.rate?.toString() || ""
  );
  const [singleGameRate, setSingleGameRate] = useState(
    initialPricingRules.find((r) => r.mode === "single" && r.unit === "game")?.rate?.toString() || ""
  );
  const [multiGameRate, setMultiGameRate] = useState(
    initialPricingRules.find((r) => r.mode === "multi" && r.unit === "game")?.rate?.toString() || ""
  );
  const [stationCount, setStationCount] = useState(initialStationCount?.toString() || "");
  const [isSavingToggle, setIsSavingToggle] = useState(false);
  const [savingMode, setSavingMode] = useState<string | null>(null);
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
        console.error("API Error:", error);
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
    const count = parseInt(stationCount) || 0;
    if (count < 0) {
      showToast("error", "عدد الأجهزة لا يمكن أن يكون سالباً");
      return;
    }

    setIsSavingStationCount(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ps_station_count: count }),
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

  const handleSavePricing = async (mode: "single" | "multi", unit: "hour" | "game", rate: number) => {
    const key = `${mode}_${unit}`;
    setSavingMode(key);
    try {
      const response = await fetch("/api/pricing-rules/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_type: "playstation",
          mode,
          unit,
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
      setSavingMode(null);
    }
  };

  const StationTypeLabel = "بلايستيشن";

  return (
    <div className="space-y-6">
      {/* Toggle Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">تفعيل {StationTypeLabel}</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          قم بتفعيل أو تعطيل خدمة {StationTypeLabel} في المحل
        </p>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleSaveToggle}
            disabled={!canEdit || isSavingToggle}
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
          حدد عدد أجهزة {StationTypeLabel} الموجودة في المحل
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            min="0"
            step="1"
            value={stationCount}
            onChange={(e) => setStationCount(e.target.value)}
            disabled={!canEdit}
            className="w-full sm:flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="العدد"
          />
          <button
            onClick={handleSaveStationCount}
            disabled={!canEdit || isSavingStationCount}
            className="w-full sm:w-auto min-h-[44px] sm:min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingStationCount ? "جاري..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">أسعار {StationTypeLabel}</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          أسعار اللعب بالساعة وبعدد الجيمات لكل نوع لعب
        </p>

        <div className="mt-6 space-y-6">
          {/* Hourly Pricing */}
          <div>
            <h3 className="text-md font-medium text-foreground mb-3">التسعير بالساعة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  لعب فردي (جنيه/ساعة)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    min="0"
                    step="1"
                    value={singleHourRate}
                    onChange={(e) => setSingleHourRate(e.target.value)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="السعر"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("single", "hour", parseFloat(singleHourRate) || 0)}
                    disabled={!canEdit || savingMode === "single_hour"}
                    className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingMode === "single_hour" ? "جاري..." : "حفظ"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  لعب مالتي (جنيه/ساعة)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    min="0"
                    step="1"
                    value={multiHourRate}
                    onChange={(e) => setMultiHourRate(e.target.value)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="السعر"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("multi", "hour", parseFloat(multiHourRate) || 0)}
                    disabled={!canEdit || savingMode === "multi_hour"}
                    className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingMode === "multi_hour" ? "جاري..." : "حفظ"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Game Pricing */}
          <div className="border-t border-foreground-muted/20 pt-6">
            <h3 className="text-md font-medium text-foreground mb-3">التسعير بعدد الجيمات</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  لعب فردي (جنيه/جيم)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    min="0"
                    step="1"
                    value={singleGameRate}
                    onChange={(e) => setSingleGameRate(e.target.value)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="السعر"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("single", "game", parseFloat(singleGameRate) || 0)}
                    disabled={!canEdit || savingMode === "single_game"}
                    className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingMode === "single_game" ? "جاري..." : "حفظ"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  لعب مالتي (جنيه/جيم)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    min="0"
                    step="1"
                    value={multiGameRate}
                    onChange={(e) => setMultiGameRate(e.target.value)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="السعر"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("multi", "game", parseFloat(multiGameRate) || 0)}
                    disabled={!canEdit || savingMode === "multi_game"}
                    className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingMode === "multi_game" ? "جاري..." : "حفظ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
