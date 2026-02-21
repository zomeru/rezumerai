"use client";

import { cn } from "@rezumerai/utils/styles";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Reusable button component with app-specific alert demonstration.
 * Extends native HTML button attributes for full flexibility.
 *
 * @param props - Button properties including native HTML button attributes
 * @param props.children - Button content (text, icons, or React nodes)
 * @param props.appName - Application name shown in alert (demo feature)
 * @param props.className - Optional Tailwind classes for custom styling
 * @returns Styled button component
 *
 * @example
 * ```tsx
 * <Button appName="Dashboard">Click me</Button>
 * <Button appName="App" className="bg-blue-500 text-white">
 *   Save Changes
 * </Button>
 * ```
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  appName: string;
}

export const Button = ({ children, className, appName: _appName, onClick, ...props }: ButtonProps) => {
  return (
    <button type="button" className={cn("rounded-md px-4 py-2 font-medium", className)} onClick={onClick} {...props}>
      {children}
    </button>
  );
};
