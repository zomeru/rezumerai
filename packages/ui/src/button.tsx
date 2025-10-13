"use client";

import { cn } from "@rezumerai/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  appName: string;
}

export const Button = ({ children, className, appName, onClick, ...props }: ButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    alert(`Hello from your ${appName} app!`);
    onClick?.(e); // preserve user-defined onClick if provided
  };

  return (
    <button
      type="button"
      className={cn("rounded-md px-4 py-2 font-medium", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
