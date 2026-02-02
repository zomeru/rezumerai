"use client";

import { cn } from "@rezumerai/utils/styles";
import { ChevronDown, ChevronUp } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { Resume } from "@/constants/dummy";
import type { PreviewMode } from "@/hooks/usePdfGenerator";
import { ClassicTemplate, MinimalImageTemplate, MinimalTemplate, ModernTemplate, type TemplateType } from "@/templates";
import { type FontSizeValue, getFontScale } from "./FontSizeSelector";

// US Letter size: 8.5 × 11 inches at 96 DPI (standard web DPI)
const LETTER_WIDTH_PX = 816; // 8.5 * 96
const LETTER_HEIGHT_PX = 1056; // 11 * 96

interface ResumePreviewProps {
  data: Resume;
  template: TemplateType;
  accentColor: string;
  className?: string;
  fontSize?: FontSizeValue;
  previewMode: PreviewMode;
}

interface RenderTemplateProps {
  template: TemplateType;
  data: Resume;
  accentColor: string;
  fontSize?: FontSizeValue;
}

function RenderTemplate({ template, data, accentColor, fontSize = "medium" }: RenderTemplateProps) {
  const fontScale = getFontScale(fontSize);
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
  ({ data, template, accentColor, className, fontSize = "medium", previewMode }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      const updateScale = () => {
        if (containerRef.current) {
          // Use clientWidth (excludes scrollbar) for accurate measurement
          const containerWidth = containerRef.current.clientWidth;
          // Account for padding (16px on each side = 32px total)
          const availableWidth = containerWidth - 32;
          const calculatedScale = Math.min(1, availableWidth / LETTER_WIDTH_PX);
          setScale(calculatedScale);
        }
      };

      updateScale();
      // Use setTimeout to ensure layout is settled after DOM updates
      const timeoutId = setTimeout(updateScale, 100);
      window.addEventListener("resize", updateScale);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("resize", updateScale);
      };
    }, [previewMode]);

    // Calculate total pages based on content height
    useEffect(() => {
      const calculatePages = () => {
        if (contentRef.current) {
          const contentHeight = contentRef.current.scrollHeight;
          const pages = Math.ceil(contentHeight / LETTER_HEIGHT_PX);
          setTotalPages(pages);
          // Reset to first page if current page exceeds total
          if (currentPage >= pages) {
            setCurrentPage(0);
          }
        }
      };

      calculatePages();
      const timeoutId = setTimeout(calculatePages, 200);
      return () => clearTimeout(timeoutId);
    }, [data, template, accentColor, fontSize, currentPage]);

    const goToNextPage = () => {
      if (currentPage < totalPages - 1) {
        setCurrentPage((prev) => prev + 1);
      }
    };

    const goToPrevPage = () => {
      if (currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      }
    };

    return (
      // biome-ignore lint/a11y/useSemanticElements: div is needed for styling and ref forwarding
      <div
        ref={containerRef}
        className="relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Resume preview"
      >
        {/* Page navigation buttons - Up/Down at top right */}
        {totalPages > 1 && isHovered && (
          <>
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
              {currentPage > 0 && (
                <button
                  type="button"
                  onClick={goToPrevPage}
                  className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-white to-slate-50 shadow-xl ring-1 ring-slate-200/50 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:ring-slate-300/70 active:scale-95"
                  aria-label="Previous page"
                >
                  <ChevronUp className="size-5 text-slate-700" strokeWidth={2.5} />
                </button>
              )}
              {currentPage < totalPages - 1 && (
                <button
                  type="button"
                  onClick={goToNextPage}
                  className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-white to-slate-50 shadow-xl ring-1 ring-slate-200/50 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:ring-slate-300/70 active:scale-95"
                  aria-label="Next page"
                >
                  <ChevronDown className="size-5 text-slate-700" strokeWidth={2.5} />
                </button>
              )}
            </div>
            {/* Page indicator */}
            <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-slate-900/90 to-slate-800/90 px-4 py-2 font-medium text-sm text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md">
              Page {currentPage + 1} of {totalPages}
            </div>
          </>
        )}

        {/* Container scales content to fit and shows one page at a time */}
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{
            width: `${LETTER_WIDTH_PX * scale}px`,
            height: `${LETTER_HEIGHT_PX * scale}px`,
          }}
        >
          <div
            ref={ref}
            id="resume-preview"
            className={cn(
              "origin-top-left overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm print:border-none print:shadow-none",
              className,
            )}
            style={{
              width: `${LETTER_WIDTH_PX}px`,
              minHeight: `${LETTER_HEIGHT_PX}px`,
              transform: `scale(${scale}) translateY(-${currentPage * LETTER_HEIGHT_PX}px)`,
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <div ref={contentRef}>
              <RenderTemplate template={template} data={data} accentColor={accentColor} fontSize={fontSize} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ResumePreview.displayName = "ResumePreview";

export default ResumePreview;
export { LETTER_WIDTH_PX, LETTER_HEIGHT_PX };
