"use client";

import { cn } from "@rezumerai/utils/styles";
import { forwardRef, useEffect, useRef, useState } from "react";
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
      const updateScale = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth;
          const calculatedScale = Math.min(1, (containerWidth - 32) / LETTER_WIDTH_PX); // 32px for padding
          setScale(calculatedScale);
        }
      };

      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }, []);

    return (
      <div ref={containerRef} className="flex w-full items-center justify-center rounded-lg bg-slate-100 p-4">
        {/* Container maintains aspect ratio and scales content to fit */}
        <div
          className="relative"
          style={{
            width: `${LETTER_WIDTH_PX * scale}px`,
            height: `${LETTER_HEIGHT_PX * scale}px`,
          }}
        >
          <div
            ref={ref}
            id="resume-preview"
            className={cn(
              "origin-top-left overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm print:border-none print:shadow-none",
              className,
            )}
            style={{
              width: `${LETTER_WIDTH_PX}px`,
              height: `${LETTER_HEIGHT_PX}px`,
              transform: `scale(${scale})`,
            }}
          >
            <RenderTemplate template={template} data={data} accentColor={accentColor} fontSize={fontSize} />
          </div>
        </div>
      </div>
    );
  },
);

ResumePreview.displayName = "ResumePreview";

export default ResumePreview;
export { LETTER_WIDTH_PX, LETTER_HEIGHT_PX };
