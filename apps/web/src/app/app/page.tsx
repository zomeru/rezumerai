"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ActionButtons,
  CreateResumeModal,
  EditResumeModal,
  ResumeCard,
  UploadResumeModal,
} from "@/components/Dashboard";
import { dummyResumeData, type Resume } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";

const RESUME_COLORS = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];

interface ModalState {
  type: "create" | "upload" | "edit" | null;
  resumeId?: string;
}

/**
 * Dashboard component for managing resumes
 * Handles displaying, creating, uploading, and editing resumes
 */
export default function Dashboard() {
  const router = useRouter();

  // State management
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [editingTitle, setEditingTitle] = useState("");

  // Initialize resumes on mount
  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    try {
      setResumes(dummyResumeData);
    } catch (error) {
      console.error("Failed to load resumes:", error);
    }
  }

  function handleCreateResume(title: string) {
    if (!title.trim()) return;
    setModalState({ type: null });
    router.push("/app/builder/123");
  }

  function handleUploadResume(title: string, file: File) {
    if (!title.trim() || !file) return;
    setModalState({ type: null });
    router.push("/app/builder/123");
  }

  function handleEditTitle(newTitle: string) {
    if (!newTitle.trim() || !modalState.resumeId) return;

    setResumes((prev) =>
      prev.map((resume) => (resume._id === modalState.resumeId ? { ...resume, title: newTitle } : resume)),
    );
    setModalState({ type: null });
  }

  function handleDeleteResume(resumeId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this resume?");
    if (confirmed) {
      setResumes((prev) => prev.filter((resume) => resume._id !== resumeId));
    }
  }

  function handleOpenResume(resumeId: string) {
    router.push(`/app/builder/${resumeId}`);
  }

  function handleOpenEditModal(resumeId: string, title: string) {
    setEditingTitle(title);
    setModalState({ type: "edit", resumeId });
  }

  function handleCloseModal() {
    setModalState({ type: null });
    setEditingTitle("");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Welcome header */}
        <h1 className="mb-6 bg-linear-to-r from-slate-600 to-slate-700 bg-clip-text font-medium text-2xl text-transparent sm:hidden">
          Welcome, John Doe
        </h1>

        {/* Action buttons */}
        <ActionButtons
          onCreateClick={() => setModalState({ type: "create" })}
          onUploadClick={() => setModalState({ type: "upload" })}
        />

        <hr className="my-6 border-slate-300 sm:w-[305px]" />

        {/* Resume grid */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
          {resumes.map((resume, index) => {
            const key = generateUuidKey(resume._id);

            return (
              <ResumeCard
                key={key}
                resume={resume}
                color={RESUME_COLORS[index % RESUME_COLORS.length] ?? ""}
                onOpen={() => handleOpenResume(resume._id)}
                onEdit={() => handleOpenEditModal(resume._id, resume.title)}
                onDelete={() => handleDeleteResume(resume._id)}
              />
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {modalState.type === "create" && <CreateResumeModal onSubmit={handleCreateResume} onClose={handleCloseModal} />}

      {modalState.type === "upload" && <UploadResumeModal onSubmit={handleUploadResume} onClose={handleCloseModal} />}

      {modalState.type === "edit" && (
        <EditResumeModal title={editingTitle} onSubmit={handleEditTitle} onClose={handleCloseModal} />
      )}
    </div>
  );
}
