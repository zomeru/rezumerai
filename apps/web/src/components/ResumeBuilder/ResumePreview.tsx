"use client";

import { cn } from "@rezumerai/utils/styles";
import type { Resume } from "@/constants/dummy";
import { ClassicTemplate, MinimalImageTemplate, MinimalTemplate, ModernTemplate, type TemplateType } from "@/templates";

interface ResumePreviewProps {
  data: Resume;
  template: TemplateType;
  accentColor: string;
  className?: string;
}

function RenderTemplate({ template, data, accentColor }: Omit<ResumePreviewProps, "className">) {
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
}

export default function ResumePreview({ data, template, accentColor, className }: ResumePreviewProps) {
  return (
    <div className="w-full bg-gray-100">
      <div className={cn("border border-gray-200 print:border-none print:shadow-none", className)}>
        <RenderTemplate template={template} data={data} accentColor={accentColor} />
      </div>
      <style jsx>
        {`
          @page {
            size: letter;
            margin: 0;
          }

          @media print {
            html, body {
              width: 8.5in;
              height: 11in;
              overflow: hidden;
            }

            body * {
              visibility: hidden;
            }

            #resume-preview, #resume-preview * {
              visibility: visible;
            }

            #resume-preview {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: auto;
              margin: 0;
              padding: 0;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
