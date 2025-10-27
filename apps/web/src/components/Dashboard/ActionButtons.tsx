"use client";

import { PlusIcon, UploadCloudIcon } from "lucide-react";

interface ActionButtonsProps {
  onCreateClick: () => void;
  onUploadClick: () => void;
}

export default function ActionButtons({ onCreateClick, onUploadClick }: ActionButtonsProps) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={onCreateClick}
        className="group flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 border-dashed bg-white text-slate-600 transition-all duration-300 hover:border-primary-500 hover:shadow-lg sm:max-w-36"
        aria-label="Create a new resume"
      >
        <PlusIcon className="size-11 rounded-full bg-linear-to-r from-primary-300 to-primary-500 p-2.5 text-white transition-all duration-300" />
        <p className="text-sm transition-all duration-300 group-hover:text-primary-600">Create Resume</p>
      </button>

      <button
        type="button"
        onClick={onUploadClick}
        className="group flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 border-dashed bg-white text-slate-600 transition-all duration-300 hover:border-accent-500 hover:shadow-lg sm:max-w-36"
        aria-label="Upload a resume"
      >
        <UploadCloudIcon className="size-11 rounded-full bg-linear-to-r from-accent-300 to-accent-500 p-2.5 text-white transition-all duration-300" />
        <p className="text-sm transition-all duration-300 group-hover:text-accent-600">Upload Resume</p>
      </button>
    </div>
  );
}
