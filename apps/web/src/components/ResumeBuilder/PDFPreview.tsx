"use client";

import { PDFViewer } from "@react-pdf/renderer";
import type { Resume } from "@/constants/dummy";
import PDFDocument from "./PDFDocument";

interface PDFPreviewProps {
  data: Resume;
  accentColor: string;
  className?: string;
}

export default function PDFPreview({ data, accentColor, className }: PDFPreviewProps) {
  return (
    <div className={className}>
      <PDFViewer
        width="100%"
        height="100%"
        showToolbar={false}
        className="rounded-lg border border-slate-200"
        style={{ minHeight: "800px" }}
      >
        <PDFDocument data={data} accentColor={accentColor} />
      </PDFViewer>
    </div>
  );
}
