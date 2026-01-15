"use client";

import { InputHTMLAttributes } from "react";

interface TouchFriendlyInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function TouchFriendlyInput({
  label,
  className = "",
  ...props
}: TouchFriendlyInputProps) {
  const inputClasses = `min-h-[44px] text-base touch-manipulation px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`;

  if (label) {
    return (
      <label className="block">
        <span className="block text-sm font-medium text-zinc-700 mb-1">{label}</span>
        <input className={inputClasses} {...props} />
      </label>
    );
  }

  return <input className={inputClasses} {...props} />;
}
