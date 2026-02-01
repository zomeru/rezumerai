"use client";

import { cn } from "@rezumerai/utils/styles";
import { forwardRef } from "react";
import type { Resume } from "@/constants/dummy";
import { ClassicTemplate, MinimalImageTemplate, MinimalTemplate, ModernTemplate, type TemplateType } from "@/templates";
import { FONT_SIZE_SCALES, type FontSizeOption } from "./FontSizeSelector";

// US Letter size: 8.5 × 11 inches at 96 DPI (standard web DPI)
const LETTER_WIDTH_PX = 816; // 8.5 * 96
const LETTER_HEIGHT_PX = 1056; // 11 * 96

interface ResumePreviewProps {
  data: Resume;
  template: TemplateType;
  accentColor: string;
  className?: string;
  fontSize?: FontSizeOption;
}

interface RenderTemplateProps {
  template: TemplateType;
  data: Resume;
  accentColor: string;
  fontSize?: FontSizeOption;
}

function RenderTemplate({ template, data, accentColor, fontSize = "medium" }: RenderTemplateProps) {
  const fontScale = FONT_SIZE_SCALES[fontSize];
  const style = { fontSize: `${fontScale}rem` };

  const templateContent = (() => {
    switch (template) {
      case "modern":
        return <ModernTemplate data={data} accentColor={accentColor} />;
      case "minimal":
        return <MinimalTemplate data={data} accentColor={accentColor} />;
      case "minimal-image":
        return <MinimalImageTemplate data={data} accentColor={accentColor} />;
      default:
        return <ClassicTemplate data={data} accentColor={accentColor} />;
    }
  })();

  return <div style={style}>{templateContent}</div>;
}

const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data, template, accentColor, className, fontSize = "medium" }, ref) => {
    return (
      <div className="flex w-full items-center justify-center overflow-auto rounded-lg bg-slate-100 p-4">
        {/* Fixed dimensions container - exactly 8.5 × 11 inches */}
        <div
          ref={ref}
          id="resume-preview"
          className={cn(
            "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print:border-none print:shadow-none",
            className,
          )}
          style={{
            width: `${LETTER_WIDTH_PX}px`,
            height: `${LETTER_HEIGHT_PX}px`,
            minWidth: `${LETTER_WIDTH_PX}px`,
            minHeight: `${LETTER_HEIGHT_PX}px`,
          }}
        >
          <RenderTemplate template={template} data={data} accentColor={accentColor} fontSize={fontSize} />
        </div>
      </div>
    );
  },
);

ResumePreview.displayName = "ResumePreview";

export default ResumePreview;
export { LETTER_WIDTH_PX, LETTER_HEIGHT_PX };
