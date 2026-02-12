"use client";

import { cn } from "@rezumerai/utils/styles";
import { Check, Type } from "lucide-react";
import { useState } from "react";
import type { FontSizePreset } from "@/constants/dummy";
import { useClickOutside } from "@/hooks/useClickOutside";

/**
 * Font size value - either a preset name or a custom numeric scale.
 */
export type FontSizeValue = FontSizePreset | number;

/**
 * Props for FontSizeSelector component.
 *
 * @property selectedSize - Currently selected font size
 * @property onChange - Callback when size changes
 */
export interface FontSizeSelectorProps {
  selectedSize: FontSizeValue;
  onChange: (size: FontSizeValue) => void;
}

/**
 * Available font size presets with metadata.
 * Displayed in the font size dropdown selector.
 */
const FONT_SIZES: { id: FontSizePreset; name: string; description: string; scale: number }[] = [
  {
    id: "small",
    name: "Small",
    description: "Compact text for more content",
    scale: 0.9,
  },
  {
    id: "medium",
    name: "Medium",
    description: "Balanced and readable",
    scale: 1,
  },
  {
    id: "large",
    name: "Large",
    description: "Enhanced readability",
    scale: 1.1,
  },
  {
    id: "custom",
    name: "Custom",
    description: "Enter your own size",
    scale: 1,
  },
];

/**
 * Mapping of font size presets to their numeric scale multipliers.
 * Used to convert preset names to actual scale values.
 */
export const FONT_SIZE_SCALES: Record<FontSizePreset, number> = {
  small: 0.9,
  medium: 1,
  large: 1.1,
  custom: 1,
};

/**
 * Converts a FontSizeValue to a numeric scale multiplier.
 * Returns the value directly if numeric, otherwise looks up preset scale.
 *
 * @param size - Font size preset or custom numeric value
 * @returns Numeric scale multiplier (e.g., 0.9, 1, 1.1)
 *
 * @example
 * ```ts
 * getFontScale('small') // => 0.9
 * getFontScale('medium') // => 1
 * getFontScale(1.25) // => 1.25
 * ```
 */
export function getFontScale(size: FontSizeValue): number {
  if (typeof size === "number") {
    return size;
  }
  return FONT_SIZE_SCALES[size];
}

/**
 * Dropdown selector for resume font size with preset and custom options.
 * Allows users to choose from small/medium/large presets or enter a custom scale.
 *
 * @param props - FontSizeSelector configuration
 * @returns Font size dropdown selector component
 *
 * @example
 * ```tsx
 * <FontSizeSelector
 *   selectedSize="medium"
 *   onChange={(size) => updateResume({ fontSize: size })}
 * />
 * ```
 */
export default function FontSizeSelector({ selectedSize, onChange }: FontSizeSelectorProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState<string>(
    typeof selectedSize === "number" ? selectedSize.toString() : "1",
  );
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const isCustomSelected = typeof selectedSize === "number";
  const currentPreset = isCustomSelected ? "custom" : selectedSize;

  function onSizeChange(size: FontSizePreset): void {
    if (size === "custom") {
      const numValue = Number.parseFloat(customValue);
      if (!Number.isNaN(numValue) && numValue > 0) {
        onChange(numValue);
      }
    } else {
      setCustomValue("1");
      onChange(size);
      setIsOpen(false);
    }
  }

  function handleCustomChange(value: string): void {
    setCustomValue(value);
    const numValue = Number.parseFloat(value);
    if (!Number.isNaN(numValue) && numValue > 0) {
      onChange(numValue);
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-lg bg-linear-to-br from-secondary-50 to-secondary-100 px-3 py-2 text-secondary-600 text-sm ring-secondary-300 transition-all hover:ring"
        onClick={(): void => setIsOpen((prev) => !prev)}
      >
        <Type size={14} />
        <span className="max-sm:hidden">Size</span>
      </button>
      {isOpen && (
        <div className="absolute top-full z-10 mt-2 w-56 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          {FONT_SIZES.map(({ id, name, description }) => (
            <div key={id}>
              <button
                type="button"
                onClick={(): void => onSizeChange(id)}
                className={cn(
                  "relative w-full cursor-pointer rounded-lg border p-3 text-left transition-all",
                  currentPreset === id
                    ? "border-secondary-400 bg-secondary-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {currentPreset === id && (
                  <div className="absolute top-2 right-2">
                    <div className="flex size-5 items-center justify-center rounded-full bg-secondary-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
                <div className="space-y-0.5">
                  <h4 className="font-medium text-slate-800 text-sm">{name}</h4>
                  <p className="text-slate-500 text-xs">{description}</p>
                </div>
              </button>
              {id === "custom" && currentPreset === "custom" && (
                <div className="mt-2 space-y-2">
                  <label htmlFor="custom-font-size" className="block font-medium text-slate-600 text-xs">
                    Scale (e.g., 0.8 to 1.5)
                  </label>
                  <input
                    id="custom-font-size"
                    type="number"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={customValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void => handleCustomChange(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-200"
                    onClick={(e: React.MouseEvent<HTMLInputElement>): void => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
