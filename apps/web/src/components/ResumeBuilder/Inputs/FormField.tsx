import { cn } from "@rezumerai/utils/styles";
import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onValueChange: (value: string) => void;
}

export default function FormField({ onValueChange, className, type = "text", ...props }: FormFieldProps) {
  return (
    <input
      {...props}
      type={type}
      onChange={(e) => {
        onValueChange(e.target.value);
        props.onChange?.(e);
      }}
      className={cn("rounded-lg px-3 py-2 text-sm", className)}
    />
  );
}
