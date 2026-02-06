"use client";

import { format } from "date-fns";
import { Calendar, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePicker({
  selected,
  onSelect,
  placeholder = "Select date",
  disabled,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    onSelect(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      >
        <span className={selected ? "text-slate-900" : "text-slate-500"}>
          {selected && !Number.isNaN(selected.getTime()) ? format(selected, "MMM d, yyyy") : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selected && !disabled && (
            <X className="size-4 text-slate-400 transition-colors hover:text-slate-600" onClick={handleClear} />
          )}
          <Calendar className="size-4 text-slate-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
            captionLayout="dropdown"
            fromYear={1950}
            toYear={new Date().getFullYear() + 10}
            classNames={{
              day_button: "hover:bg-primary-100 rounded-md p-2 text-sm",
              selected: "bg-primary-500 text-white hover:bg-primary-600",
              today: "font-bold border border-primary-500",
              outside: "text-slate-300",
              disabled: "text-slate-300 cursor-not-allowed",
            }}
          />
        </div>
      )}
    </div>
  );
}
