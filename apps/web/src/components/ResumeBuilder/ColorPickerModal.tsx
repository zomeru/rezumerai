"use client";

import { Palette, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";

interface ColorPickerModalProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

export default function ColorPickerModal({ selectedColor, onChange }: ColorPickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(selectedColor);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempColor(selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const popularColors = ["#14B8A6", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#10B981", "#6366F1", "#EC4899"];

  const handleApply = () => {
    onChange(tempColor);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        title="Change accent color"
      >
        <Palette className="size-4 text-slate-600" />
        <div className="size-4 rounded border border-slate-300" style={{ backgroundColor: selectedColor }} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Pick a Color</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mb-4">
            <HexColorPicker color={tempColor} onChange={setTempColor} />
          </div>

          <div className="mb-4">
            <p className="mb-2 block font-medium text-slate-700 text-xs">Popular Colors</p>
            <div className="grid grid-cols-8 gap-2">
              {popularColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTempColor(color)}
                  className="size-6 rounded border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: tempColor === color ? "#1e293b" : "transparent",
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="hex-input" className="mb-1 block font-medium text-slate-700 text-xs">
              Hex Code
            </label>
            <input
              id="hex-input"
              type="text"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="#000000"
            />
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-lg bg-primary-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-primary-600"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
