"use client";

import { cn } from "@rezumerai/utils/styles";
import { Check, ChevronDown } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const DROPDOWN_OFFSET = 6;
const DROPDOWN_PADDING = 8;
const MIN_DROPDOWN_HEIGHT = 120;

function findFirstEnabledIndex(options: SelectOption[]): number {
  return options.findIndex((option) => !option.disabled);
}

function findEnabledIndexFrom(options: SelectOption[], startIndex: number, direction: 1 | -1): number {
  if (options.length === 0) return -1;

  let cursor = startIndex;
  for (let steps = 0; steps < options.length; steps += 1) {
    cursor = (cursor + direction + options.length) % options.length;
    if (!options[cursor]?.disabled) {
      return cursor;
    }
  }

  return -1;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  error,
}: SelectProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
  });
  const [isPositionedAbove, setIsPositionedAbove] = useState<boolean>(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const lockedDropdownMetricsRef = useRef<{ isPositionedAbove: boolean; maxHeight: number } | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  const controlId = useId();
  const labelId = `${controlId}-label`;
  const triggerId = `${controlId}-trigger`;
  const listboxId = `${controlId}-listbox`;
  const errorId = `${controlId}-error`;

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) ?? null;
  }, [options, value]);

  const hasSelectableOptions = useMemo(() => {
    return options.some((option) => !option.disabled);
  }, [options]);

  function closeDropdown(restoreFocus: boolean): void {
    setIsOpen(false);
    setActiveIndex(-1);
    lockedDropdownMetricsRef.current = null;
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }

    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  function openDropdown(): void {
    if (disabled || !hasSelectableOptions) return;

    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
    const nextActiveIndex = selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(options);
    setActiveIndex(nextActiveIndex);
    setIsOpen(true);
  }

  function toggleDropdown(): void {
    if (isOpen) {
      closeDropdown(false);
      return;
    }
    openDropdown();
  }

  function selectIndex(index: number): void {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    closeDropdown(true);
  }

  function updateDropdownPosition(lockMetrics: boolean, commitState: boolean): void {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom - DROPDOWN_PADDING;
    const spaceAbove = rect.top - DROPDOWN_PADDING;

    if (lockMetrics || !lockedDropdownMetricsRef.current) {
      const shouldOpenAbove = spaceBelow < MIN_DROPDOWN_HEIGHT && spaceAbove > spaceBelow;
      const availableSpace = Math.max(
        80,
        shouldOpenAbove ? spaceAbove - DROPDOWN_OFFSET : spaceBelow - DROPDOWN_OFFSET,
      );
      const maxHeight = Math.min(320, availableSpace);

      lockedDropdownMetricsRef.current = {
        isPositionedAbove: shouldOpenAbove,
        maxHeight,
      };
    }

    const lockedMetrics = lockedDropdownMetricsRef.current;
    if (!lockedMetrics) return;

    const top = lockedMetrics.isPositionedAbove
      ? Math.max(DROPDOWN_PADDING, rect.top - lockedMetrics.maxHeight - DROPDOWN_OFFSET)
      : rect.bottom + DROPDOWN_OFFSET;

    const nextPosition: DropdownPosition = {
      top: Math.round(top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      maxHeight: lockedMetrics.maxHeight,
    };

    if (!commitState && listRef.current) {
      listRef.current.style.top = `${nextPosition.top}px`;
      listRef.current.style.left = `${nextPosition.left}px`;
      listRef.current.style.width = `${nextPosition.width}px`;
      return;
    }

    setIsPositionedAbove(lockedMetrics.isPositionedAbove);
    setPosition(nextPosition);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
          return;
        }
        setActiveIndex((current) => findEnabledIndexFrom(options, current < 0 ? -1 : current, 1));
        return;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
          return;
        }
        setActiveIndex((current) => findEnabledIndexFrom(options, current < 0 ? 0 : current, -1));
        return;
      }
      case "Home": {
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(findFirstEnabledIndex(options));
        return;
      }
      case "End": {
        if (!isOpen) return;
        event.preventDefault();
        const firstFromEnd = findEnabledIndexFrom(options, 0, -1);
        setActiveIndex(firstFromEnd);
        return;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
          return;
        }
        if (activeIndex >= 0) {
          selectIndex(activeIndex);
        }
        return;
      }
      case "Escape": {
        if (!isOpen) return;
        event.preventDefault();
        closeDropdown(true);
        return;
      }
      case "Tab": {
        if (isOpen) {
          closeDropdown(false);
        }
        return;
      }
      default:
        return;
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition(true, true);

    function handleOutsidePointerDown(event: MouseEvent): void {
      if (!(event.target instanceof Node)) {
        return;
      }

      const target = event.target;

      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;

      closeDropdown(false);
    }

    function handleWindowResize(): void {
      updateDropdownPosition(true, true);
    }

    function handleWindowScroll(): void {
      if (scrollFrameRef.current !== null) return;

      scrollFrameRef.current = requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updateDropdownPosition(false, false);
      });
    }

    document.addEventListener("mousedown", handleOutsidePointerDown);
    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("scroll", handleWindowScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsidePointerDown);
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("scroll", handleWindowScroll, true);
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [isOpen, value, options]);

  const dropdownStyle: CSSProperties = {
    position: "fixed",
    top: position.top,
    left: position.left,
    width: position.width,
    maxHeight: position.maxHeight,
    zIndex: 80,
  };

  return (
    <div className="w-full">
      {label && (
        <span id={labelId} className="mb-1.5 block font-medium text-slate-700 text-sm">
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
        aria-label={label ? undefined : placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm shadow-sm transition-all",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
          disabled
            ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500"
            : "border-slate-300 bg-white text-slate-900 hover:border-slate-400",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-500")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {error && (
        <p id={errorId} className="mt-1.5 text-red-600 text-xs">
          {error}
        </p>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={listRef}
            style={dropdownStyle}
            className={cn(
              "overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl",
              isPositionedAbove ? "origin-bottom" : "origin-top",
            )}
            role="listbox"
            id={listboxId}
            aria-labelledby={label ? labelId : undefined}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <button
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  disabled={option.disabled}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setActiveIndex(index);
                    }
                  }}
                  onMouseDown={(event) => {
                    // Keep focus on trigger for proper combobox keyboard behavior.
                    event.preventDefault();
                  }}
                  onClick={() => selectIndex(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                    option.disabled && "cursor-not-allowed text-slate-400",
                    !option.disabled && "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    isActive && !option.disabled && "bg-primary-50 text-primary-900",
                    isSelected && !option.disabled && "font-medium text-primary-800",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
