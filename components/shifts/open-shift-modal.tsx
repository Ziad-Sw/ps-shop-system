"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShift: (responsibleName: string) => Promise<void>;
}

export function OpenShiftModal({
  isOpen,
  onClose,
  onOpenShift,
}: OpenShiftModalProps) {
  const [responsibleName, setResponsibleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!responsibleName.trim()) {
      showToast("error", "اسم المسؤول مطلوب");
      return;
    }

    setIsSubmitting(true);
    try {
      await onOpenShift(responsibleName.trim());
      setResponsibleName("");
      onClose();
      showToast("success", "تم فتح الوردية بنجاح");
    } catch (error) {
      console.error("Failed to open shift:", error);
      showToast("error", "فشل فتح الوردية");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md border border-neutral-700">
        <h2 className="text-xl font-bold text-white mb-4">فتح وردية جديدة</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="responsibleName" className="block text-neutral-300 mb-2">
              اسم المسؤول
            </label>
            <input
              type="text"
              id="responsibleName"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="أدخل اسم المسؤول"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الفتح..." : "فتح وردية"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
