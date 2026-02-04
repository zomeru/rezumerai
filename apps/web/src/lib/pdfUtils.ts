import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { LETTER_HEIGHT_PX, LETTER_WIDTH_PX } from "@/constants/pdf";

/**
 * Generates a PDF blob from an HTML element
 *
 * @param element - The HTML element to convert to PDF
 * @returns A promise that resolves to a PDF Blob, or null if generation fails
 *
 * @example
 * ```tsx
 * const element = document.getElementById('resume-preview');
 * const blob = await generatePdfFromElement(element);
 * if (blob) {
 *   // Use the blob for download or preview
 * }
 * ```
 */
export async function generatePdfFromElement(element: HTMLElement): Promise<Blob | null> {
  // Ensure we're in browser environment
  if (typeof window === "undefined") {
    console.error("PDF generation must run in browser");
    return null;
  }

  try {
    // Store original styles to restore later
    const originalTransform = element.style.transform;
    const originalPosition = element.style.position;
    const originalLeft = element.style.left;
    const originalTop = element.style.top;
    const originalOpacity = element.style.opacity;
    const originalOverflow = element.style.overflow;
    const originalHeight = element.style.height;

    // Temporarily remove scale transform and bring into view for accurate PDF capture
    element.style.transform = "scale(1)";
    element.style.position = "relative";
    element.style.left = "0";
    element.style.top = "0";
    element.style.opacity = "1";
    element.style.overflow = "visible";
    element.style.height = "auto";

    // Wait for next frame to ensure styles are applied
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Get actual content height
    const contentHeight = element.scrollHeight;

    // Create canvas from the HTML preview with full content height
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution for quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: LETTER_WIDTH_PX,
      height: contentHeight,
    });

    // Restore original styles
    element.style.transform = originalTransform;
    element.style.position = originalPosition;
    element.style.left = originalLeft;
    element.style.top = originalTop;
    element.style.opacity = originalOpacity;
    element.style.overflow = originalOverflow;
    element.style.height = originalHeight;

    // Calculate dimensions for US Letter size (8.5 x 11 inches at 72 DPI)
    const pageWidth = 8.5 * 72; // 612 points
    const pageHeight = 11 * 72; // 792 points

    // Create PDF with exact letter size
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [pageWidth, pageHeight],
    });

    // Calculate how many pages we need
    const contentHeightInPx = contentHeight;
    const pagesNeeded = Math.ceil(contentHeightInPx / LETTER_HEIGHT_PX);

    // Convert canvas dimensions to match PDF dimensions
    const canvasWidthInPdf = pageWidth;
    const pixelToPdfRatio = canvasWidthInPdf / LETTER_WIDTH_PX;

    for (let pageIndex = 0; pageIndex < pagesNeeded; pageIndex++) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      // Calculate the portion of canvas to capture for this page
      const sourceY = pageIndex * LETTER_HEIGHT_PX * 2; // *2 because canvas scale is 2
      const sourceHeight = Math.min(LETTER_HEIGHT_PX * 2, canvas.height - sourceY);

      // Create a temporary canvas for this page's content
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;

      const pageContext = pageCanvas.getContext("2d");
      if (pageContext) {
        // Draw the portion of the full canvas onto the page canvas
        pageContext.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

        // Calculate height for this page in PDF units
        const pageContentHeight = (sourceHeight / 2) * pixelToPdfRatio;

        // Add the page image to PDF
        const imgData = pageCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(imgData, "PNG", 0, 0, canvasWidthInPdf, pageContentHeight, undefined, "FAST");
      }
    }

    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}

/**
 * Downloads a PDF blob with the specified filename
 *
 * @param blob - The PDF blob to download
 * @param fileName - The filename for the downloaded PDF
 * @param onEnd - Optional callback to execute after download starts
 *
 * @example
 * ```tsx
 * const blob = await generatePdfFromElement(element);
 * if (blob) {
 *   downloadPdfBlob(blob, 'Resume_John_Doe.pdf');
 * }
 * ```
 */
export function downloadPdfBlob(blob: Blob, fileName: string, onEnd?: () => void): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  if (onEnd) {
    onEnd();
  }
}
