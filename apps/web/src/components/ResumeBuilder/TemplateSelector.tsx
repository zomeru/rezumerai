"use client";

import { cn } from "@rezumerai/utils/styles";
import { Check, Layout } from "lucide-react";
import { useState } from "react";
import type { TemplateType } from "@/templates";

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  onChange: (template: TemplateType) => void;
}

const TEMPLATES: { id: TemplateType; name: string; preview: string }[] = [
  {
    id: "classic",
    name: "Classic",
    preview: "A timeless resume layout with well-defined sections and professional typography.",
  },
  {
    id: "modern",
    name: "Modern",
    preview: "A sleek, contemporary design featuring bold accents and clean font choices.",
  },
  {
    id: "minimal-image",
    name: "Minimal with Image",
    preview: "A refined, minimal layout that highlights your profile image and key details.",
  },
  {
    id: "minimal",
    name: "Minimal",
    preview: "An ultra-clean, content-focused design that keeps the spotlight on your achievements.",
  },
];

export default function TemplateSelector({ selectedTemplate, onChange }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  function onTemplateChange(template: TemplateType) {
    onChange(template);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-lg bg-linear-to-br from-primary-50 to-primary-100 px-3 py-2 text-primary-600 text-sm ring-primary-300 transition-all hover:ring"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Layout size={14} />
        <span className="max-sm:hidden">Template</span>
      </button>
      {isOpen && (
        <div className="absolute top-full z-10 mt-2 w-xs space-y-3 rounded-md border border-gray-200 bg-white p-3 shadow-md">
          {TEMPLATES.map(({ id, name, preview }) => {
            return (
              <button
                type="button"
                key={id}
                onClick={() => {
                  onTemplateChange(id);
                }}
                className={cn(
                  "relative cursor-pointer rounded-md border p-3 transition-all",
                  selectedTemplate === id
                    ? "border-primary-400 bg-primary-100"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-100",
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
                  <h4 className="font-medium text-gray-800">{name}</h4>
                  <div className="mt-2 rounded bg-primary-50 p-2 text-gray-500 text-xs italic">{preview}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
