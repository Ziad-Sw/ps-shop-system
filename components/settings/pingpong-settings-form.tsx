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
  canEdit?: boolean;
}

export default function PingpongSettingsForm({
  initialPingpongEnabled,
  initialPricingRules,
  initialTableCount,
  canEdit = true,
}: PingpongSettingsFormProps) {
  const { showToast } = useToast();
  const [pingpongEnabled, setPingpongEnabled] = useState(
    initialPingpongEnabled
  );
  const [singleHourRate, setSingleHourRate] = useState(
    initialPricingRules.find((r) => r.mode === "single" && r.unit === "hour")?.rate || 0
  );
  const [multiHourRate, setMultiHourRate] = useState(
    initialPricingRules.find((r) => r.mode === "multi" && r.unit === "hour")?.rate || 0
  );
  const [singleGameRate, setSingleGameRate] = useState(
    initialPricingRules.find((r) => r.mode === "single" && r.unit === "game")?.rate || 0
  );
  const [multiGameRate, setMultiGameRate] = useState(
    initialPricingRules.find((r) => r.mode === "multi" && r.unit === "game")?.rate || 0
  );
  const [tableCount, setTableCount] = useState(initialTableCount);
  const [isSavingToggle, setIsSavingToggle] = useState(false);
  const [savingMode, setSavingMode] = useState<string | null>(null);
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

  const handleSavePricing = async (mode: "single" | "multi", unit: "hour" | "game", rate: number) => {
    const key = `${mode}_${unit}`;
    setSavingMode(key);
    try {
      const response = await fetch("/api/pricing-rules/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_type: "pingpong",
          mode,
          unit,
          rate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast("error", error.error || "فشل حفظ السعر");
        return;
      }

      showToast("success", "تم حفظ السعر بنجاح");
    } catch (err) {
      console.error("Error saving pricing:", err);
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ السعر";
      showToast("error", errorMessage);
    } finally {
      setSavingMode(null);
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
            disabled={!canEdit || isSavingToggle}
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

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min="0"
            step="1"
            value={tableCount}
            onChange={(e) => setTableCount(parseInt(e.target.value) || 0)}
            className="w-full sm:flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0"
            disabled={!canEdit}
          />
          <button
            onClick={handleSaveTableCount}
            disabled={!canEdit || isSavingTableCount}
            className="w-full sm:w-auto min-h-[44px] sm:min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingTableCount ? "جاري..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">أسعار البينغ بونغ</h2>
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
                    type="number"
                    min="0"
                    step="1"
                    value={singleHourRate}
                    onChange={(e) => setSingleHourRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("single", "hour", singleHourRate)}
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
                    type="number"
                    min="0"
                    step="1"
                    value={multiHourRate}
                    onChange={(e) => setMultiHourRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("multi", "hour", multiHourRate)}
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
                    type="number"
                    min="0"
                    step="1"
                    value={singleGameRate}
                    onChange={(e) => setSingleGameRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("single", "game", singleGameRate)}
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
                    type="number"
                    min="0"
                    step="1"
                    value={multiGameRate}
                    onChange={(e) => setMultiGameRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                    disabled={!canEdit}
                  />
                  <button
                    onClick={() => handleSavePricing("multi", "game", multiGameRate)}
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
