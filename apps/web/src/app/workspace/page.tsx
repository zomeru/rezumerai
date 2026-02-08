"use client";

import { ResumeCardSkeletonGrid, ResumeCardSkeletonList } from "@rezumerai/ui";
import { Grid3x3, LayoutList, Plus, Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CreateResumeModal,
  DownloadResumeModal,
  EditResumeModal,
  ResumeCard,
  UploadResumeModal,
} from "@/components/Dashboard";
import { ROUTES } from "@/constants/routing";
import { generateUuidKey } from "@/lib/utils";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useResumeStore } from "@/store/useResumeStore";

const RESUME_COLORS: `#${string}`[] = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];

/**
 * Dashboard component for managing resumes
 * Completely redesigned with modern UI patterns
 */
export default function Dashboard(): React.JSX.Element {
  const router = useRouter();

  // Resume store
  const resumes = useResumeStore((state) => state.resumes);
  const isLoading = useResumeStore((state) => state.isLoading);
  const hasFetched = useResumeStore((state) => state.hasFetched);
  const fetchResumes = useResumeStore((state) => state.fetchResumes);
  const updateResume = useResumeStore((state) => state.updateResume);
  const deleteResume = useResumeStore((state) => state.deleteResume);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // Dashboard UI store
  const modalState = useDashboardStore((state) => state.modalState);
  const setModalState = useDashboardStore((state) => state.setModalState);
  const editingTitle = useDashboardStore((state) => state.editingTitle);
  const setEditingTitle = useDashboardStore((state) => state.setEditingTitle);
  const viewMode = useDashboardStore((state) => state.viewMode);
  const setViewMode = useDashboardStore((state) => state.setViewMode);
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);

  function handleCreateResume(title: string): void {
    if (!title.trim()) return;
    setModalState({ type: null });
    router.push(`${ROUTES.BUILDER}/123`);
  }

  function handleUploadResume(title: string, file: File): void {
    if (!title.trim() || !file) return;
    setModalState({ type: null });
    router.push(`${ROUTES.BUILDER}/123`);
  }

  function handleEditTitle(newTitle: string): void {
    if (!newTitle.trim() || !modalState.resumeId) return;
    updateResume(modalState.resumeId, { title: newTitle });
    setModalState({ type: null });
  }

  function handleDeleteResume(resumeId: string): void {
    const confirmed = window.confirm("Are you sure you want to delete this resume?");
    if (confirmed) {
      deleteResume(resumeId);
    }
  }

  function handleOpenResume(resumeId: string): void {
    router.push(`${ROUTES.BUILDER}/${resumeId}`);
  }

  function handleOpenEditModal(resumeId: string, title: string): void {
    setEditingTitle(title);
    setModalState({ type: "edit", resumeId });
  }

  function handleDownloadResume(resumeId: string): void {
    setModalState({ type: "download", resumeId });
  }

  function handleCloseModal(): void {
    setModalState({ type: null });
    setEditingTitle("");
  }

  // Get the resume for download modal
  const downloadResume =
    modalState.type === "download" && modalState.resumeId
      ? resumes.find((r) => r._id === modalState.resumeId)
      : undefined;

  // Filter resumes based on search query
  const filteredResumes = resumes.filter((resume) => resume.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-400 px-4 py-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="mb-8">
          <h1 className="mb-2 bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
            My Resumes
          </h1>
          <p className="text-lg text-slate-600">Create, manage, and download your professional resumes</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <button
              type="button"
              onClick={(): void => setModalState({ type: "create" })}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-5 py-3 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95"
            >
              <Plus className="size-5" />
              <span>Create New</span>
            </button>
            <button
              type="button"
              onClick={(): void => setModalState({ type: "upload" })}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95"
            >
              <Upload className="size-5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* View Toggle */}
            <div className="flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={(): void => setViewMode("grid")}
                className={`rounded-lg p-2 transition-colors ${
                  viewMode === "grid" ? "bg-primary-100 text-primary-700" : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="size-5" />
              </button>
              <button
                type="button"
                onClick={(): void => setViewMode("list")}
                className={`rounded-lg p-2 transition-colors ${
                  viewMode === "list" ? "bg-primary-100 text-primary-700" : "text-slate-600 hover:bg-slate-100"
                }`}
                title="List view"
              >
                <LayoutList className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Resume Grid/List */}
        {isLoading || !hasFetched ? (
          viewMode === "grid" ? (
            <ResumeCardSkeletonGrid count={5} />
          ) : (
            <ResumeCardSkeletonList count={5} />
          )
        ) : filteredResumes.length > 0 ? (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-3"
            }
          >
            {filteredResumes.map((resume, index) => {
              const key = generateUuidKey(resume._id);

              return (
                <ResumeCard
                  key={key}
                  resume={resume}
                  color={RESUME_COLORS[index % RESUME_COLORS.length] ?? ""}
                  onOpen={(): void => handleOpenResume(resume._id)}
                  onEdit={(): void => handleOpenEditModal(resume._id, resume.title)}
                  onDelete={(): void => handleDeleteResume(resume._id)}
                  onDownload={async (): Promise<void> => handleDownloadResume(resume._id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-300 border-dashed bg-white/50 p-12 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4">
              <Plus className="size-12 text-slate-400" />
            </div>
            <h3 className="mb-2 font-semibold text-slate-900 text-xl">
              {searchQuery ? "No resumes found" : "No resumes yet"}
            </h3>
            <p className="mb-6 text-slate-600">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by creating your first professional resume"}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={(): void => setModalState({ type: "create" })}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95"
              >
                <Plus className="size-5" />
                Create Your First Resume
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalState.type === "create" && <CreateResumeModal onSubmit={handleCreateResume} onClose={handleCloseModal} />}

      {modalState.type === "upload" && <UploadResumeModal onSubmit={handleUploadResume} onClose={handleCloseModal} />}

      {modalState.type === "edit" && (
        <EditResumeModal title={editingTitle} onSubmit={handleEditTitle} onClose={handleCloseModal} />
      )}

      {modalState.type === "download" && downloadResume && (
        <DownloadResumeModal resume={downloadResume} isOpen onClose={handleCloseModal} />
      )}
    </div>
  );
}
