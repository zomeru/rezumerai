"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ResumePreview } from "@/components/ResumeBuilder";
import type { Resume } from "@/constants/dummy";
import { downloadPdfBlob, generatePdfFromElement } from "@/lib/pdfUtils";

/**
 * Props for the {@link DownloadResumeModal} component.
 *
 * @property resume - The resume data to render and download
 * @property isOpen - Whether the download modal is visible
 * @property onClose - Callback to close the modal after download completes
 */
export interface DownloadResumeModalProps {
  resume: Resume;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal that renders a resume in a hidden container and generates a PDF for download.
 *
 * Automatically starts PDF generation when opened and triggers a browser download
 * on success. Displays progress, success, and error states.
 *
 * @param props - {@link DownloadResumeModalProps}
 * @returns The download modal or `null` when closed
 *
 * @example
 * ```tsx
 * <DownloadResumeModal resume={resume} isOpen={showDownload} onClose={close} />
 * ```
 */
export default function DownloadResumeModal({ resume, isOpen, onClose }: DownloadResumeModalProps) {
  const [status, setStatus] = useState<"generating" | "success" | "error">("generating");
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const hasDownloadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasDownloadedRef.current = false;
      return;
    }

    // Prevent duplicate downloads in StrictMode
    if (hasDownloadedRef.current) return;
    hasDownloadedRef.current = true;

    async function generateAndDownload(): Promise<void> {
      setStatus("generating");
      setError(null);

      // Wait for the resume to render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!previewRef.current) {
        setError("Failed to render resume preview");
        setStatus("error");
        return;
      }

      try {
        const element = previewRef.current;
        const blob = await generatePdfFromElement(element);

        if (!blob) {
          throw new Error("Failed to generate PDF blob");
        }

        // Generate filename and download
        const fileName = resume.personalInfo.fullName
          ? `Resume_${resume.personalInfo.fullName.replace(/\s+/g, "_")}.pdf`
          : `Resume_${resume.title.replace(/\s+/g, "_")}.pdf`;

        downloadPdfBlob(blob, fileName, () => {
          setTimeout(onClose, 1000);
        });

        setStatus("success");
        // Auto-close after success
      } catch (err) {
        console.error("Error generating PDF:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    }

    generateAndDownload();
  }, [isOpen, resume, onClose]);

  if (!isOpen) return null;

  const template = resume.template || "classic";
  const accentColor = resume.accentColor || "#4B5563";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal content */}
      <div className="rounded-xl bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          {status === "generating" && (
            <>
              <Loader2 className="size-8 animate-spin text-primary-500" />
              <p className="text-slate-600">Generating PDF...</p>
            </>
          )}
          {status === "success" && <p className="font-medium text-green-600">Download started!</p>}
          {status === "error" && (
            <>
              <p className="font-medium text-red-600">Failed to generate PDF</p>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden resume preview for PDF generation */}
      <div className="pointer-events-none absolute" style={{ left: "-9999px", top: 0 }}>
        <ResumePreview
          ref={previewRef}
          data={resume}
          template={template}
          accentColor={accentColor}
          fontSize="medium" // TODO: add font size to resume information (database)
          previewMode="html"
        />
      </div>
    </div>
  );
}
