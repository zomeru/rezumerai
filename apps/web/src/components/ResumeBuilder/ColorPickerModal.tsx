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

/**
 * Accessible color picker modal with keyboard support.
 * - Closes on Escape key
 * - Click outside to close
 * - Proper focus management
 */
export default function ColorPickerModal({ selectedColor, onChange }: ColorPickerModalProps): React.JSX.Element {
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

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus(); // Restore focus to trigger button
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return (): void => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = (): void => {
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

      return (): void => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
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
      return (): void => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const popularColors = ["#14B8A6", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#10B981", "#6366F1", "#EC4899"];

  const handleApply = (): void => {
    onChange(tempColor);
    setIsOpen(false);
    buttonRef.current?.focus(); // Return focus to trigger button
  };

  const handleClose = (): void => {
    setIsOpen(false);
    buttonRef.current?.focus(); // Return focus to trigger button
  };

  const modalContent = isOpen && (
    <div
      ref={modalRef}
      className="fixed z-9999 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
      style={{
        top: `${modalPosition.top}px`,
        left: `${modalPosition.left}px`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Color picker"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 id="color-picker-title" className="font-semibold text-slate-900 text-sm">
          Pick a Color
        </h3>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Close color picker"
        >
          <X className="size-4" />
        </button>
      </div>

      <fieldset className="mb-4 border-none p-0">
        <legend className="sr-only">Color Picker</legend>
        <HexColorPicker color={tempColor} onChange={setTempColor} />
      </fieldset>

      <fieldset className="mb-4 border-none p-0">
        <legend className="mb-2 block font-medium text-slate-700 text-xs">Popular Colors</legend>
        <div className="grid grid-cols-8 gap-2">
          {popularColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={(): void => setTempColor(color)}
              className="size-6 rounded border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              style={{
                backgroundColor: color,
                borderColor: tempColor === color ? "#1e293b" : "transparent",
              }}
              aria-label={`Select color ${color}`}
              aria-pressed={tempColor === color}
            />
          ))}
        </div>
      </fieldset>

      <div className="mb-4">
        <label htmlFor="hex-input" className="mb-1 block font-medium text-slate-700 text-xs">
          Hex Code
        </label>
        <input
          id="hex-input"
          type="text"
          value={tempColor}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setTempColor(e.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder="#000000"
          aria-describedby="hex-input-hint"
        />
        <span id="hex-input-hint" className="sr-only">
          Enter a hexadecimal color code
        </span>
      </div>

      <button
        type="button"
        onClick={handleApply}
        className="w-full rounded-lg bg-primary-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
        onClick={(): void => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        aria-label={`Change accent color. Current color: ${selectedColor}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Palette className="size-4 text-slate-600" />
        <div
          className="size-4 rounded border border-slate-300"
          style={{ backgroundColor: selectedColor }}
          aria-hidden="true"
        />
      </button>
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
