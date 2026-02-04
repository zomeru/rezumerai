import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FontSizeValue } from "@/components/ResumeBuilder";
import type { Resume } from "@/constants/dummy";
import { downloadPdfBlob, generatePdfFromElement } from "@/lib/pdfUtils";

export type PreviewMode = "html" | "pdf";

interface UsePdfGeneratorProps {
  resumeData: Resume;
  previewMode: PreviewMode;
  resumePreviewRef: React.RefObject<HTMLDivElement | null>;
  fontSize: FontSizeValue;
  accentColor?: string;
}

interface UsePdfGeneratorReturn {
  pdfBlob: Blob | null;
  isGeneratingPdf: boolean;
  isExporting: boolean;
  generatePdfFromHtml: () => Promise<Blob | null>;
  downloadResume: () => Promise<void>;
  dataHash: string;
}

/**
 * Generates a hash from resume data, font size, and accent color
 * Used to determine if PDF regeneration is needed
 */
function generateDataHash(resumeData: Resume, fontSize: FontSizeValue, accentColor?: string): string {
  const hashData = JSON.stringify({
    personalInfo: resumeData.personalInfo,
    professionalSummary: resumeData.professionalSummary,
    experience: resumeData.experience,
    education: resumeData.education,
    project: resumeData.project,
    skills: resumeData.skills,
    template: resumeData.template,
    fontSize,
    accentColor,
  });
  // Simple hash function - sufficient for change detection
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Cache to persist PDF blobs across mode switches
interface PDFCache {
  blob: Blob;
  dataHash: string;
}
const pdfCache: { current: PDFCache | null } = { current: null };

/**
 * Custom hook to handle PDF generation from HTML resume preview
 * Manages PDF blob state, generation process, and download functionality
 *
 * Features:
 * - Hash-based caching: Only regenerates when resume data actually changes
 * - Persists cache across HTML/PDF mode switches
 * - Debounced regeneration for performance
 */
export function usePdfGenerator({
  resumeData,
  previewMode,
  resumePreviewRef,
  fontSize,
  accentColor,
}: UsePdfGeneratorProps): UsePdfGeneratorReturn {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const hasGeneratedRef = useRef(false);
  const lastHashRef = useRef<string | null>(null);

  // Compute hash of current resume data for cache comparison
  const dataHash = useMemo(
    () => generateDataHash(resumeData, fontSize, accentColor),
    [resumeData, fontSize, accentColor],
  );

  // Generate PDF from HTML preview (source of truth)
  const generatePdfFromHtml = useCallback(async (): Promise<Blob | null> => {
    if (!resumePreviewRef.current) {
      console.error("Resume preview ref is null");
      return null;
    }

    return generatePdfFromElement(resumePreviewRef.current);
  }, [resumePreviewRef]);

  // Check for cached PDF on mode switch - use cache if hash matches
  useEffect(() => {
    if (previewMode === "pdf" && !isGeneratingPdf) {
      // Check if we have a cached PDF with matching hash
      if (pdfCache.current && pdfCache.current.dataHash === dataHash) {
        // Use cached PDF - no regeneration needed
        if (!pdfBlob || lastHashRef.current !== dataHash) {
          setPdfBlob(pdfCache.current.blob);
          lastHashRef.current = dataHash;
        }
        return;
      }

      // No valid cache - generate new PDF
      if (!hasGeneratedRef.current || lastHashRef.current !== dataHash) {
        hasGeneratedRef.current = true;
        lastHashRef.current = dataHash;
        setIsGeneratingPdf(true);
        generatePdfFromHtml()
          .then((blob) => {
            if (blob) {
              setPdfBlob(blob);
              // Store in cache
              pdfCache.current = { blob, dataHash };
            } else {
              console.error("Failed to generate PDF: blob is null");
            }
          })
          .catch((error) => {
            console.error("Error in PDF generation:", error);
          })
          .finally(() => {
            setIsGeneratingPdf(false);
          });
      }
    }
  }, [previewMode, dataHash, isGeneratingPdf, generatePdfFromHtml, pdfBlob]);

  // Regenerate PDF when resume data actually changes (detected via hash)
  useEffect(() => {
    // Only regenerate if we're in PDF mode, have a cached PDF, and hash has changed
    if (previewMode === "pdf" && pdfBlob && !isGeneratingPdf && lastHashRef.current !== dataHash) {
      const timeoutId = setTimeout(() => {
        lastHashRef.current = dataHash;
        setIsGeneratingPdf(true);
        generatePdfFromHtml()
          .then((blob) => {
            if (blob) {
              setPdfBlob(blob);
              // Update cache with new PDF
              pdfCache.current = { blob, dataHash };
            } else {
              console.error("Failed to regenerate PDF: blob is null");
            }
          })
          .catch((error) => {
            console.error("Error in PDF regeneration:", error);
          })
          .finally(() => {
            setIsGeneratingPdf(false);
          });
      }, 1000); // Debounce PDF regeneration

      return () => clearTimeout(timeoutId);
    }
  }, [previewMode, dataHash, pdfBlob, isGeneratingPdf, generatePdfFromHtml]);

  // Download resume as PDF
  const downloadResume = useCallback(async (): Promise<void> => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      // Use cached PDF if available and hash matches
      let blob: Blob | null = null;
      if (pdfCache.current && pdfCache.current.dataHash === dataHash) {
        blob = pdfCache.current.blob;
      } else {
        // Generate new PDF
        blob = await generatePdfFromHtml();
        if (blob) {
          // Store in cache for future use
          pdfCache.current = { blob, dataHash };
        }
      }

      if (!blob) {
        throw new Error("Failed to generate PDF");
      }

      // Generate filename and download
      const fileName = resumeData.personalInfo.fullName
        ? `Resume_${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}.pdf`
        : "Resume.pdf";

      downloadPdfBlob(blob, fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  }, [resumeData, dataHash, generatePdfFromHtml, isExporting]);

  return {
    pdfBlob,
    isGeneratingPdf,
    isExporting,
    generatePdfFromHtml,
    downloadResume,
    dataHash,
  };
}
