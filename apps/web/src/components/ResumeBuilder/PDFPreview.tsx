"use client";

import { ChevronLeft, ChevronRight, Loader2, Maximize, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "./pdf-viewer.css";

interface PDFPreviewProps {
  pdfBlob: Blob | null;
  isGenerating?: boolean;
}

export default function PDFPreview({ pdfBlob, isGenerating = false }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<"width" | "page" | "custom">("width");
  const [error, setError] = useState<string | null>(null);

  // Configure pdf.js worker on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }, []);

  useEffect(() => {
    if (pdfBlob) {
      try {
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setError(null);
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error creating PDF URL:", err);
        setError("Failed to load PDF");
      }
    }
  }, [pdfBlob]);

  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setPageNumber(1);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF document");
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
    setFitMode("custom");
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
    setFitMode("custom");
  };

  const handleFitWidth = () => {
    setScale(1.0);
    setFitMode("width");
  };

  const handleFitPage = () => {
    setScale(0.85);
    setFitMode("page");
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));

  if (isGenerating) {
    return (
      <div className="flex min-h-[800px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary-500" />
          <p className="text-slate-600 text-sm">Generating PDF preview...</p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex min-h-[800px] flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50">
        {error ? (
          <>
            <p className="text-red-500 text-sm">{error}</p>
            <p className="text-slate-400 text-xs">Check console for details</p>
          </>
        ) : (
          <>
            <p className="text-slate-500 text-sm">No PDF preview available</p>
            <p className="text-slate-400 text-xs">Switch to Design tab and back to regenerate</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Viewer Controls */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Zoom Out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="min-w-[60px] text-center font-medium text-slate-600 text-sm">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Zoom In"
          >
            <ZoomIn className="size-4" />
          </button>
          <div className="mx-2 h-6 w-px bg-slate-300" />
          <button
            type="button"
            onClick={handleFitWidth}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              fitMode === "width"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            title="Fit to Width"
          >
            <Maximize className="size-4" />
            Fit Width
          </button>
          <button
            type="button"
            onClick={handleFitPage}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              fitMode === "page"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            title="Fit to Page"
          >
            <Minimize className="size-4" />
            Fit Page
          </button>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Previous Page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-slate-600 text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Next Page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary-500" />
              <span className="text-slate-600 text-sm">Loading PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-2 text-red-500">
              <p className="text-sm">Failed to load PDF</p>
              <p className="text-slate-400 text-xs">Try switching tabs or refreshing</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}
