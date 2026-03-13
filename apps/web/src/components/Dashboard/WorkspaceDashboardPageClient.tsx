"use client";

import { ResumeCardSkeletonGrid, ResumeCardSkeletonList } from "@rezumerai/ui";
import { generateUuidKey } from "@rezumerai/utils";
import { Grid3x3, LayoutList, Plus, Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useState, useTransition } from "react";
import { initialResume } from "@/constants/dummy";
import { ROUTES } from "@/constants/routing";
import { useDebounce } from "@/hooks/useDebounce";
import {
  type CreateResumeInput,
  useCreateResume,
  useDeleteResume,
  useResumeList,
  useUpdateResume,
} from "@/hooks/useResume";
import { useDashboardStore } from "@/store/useDashboardStore";
import { CreateResumeModal, DownloadResumeModal, EditResumeModal, ResumeCard, UploadResumeModal } from ".";

const RESUME_COLORS: `#${string}`[] = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];

export default function WorkspaceDashboardPageClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const createResume = useCreateResume();
  const updateResume = useUpdateResume();
  const deleteResume = useDeleteResume();

  const [resumeTitle, setResumeTitle] = useState("");

  const modalState = useDashboardStore((state) => state.modalState);
  const setModalState = useDashboardStore((state) => state.setModalState);
  const viewMode = useDashboardStore((state) => state.viewMode);
  const setViewMode = useDashboardStore((state) => state.setViewMode);
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const debouncedSearchQuery = useDebounce(deferredSearchQuery, 300);

  const { data: resumes = [], isLoading, error } = useResumeList(debouncedSearchQuery);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeTitle(e.target.value);
  }, []);

  function handleSearchChange(value: string) {
    startTransition(() => {
      setSearchQuery(value);
    });
  }

  async function handleCreateResume(title: string): Promise<void> {
    if (!title.trim()) return;

    const newResumeData: CreateResumeInput = {
      ...initialResume,
      title,
    };

    try {
      const newResume = await createResume.mutateAsync(newResumeData);
      setModalState({ type: null });
      router.push(`${ROUTES.BUILDER}/${newResume.id}`);
    } catch {
      // Error handling done in mutation
    } finally {
      setResumeTitle("");
    }
  }

  async function handleUploadResume(title: string, file: File) {
    if (!title.trim() || !file) return;
    setModalState({ type: null });
    router.push(`${ROUTES.BUILDER}/123`);
  }

  async function handleEditTitle(newTitle: string): Promise<void> {
    if (!newTitle.trim() || !modalState.resumeId) return;

    try {
      await updateResume.mutateAsync({ id: modalState.resumeId, updates: { title: newTitle } });
      setModalState({ type: null });
    } catch {
      // Error handling done in mutation
    } finally {
      setResumeTitle("");
    }
  }

  const handleDeleteResume = useCallback(
    async (resumeId: string): Promise<void> => {
      const confirmed = window.confirm("Are you sure you want to delete this resume?");
      if (confirmed) {
        try {
          await deleteResume.mutateAsync(resumeId);
        } catch {
          // Error handling done in mutation
        }
      }
    },
    [deleteResume],
  );

  const handleOpenResume = useCallback(
    (resumeId: string) => {
      router.push(`${ROUTES.BUILDER}/${resumeId}`);
    },
    [router],
  );

  const handleOpenEditModal = useCallback(
    (resumeId: string, title: string) => {
      setResumeTitle(title);
      setModalState({ type: "edit", resumeId });
    },
    [setModalState],
  );

  async function handleDownloadResume(resumeId: string): Promise<void> {
    setModalState({ type: "download", resumeId });
  }

  function handleCloseModal() {
    setModalState({ type: null });
    setResumeTitle("");
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-400 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
            My Resumes
          </h1>
          <p className="text-lg text-slate-600">Create, manage, and download your professional resumes</p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <button
              type="button"
              onClick={() => setModalState({ type: "create" })}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-5 py-3 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95"
            >
              <Plus className="size-5" />
              <span>Create New</span>
            </button>
            <button
              type="button"
              onClick={() => setModalState({ type: "upload" })}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-95"
            >
              <Upload className="size-5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                aria-label="Search resumes"
              />
              {isPending && (
                <output className="absolute top-1/2 right-3 -translate-y-1/2" aria-label="Searching">
                  <div className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-500" />
                </output>
              )}
            </div>

            <div className="flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-2 transition-colors ${
                  viewMode === "grid" ? "bg-primary-100 text-primary-700" : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
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

        {error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-300 bg-red-50 p-12 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-4">
              <Plus className="size-12 text-red-400" />
            </div>
            <h3 className="mb-2 font-semibold text-red-900 text-xl">Error loading resumes</h3>
            <p className="mb-6 text-red-600">{error.message}</p>
          </div>
        )}

        {!error && isLoading ? (
          viewMode === "grid" ? (
            <ResumeCardSkeletonGrid count={5} />
          ) : (
            <ResumeCardSkeletonList count={5} />
          )
        ) : resumes.length > 0 ? (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-3"
            }
          >
            {resumes.map((resume, index) => {
              const key = generateUuidKey(resume.id);

              return (
                <ResumeCard
                  key={key}
                  resume={resume}
                  color={RESUME_COLORS[index % RESUME_COLORS.length] ?? ""}
                  onOpen={() => handleOpenResume(resume.id)}
                  onEdit={() => handleOpenEditModal(resume.id, resume.title)}
                  onDelete={() => handleDeleteResume(resume.id)}
                  onDownload={async (): Promise<void> => handleDownloadResume(resume.id)}
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
                onClick={() => setModalState({ type: "create" })}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95"
              >
                <Plus className="size-5" />
                Create Your First Resume
              </button>
            )}
          </div>
        )}
      </div>

      {modalState.type === "create" && (
        <CreateResumeModal
          onSubmit={handleCreateResume}
          onClose={handleCloseModal}
          title={resumeTitle}
          onChange={handleTitleChange}
        />
      )}

      {modalState.type === "upload" && (
        <UploadResumeModal
          title={resumeTitle}
          onSubmit={handleUploadResume}
          onClose={handleCloseModal}
          onTitleChange={handleTitleChange}
        />
      )}

      {modalState.type === "edit" && (
        <EditResumeModal
          title={resumeTitle}
          onSubmit={handleEditTitle}
          onClose={handleCloseModal}
          onChange={handleTitleChange}
        />
      )}

      {modalState.type === "download" && modalState.resumeId && (
        <DownloadResumeModal resumeId={modalState.resumeId} isOpen onClose={handleCloseModal} />
      )}
    </main>
  );
}
