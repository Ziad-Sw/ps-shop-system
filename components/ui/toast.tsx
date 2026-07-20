"use client";

import React from "react";
import { useState } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  text: string;
}

interface ToastContextType {
  showToast: (type: "success" | "error" | "info" | "warning", text: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: "success" | "error" | "info" | "warning", text: string) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, type, text };
    setToasts((prev) => [...prev, newToast]);

    // Play success sound
    if (type === "success") {
      playSuccessSound();
    }

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const playSuccessSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error("Error playing success sound:", error);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-top-2 fade-in-0 duration-300 ${
              toast.type === "success"
                ? "bg-primary/10 text-primary border border-primary/20"
                : toast.type === "error"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : toast.type === "warning"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
