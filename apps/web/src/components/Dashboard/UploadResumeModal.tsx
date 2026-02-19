"use client";

import { UploadIcon } from "lucide-react";
import { useId, useState } from "react";
import BaseModal from "./BaseModal";

/**
 * Props for the {@link UploadResumeModal} component.
 *
 * @property onSubmit - Called with the title and selected PDF file
 * @property onClose - Callback to close the modal
 */
export interface UploadResumeModalProps {
  onSubmit: (title: string, file: File) => void;
  onClose: () => void;
}

/**
 * Modal form for uploading a resume PDF with a title.
 *
 * @param props - {@link UploadResumeModalProps}
 * @returns The upload‑resume modal dialog
 *
 * @example
 * ```tsx
 * <UploadResumeModal onSubmit={(title, file) => upload(title, file)} onClose={close} />
 * ```
 */
export default function UploadResumeModal({ onSubmit, onClose }: UploadResumeModalProps) {
  const inputId = useId();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (file) {
      onSubmit(title, file);
      setTitle("");
      setFile(null);
    }
  }

  function handleClose() {
    setTitle("");
    setFile(null);
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
  }

  return (
    <BaseModal
      isOpen={true}
      title="Upload resume"
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitLabel="Upload resume"
    >
      <input
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        type="text"
        placeholder="Enter resume title"
        className="w-full rounded border border-slate-300 px-4 py-2 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />

      <label htmlFor={inputId} className="block">
        <div className="group my-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-slate-300 border-dashed p-8 py-10 text-slate-400 transition-colors hover:border-primary-500 hover:text-primary-700">
          {file ? (
            <p className="font-medium text-primary-700 text-sm">{file.name}</p>
          ) : (
            <>
              <UploadIcon className="size-10 stroke-1" />
              <p className="text-sm">Click to upload file</p>
            </>
          )}
        </div>
      </label>

      <input hidden type="file" id={inputId} accept=".pdf" onChange={handleFileChange} required />
    </BaseModal>
  );
}
