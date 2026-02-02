"use client";

import { cn } from "@rezumerai/utils/styles";
import { Check, Type } from "lucide-react";
import { useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

export type FontSizeOption = "small" | "medium" | "large";

interface FontSizeSelectorProps {
  selectedSize: FontSizeOption;
  onChange: (size: FontSizeOption) => void;
}

const FONT_SIZES: { id: FontSizeOption; name: string; description: string; scale: number }[] = [
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
];

export const FONT_SIZE_SCALES: Record<FontSizeOption, number> = {
  small: 0.9,
  medium: 1,
  large: 1.1,
};

export default function FontSizeSelector({ selectedSize, onChange }: FontSizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  function onSizeChange(size: FontSizeOption) {
    onChange(size);
    setIsOpen(false);
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-lg bg-linear-to-br from-secondary-50 to-secondary-100 px-3 py-2 text-secondary-600 text-sm ring-secondary-300 transition-all hover:ring"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Type size={14} />
        <span className="max-sm:hidden">Size</span>
      </button>
      {isOpen && (
        <div className="absolute top-full z-10 mt-2 w-56 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          {FONT_SIZES.map(({ id, name, description }) => (
            <button
              type="button"
              key={id}
              onClick={() => onSizeChange(id)}
              className={cn(
                "relative w-full cursor-pointer rounded-lg border p-3 text-left transition-all",
                selectedSize === id
                  ? "border-secondary-400 bg-secondary-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {selectedSize === id && (
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
          ))}
        </div>
      )}
    </div>
  );
}
