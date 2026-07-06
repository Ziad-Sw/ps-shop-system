"use client";

import { useState } from "react";

interface ShiftsSettingsFormProps {
  initialShiftsPerDay: number;
}

export default function ShiftsSettingsForm({
  initialShiftsPerDay,
}: ShiftsSettingsFormProps) {
  const [shiftsPerDay, setShiftsPerDay] = useState(initialShiftsPerDay);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    if (shiftsPerDay < 1 || shiftsPerDay > 4) {
      setSaveMessage({
        type: "error",
        text: "عدد الورديات يجب أن يكون بين 1 و 4",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/shops/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shifts_per_day: shiftsPerDay }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      setSaveMessage({
        type: "success",
        text: "تم حفظ عدد الورديات بنجاح",
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Error saving shifts per day:", err);
      setSaveMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ الإعدادات",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-foreground">عدد الورديات اليومية</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          حدد الحد الأقصى لعدد الورديات المسموح بها في اليوم الواحد (1-4)
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="4"
              value={shiftsPerDay}
              onChange={(e) =>
                setShiftsPerDay(parseInt(e.target.value) || 1)
              }
              className="w-24 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-3 py-2 text-foreground placeholder-foreground-muted/50 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleSave}
              disabled={isSaving || shiftsPerDay === initialShiftsPerDay}
              className="min-h-[44px] min-w-[100px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface-page transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>

          <div className="text-sm text-foreground-muted">
            <p>ملاحظات:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>الحد الأدنى: وردية واحدة يوميًا</li>
              <li>الحد الأقصى: 4 ورديات يوميًا</li>
              <li>لا يمكن تعديل هذا الإعداد أثناء وجود وردية مفتوحة</li>
            </ul>
          </div>
        </div>
      </div>

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
  );
}
