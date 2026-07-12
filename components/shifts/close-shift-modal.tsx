"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: {
    id: string;
    responsible_name: string;
    shift_number: number;
    opened_at: string;
  } | null;
  onCloseShift: (shiftId: string) => Promise<void>;
}

export function CloseShiftModal({
  isOpen,
  onClose,
  shift,
  onCloseShift,
}: CloseShiftModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async () => {
    if (!shift) return;

    setIsSubmitting(true);
    try {
      await onCloseShift(shift.id);
      onClose();
      showToast("success", "تم إغلاق الوردية بنجاح");
    } catch (error) {
      console.error("Failed to close shift:", error);
      showToast("error", "فشل إغلاق الوردية");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md border border-neutral-700">
        <h2 className="text-xl font-bold text-white mb-4">إنهاء الوردية</h2>
        
        <div className="mb-6 space-y-3">
          <div className="flex justify-between text-neutral-300">
            <span>اسم المسؤول:</span>
            <span className="text-white font-medium">{shift.responsible_name}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>رقم الوردية:</span>
            <span className="text-white font-medium">{shift.shift_number}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>وقت الفتح:</span>
            <span className="text-white font-medium">{formatTime(shift.opened_at)}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
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
        </div>
      </div>
    </div>
  );
}
