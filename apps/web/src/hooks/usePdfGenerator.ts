import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Resume } from "@/constants/dummy";

export type PreviewMode = "html" | "pdf";

interface UsePdfGeneratorProps {
  resumeData: Resume;
  previewMode: PreviewMode;
  resumePreviewRef: React.RefObject<HTMLDivElement | null>;
  fontSize?: string;
  accentColor?: string;
}

interface UsePdfGeneratorReturn {
  pdfBlob: Blob | null;
  isGeneratingPdf: boolean;
  isExporting: boolean;
  generatePdfFromHtml: () => Promise<Blob | null>;
  downloadResume: () => Promise<void>;
}

/**
 * Custom hook to handle PDF generation from HTML resume preview
 * Manages PDF blob state, generation process, and download functionality
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

  // Generate PDF from HTML preview (source of truth)
  const generatePdfFromHtml = useCallback(async (): Promise<Blob | null> => {
    // Ensure we're in browser environment
    if (typeof window === "undefined") {
      console.error("PDF generation must run in browser");
      return null;
    }

    if (!resumePreviewRef.current) {
      console.error("Resume preview ref is null");
      return null;
    }

    try {
      const element = resumePreviewRef.current;

      // Letter size dimensions
      const LETTER_WIDTH_PX = 816;
      const LETTER_HEIGHT_PX = 1056;

      // Store original styles to restore later
      const originalTransform = element.style.transform;
      const originalPosition = element.style.position;
      const originalLeft = element.style.left;
      const originalTop = element.style.top;
      const originalOpacity = element.style.opacity;

      // Temporarily remove scale transform and bring into view for accurate PDF capture
      element.style.transform = "scale(1)";
      element.style.position = "relative";
      element.style.left = "0";
      element.style.top = "0";
      element.style.opacity = "1";

      // Wait for next frame to ensure styles are applied
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Create canvas from the HTML preview at exact dimensions
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution for quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: LETTER_WIDTH_PX,
        height: LETTER_HEIGHT_PX,
      });

      // Restore original styles
      element.style.transform = originalTransform;
      element.style.position = originalPosition;
      element.style.left = originalLeft;
      element.style.top = originalTop;
      element.style.opacity = originalOpacity;

      // Calculate dimensions for US Letter size (8.5 x 11 inches at 72 DPI)
      const pageWidth = 8.5 * 72; // 612 points
      const pageHeight = 11 * 72; // 792 points

      // Create PDF with exact letter size
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [pageWidth, pageHeight],
      });

      // Calculate scaling to fit canvas to page while maintaining aspect ratio
      const canvasAspectRatio = canvas.width / canvas.height;
      const pageAspectRatio = pageWidth / pageHeight;

      let imgWidth = pageWidth;
      let imgHeight = pageHeight;

      if (canvasAspectRatio > pageAspectRatio) {
        // Canvas is wider than page
        imgHeight = pageWidth / canvasAspectRatio;
      } else {
        // Canvas is taller than page
        imgWidth = pageHeight * canvasAspectRatio;
      }

      // Center the image on the page
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = (pageHeight - imgHeight) / 2;

      // Add the image to PDF
      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight, undefined, "FAST");

      return pdf.output("blob");
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  }, [resumePreviewRef]);

  // Generate PDF when switching to PDF preview mode (only once)
  useEffect(() => {
    if (previewMode === "pdf" && !hasGeneratedRef.current && !isGeneratingPdf) {
      hasGeneratedRef.current = true;
      setIsGeneratingPdf(true);
      generatePdfFromHtml()
        .then((blob) => {
          if (blob) {
            setPdfBlob(blob);
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
  }, [previewMode, isGeneratingPdf, generatePdfFromHtml]);

  // Regenerate PDF when resume data, font size, or accent color changes (with debounce)
  useEffect(() => {
    // Only regenerate if we're in PDF mode and have already generated a PDF
    if (previewMode === "pdf" && pdfBlob && !isGeneratingPdf) {
      const timeoutId = setTimeout(() => {
        setIsGeneratingPdf(true);
        generatePdfFromHtml()
          .then((blob) => {
            if (blob) {
              setPdfBlob(blob);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, previewMode, fontSize, accentColor]);

  // Download resume as PDF
  const downloadResume = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      // Use existing PDF blob if available, otherwise generate new one
      const blob = pdfBlob || (await generatePdfFromHtml());

      if (!blob) {
        throw new Error("Failed to generate PDF");
      }

      // Generate filename
      const fileName = resumeData.personalInfo.fullName
        ? `Resume_${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}.pdf`
        : "Resume.pdf";

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  }, [resumeData, pdfBlob, generatePdfFromHtml, isExporting]);

  return {
    pdfBlob,
    isGeneratingPdf,
    isExporting,
    generatePdfFromHtml,
    downloadResume,
  };
}
