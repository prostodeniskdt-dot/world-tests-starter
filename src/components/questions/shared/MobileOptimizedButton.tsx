"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface MobileOptimizedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export function MobileOptimizedButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: MobileOptimizedButtonProps) {
  const baseClasses = "min-h-[44px] touch-manipulation transition-all font-medium text-base sm:text-sm";
  
  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50",
    secondary: "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
