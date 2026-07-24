"use client";

import { useState, useEffect, useCallback } from "react";

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function NumericInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = "أدخل العدد",
  required = false,
  disabled = false,
  className = "",
}: NumericInputProps) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (isTouch && raw === "") {
        onChange(0);
        return;
      }
      const parsed = parseInt(raw, 10);
      let num = isNaN(parsed) ? 0 : parsed;
      if (min !== undefined) num = Math.max(num, min);
      if (max !== undefined) num = Math.min(num, max);
      onChange(num);
    },
    [onChange, min, max, isTouch]
  );

  const baseClass =
    "w-full rounded-lg bg-surface-page px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary";

  if (isTouch) {
    const displayValue = value === 0 ? "" : String(value);
    return (
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-required={required}
        className={`${baseClass} ${className}`}
      />
    );
  }

  return (
    <input
      type="number"
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      aria-required={required}
      className={`${baseClass} ${className}`}
    />
  );
}