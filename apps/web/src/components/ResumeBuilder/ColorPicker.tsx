"use client";

import { Check, Palette } from "lucide-react";
import { useState } from "react";

const COLORS = [
  { name: "Blue", value: "#3b62f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Green", value: "#10b981" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7820" },
  { name: "Black", value: "#1f2937" },
];

interface ColorPickerProps {
  selectedColor?: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ selectedColor, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1 rounded-lg bg-linear-to-br from-primary-50 to-primary-100 px-3 py-2 text-secondary-600 text-sm ring-primary-300 hover:ring-transition-all"
      >
        <Palette size={16} /> <span className="max-sm:hidden">Accent</span>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-10 mt-2 grid w-60 grid-cols-4 gap-2 rounded-md border border-gray-200 bg-white p-3 shadow-sm">
          {COLORS.map(({ name, value }) => {
            return (
              <button
                type="button"
                key={value}
                className="group relative flex cursor-pointer flex-col"
                onClick={() => {
                  onChange(value);
                  setIsOpen(false);
                }}
              >
                <div
                  className="h-12 w-12 rounded-full border-2 border-transparent transition-colors group-hover:border-black/25"
                  style={{
                    backgroundColor: value,
                  }}
                ></div>
                {selectedColor === value && (
                  <div className="absolute top-0 right-0 bottom-4.5 left-0 flex items-center justify-center">
                    <Check className="size-5 text-white" />
                  </div>
                )}
                <p className="mt-1 text-center text-gray-600 text-xs">{name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
