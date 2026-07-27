"use client";

import { useState, useEffect } from "react";
import { Station, Session } from "@/types/database";
import { useToast } from "@/components/ui/toast";

interface ReceiptPopupProps {
  session: Session;
  station: Station;
  onClose: () => void;
  onConfirm: () => void;
}

interface ReceiptData {
  duration_hours: number;
  duration_formatted: string;
  time_cost: number;
  drinks_cost: number;
  game_entries_cost: number;
  total_cost: number;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  start_time: string;
  end_time: string;
  unit: "hour" | "game";
  games_count: number | null;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return formatter.format(date);
}

export function ReceiptPopup({
  session,
  station,
  onClose,
  onConfirm,
}: ReceiptPopupProps) {
  const { showToast } = useToast();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Fetch receipt data on mount
  useEffect(() => {
    fetchReceiptData();
  }, []);

  const fetchReceiptData = async () => {
    try {
      const response = await fetch("/api/sessions/preview-close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReceiptData(data);
      } else {
        showToast("error", data.error || "فشل حساب الإيصال");
        onClose();
      }
    } catch (error) {
      console.error("Failed to fetch receipt data:", error);
      showToast("error", "حدث خطأ أثناء حساب الإيصال");
      onClose();
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch("/api/sessions/confirm-close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "تم قفل الجلسة بنجاح");
        onConfirm();
      } else {
        showToast("error", data.error || "فشل قفل الجلسة");
      }
    } catch (error) {
      console.error("Failed to confirm close:", error);
      showToast("error", "حدث خطأ أثناء قفل الجلسة");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!receiptData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl bg-surface-card p-6">
          <div className="text-center text-foreground-muted">جاري حساب الإيصال...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div dir="ltr" className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl bg-surface-card shadow-none scrollbar-dark">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-card px-6 pt-6 pb-0 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">إيصال الدفع</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-page hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div dir="rtl" className="px-6 pb-6">
        {/* Station Info */}
        <div className="mt-4 mb-6 rounded-lg bg-surface-page/50 p-4">
          <div className="text-sm text-foreground-muted">
            {station.station_type === "billiard"
              ? "بلياردو"
              : station.station_type === "playstation"
                ? "بلايستيشن"
                : "بينغ بونغ"}
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground">{station.name}</div>
          {receiptData.unit === "game" ? (
            <div className="mt-2 text-sm text-foreground-muted">
              عدد الجيمات: {receiptData.games_count ?? 0}
            </div>
          ) : (
            <>
              <div className="mt-2 text-sm text-foreground-muted">
                المدة: {receiptData.duration_formatted}
              </div>
              <div className="text-sm text-foreground-muted">
                من {formatTime(receiptData.start_time)} إلى {formatTime(receiptData.end_time)}
              </div>
            </>
          )}
        </div>

        {/* Items */}
        <div className="mb-6 space-y-3">
          {/* Session Cost — suppressed for billiard+games (game_entries_cost covers it) */}
          {receiptData.unit === "hour" || receiptData.game_entries_cost === 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">
                {receiptData.unit === "game" ? "تكلفة اللعب" : "تكلفة الوقت"}
              </span>
              <span className="text-foreground">{receiptData.time_cost.toFixed(2)} ج.م</span>
            </div>
          ) : null}

          {/* Products */}
          {receiptData.items.length > 0 && (
            <>
              <div className="border-t border-foreground-muted/20 pt-3">
                <div className="text-sm font-medium text-foreground mb-2">المشروبات</div>
                {receiptData.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-foreground-muted">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="text-foreground">{item.total_price.toFixed(2)} ج.م</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">إجمالي المشروبات</span>
                <span className="text-foreground">{receiptData.drinks_cost.toFixed(2)} ج.م</span>
              </div>
            </>
          )}

          {/* Game Entries Cost (billiard) */}
          {receiptData.game_entries_cost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">تكلفة الجيمات المسجلة</span>
              <span className="text-foreground">{receiptData.game_entries_cost.toFixed(2)} ج.م</span>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-foreground-muted/20 pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-foreground">الإجمالي</span>
              <span className="text-primary">{receiptData.total_cost.toFixed(2)} ج.م</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-foreground-muted/30 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-page"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-surface-page hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? "جاري القفل..." : "تأكيد القفل"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
