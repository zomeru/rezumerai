"use client";

import { cn } from "@rezumerai/utils/styles";
import { Check, Layout } from "lucide-react";
import { useState } from "react";
import { TEMPLATES } from "@/constants/templates";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { TemplateType } from "@/templates";

/**
 * Props for the TemplateSelector component.
 *
 * @property selectedTemplate - Currently active template identifier
 * @property onChange - Callback when a new template is selected
 */
export interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  onChange: (template: TemplateType) => void;
}

/**
 * Dropdown template selector for choosing resume layout styles.
 * Displays template names with preview descriptions and checkmark for active selection.
 *
 * @param props - Template selector configuration
 * @returns Template selection dropdown button
 *
 * @example
 * ```tsx
 * <TemplateSelector
 *   selectedTemplate="modern"
 *   onChange={(template) => updateResume({ template })}
 * />
 * ```
 */

export default function TemplateSelector({ selectedTemplate, onChange }: TemplateSelectorProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  function onTemplateChange(template: TemplateType): void {
    onChange(template);
    setIsOpen(false);
  }

  function toggleDropdown(): void {
    setIsOpen((prev) => !prev);
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-lg bg-linear-to-br from-primary-50 to-primary-100 px-3 py-2 text-primary-600 text-sm ring-primary-300 transition-all hover:ring"
        onClick={toggleDropdown}
      >
        <Layout size={14} />
        <span className="max-sm:hidden">Template</span>
      </button>
      {isOpen && (
        <div className="absolute top-full z-10 mt-2 w-xs space-y-3 rounded-md border border-slate-200 bg-white p-3 shadow-md">
          {TEMPLATES.map(({ id, name, preview }) => {
            return (
              <button
                type="button"
                key={id}
                onClick={(): void => {
                  onTemplateChange(id);
                }}
                className={cn(
                  "relative cursor-pointer rounded-md border p-3 transition-all",
                  selectedTemplate === id
                    ? "border-primary-400 bg-primary-100"
                    : "border-slate-300 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {selectedTemplate === id && (
                  <div className="absolute top-2 right-2">
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary-400">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="font-medium text-slate-800">{name}</h4>
                  <div className="mt-2 rounded bg-primary-50 p-2 text-slate-500 text-xs italic">{preview}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
