"use client";

import { cn } from "@rezumerai/utils/styles";
import type { InputHTMLAttributes } from "react";

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Field label displayed above the input */
  label?: string;
  /** Whether the field is required (adds * to label) */
  required?: boolean;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Container class name for the wrapper div */
  containerClassName?: string;
  /** Error message to display */
  error?: string;
}

/**
 * Reusable text input component with label and consistent styling.
 * Used across form components in the Resume Builder.
 *
 * @param props - Input configuration extending native HTML input attributes
 * @returns Styled input with optional label
 *
 * @example
 * ```tsx
 * <TextInput
 *   label="Company"
 *   required
 *   value={company}
 *   onValueChange={setCompany}
 *   placeholder="Enter company name"
 * />
 * ```
 */
export default function TextInput({
  label,
  required = false,
  onValueChange,
  containerClassName,
  className,
  id,
  type = "text",
  error,
  ...props
}: TextInputProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block font-medium text-slate-700 text-sm">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <input
        {...props}
        id={id}
        type={type}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
          className,
        )}
      />
      {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
    </div>
  );
}
