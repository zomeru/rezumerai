import { cn } from "@rezumerai/utils/styles";
import type { InputHTMLAttributes } from "react";

/**
 * Props for the FormField component.
 * Extends native HTML input attributes with a simplified change handler.
 *
 * @property onValueChange - Callback with the new input value string
 */
export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onValueChange: (value: string) => void;
}

/**
 * Minimal form input field with value-change callback.
 * Lightweight alternative to TextInput without label support.
 *
 * @param props - Input configuration with value change handler
 * @returns Styled input element
 *
 * @example
 * ```tsx
 * <FormField
 *   value={fieldName}
 *   onValueChange={setFieldName}
 *   placeholder="Enter value"
 * />
 * ```
 */

export default function FormField({ onValueChange, className, type = "text", ...props }: FormFieldProps) {
  return (
    <input
      {...props}
      type={type}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange(e.target.value);
        props.onChange?.(e);
      }}
      className={cn("rounded-lg px-3 py-2 text-sm", className)}
    />
  );
}
