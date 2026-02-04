"use client";

import { Palette, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { createPortal } from "react-dom";

interface ModalPosition {
  top: number;
  left: number;
}

interface ColorPickerModalProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

export default function ColorPickerModal({ selectedColor, onChange }: ColorPickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(selectedColor);
  const [modalPosition, setModalPosition] = useState<ModalPosition>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTempColor(selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const buttonRect = buttonRef.current?.getBoundingClientRect();
        if (!buttonRect) return;

        const modalWidth = 256; // w-64 = 16rem = 256px
        const modalHeight = 400; // approximate height
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = buttonRect.left;
        let top = buttonRect.bottom + 8; // 8px gap

        // Adjust horizontal position if modal would overflow
        if (left + modalWidth > viewportWidth) {
          left = Math.max(8, viewportWidth - modalWidth - 8);
        }

        // Adjust vertical position if modal would overflow
        if (top + modalHeight > viewportHeight) {
          top = Math.max(8, buttonRect.top - modalHeight - 8);
        }

        setModalPosition({ top, left });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const popularColors = ["#14B8A6", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#10B981", "#6366F1", "#EC4899"];

  const handleApply = () => {
    onChange(tempColor);
    setIsOpen(false);
  };

  const modalContent = isOpen && (
    <div
      ref={modalRef}
      className="fixed z-[9999] w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
      style={{
        top: `${modalPosition.top}px`,
        left: `${modalPosition.left}px`,
      }}
    >
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
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        title="Change accent color"
      >
        <Palette className="size-4 text-slate-600" />
        <div className="size-4 rounded border border-slate-300" style={{ backgroundColor: selectedColor }} />
      </button>
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
