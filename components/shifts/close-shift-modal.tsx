"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { formatCount } from "@/lib/format/number";
import { formatTime } from "@/lib/format/time";

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: {
    id: string;
    responsible_name: string;
    shift_number: number;
    opened_at: string;
  } | null;
  pressedAt?: string | null;
  onCloseShift: (shiftId: string) => Promise<{
    closed_at: string | null;
  } | null>;
}

export function CloseShiftModal({
  isOpen,
  onClose,
  shift,
  pressedAt,
  onCloseShift,
}: CloseShiftModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!shift) return;

    setIsSubmitting(true);
    try {
      const result = await onCloseShift(shift.id);
      if (result) {
        setClosedAt(result.closed_at);
        setIsClosed(true);
        showToast("success", "تم إغلاق الوردية بنجاح");
      }
    } catch (error) {
      console.error("Failed to close shift:", error);
      showToast("error", "فشل إغلاق الوردية");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setIsClosed(false);
    setClosedAt(null);
    onClose();
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md border border-neutral-700">
        <h2 className="text-xl font-bold text-white mb-4">
          {isClosed ? "تم إغلاق الوردية" : "إنهاء الوردية"}
        </h2>
        
        <div className="mb-6 space-y-3">
          <div className="flex justify-between text-neutral-300">
            <span>اسم المسؤول:</span>
            <span className="text-white font-medium">{shift.responsible_name}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>رقم الوردية:</span>
            <span className="text-white font-medium">{formatCount(shift.shift_number)}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>وقت الفتح:</span>
            <span className="text-white font-medium">{formatTime(shift.opened_at)}</span>
          </div>
          {(isClosed && closedAt) || pressedAt ? (
            <div className="flex justify-between text-neutral-300">
              <span>وقت الإغلاق:</span>
              <span className="text-white font-medium">
                {formatTime(isClosed && closedAt ? closedAt : (pressedAt ?? shift.opened_at))}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 justify-end">
          {isClosed ? (
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
            >
              تم
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "جاري الإغلاق..." : "إنهاء وردية"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
