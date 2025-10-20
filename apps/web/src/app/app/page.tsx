// "use client";

// import {
//   FilePenLineIcon,
//   PencilIcon,
//   PlusIcon,
//   TrashIcon,
//   UploadCloudIcon,
//   UploadIcon,
//   XIcon,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useEffect, useId, useState } from "react";
// import { dummyResumeData, type ResumeData } from "@/constants/dummy";

// const colors = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];

// export default function Dashboard() {
//   const router = useRouter();
//   const resumeInputId = useId();

//   const [allResumes, setAllResumes] = useState<ResumeData[]>([]);
//   const [showCreateResume, setShowCreateResume] = useState(false);
//   const [showUploadResume, setShowUploadResume] = useState(false);
//   const [title, setTitle] = useState("");
//   const [resume, setResume] = useState<File | null>(null);
//   const [editResumeId, setEditResumeId] = useState<string>("");

//   const loadAllResumes = async () => {
//     setAllResumes(dummyResumeData);
//   };

//   async function createResume(e: React.FormEvent) {
//     e.preventDefault();
//     setShowCreateResume(false);
//     router.push("/app/builder/123");
//   }

//   async function uploadResume(e: React.FormEvent) {
//     e.preventDefault();
//     setShowUploadResume(false);
//     router.push("/app/builder/123");
//   }

//   async function editTitle(e: React.FormEvent) {
//     e.preventDefault();
//     setEditResumeId("");
//   }

//   async function deleteResume(resumeId: string) {
//     const confirm = window.confirm(
//       "Are you sure you want to delete this resume?",
//     );

//     if (confirm) {
//       setAllResumes((prev) => prev.filter((resume) => resume._id !== resumeId));
//     }
//   }

//   useEffect(() => {
//     loadAllResumes();
//   }, []);

//   return (
//     <div>
//       <div className="mx-auto max-w-7xl px-4 py-8">
//         <p className="mb-6 bg-linear-to-r from-slate-600 to-slate-700 bg-clip-text font-medium text-2xl text-transparent sm:hidden">
//           Welcome, John Doe
//         </p>
//         <div className="flex gap-4">
//           <button
//             type="button"
//             onClick={() => setShowCreateResume(true)}
//             className="group duration flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 border-dashed bg-white text-slate-600 transition-all hover:border-primary-500 hover:shadow-lg sm:max-w-36"
//           >
//             <PlusIcon className="size-11 rounded-full bg-linear-to-r from-primary-300 to-primary-500 p-2.5 text-white transition-all duration-300" />
//             <p className="text-sm transition-all duration-300 group-hover:text-primary-600">
//               Create Resume
//             </p>
//           </button>
//           <button
//             type="button"
//             onClick={() => setShowUploadResume(true)}
//             className="group duration flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 border-dashed bg-white text-slate-600 transition-all hover:border-accent-500 hover:shadow-lg sm:max-w-36"
//           >
//             <UploadCloudIcon className="size-11 rounded-full bg-linear-to-r from-accent-300 to-accent-500 p-2.5 text-white transition-all duration-300" />
//             <p className="text-sm transition-all duration-300 group-hover:text-accent-600">
//               Upload Resume
//             </p>
//           </button>
//         </div>

//         <hr className="my-6 border-slate-300 sm:w-[305px]" />

//         <div className="grid grid-cols-2 flex-wrap gap-4 sm:flex">
//           {allResumes.map((resume, index) => {
//             const baseColor = colors[index % colors.length];
//             return (
//               <button
//                 type="button"
//                 key={resume._id}
//                 onClick={() => {
//                   router.push(`/app/builder/${resume._id}`);
//                 }}
//                 className="group relative flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border transition-all duration-300 hover:shadow-lg sm:max-w-36"
//                 style={{
//                   background: `linear-gradient(135deg, ${baseColor}10, ${baseColor}40)`,
//                   ...(baseColor ? { borderColor: baseColor + 40 } : {}),
//                 }}
//               >
//                 <FilePenLineIcon
//                   className="size-7 transition-all group-hover:scale-105"
//                   style={{ color: baseColor }}
//                 />
//                 <p
//                   className="px-2 text-center text-sm transition-all group-hover:scale-105"
//                   style={{ color: baseColor }}
//                 >
//                   {resume.title}
//                 </p>
//                 <p
//                   className="absolute bottom-1 px-2 text-center text-[11px] text-slate-400 transition-all duration-300 group-hover:text-slate-500"
//                   style={baseColor ? { color: baseColor + 90 } : {}}
//                 >
//                   Updated on {new Date(resume.updatedAt).toLocaleDateString()}
//                 </p>
//                 {/** biome-ignore lint/a11y/useSemanticElements: This div is intentionally used as a button */}
//                 <div
//                   onClick={(e) => {
//                     e.stopPropagation();
//                   }}
//                   role="button"
//                   tabIndex={0}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter" || e.key === " ") e.stopPropagation();
//                   }}
//                   className="absolute top-1 right-1 hidden items-center group-hover:flex"
//                 >
//                   <TrashIcon
//                     onClick={() => {
//                       deleteResume(resume._id);
//                     }}
//                     className="size-7 rounded p-1.5 text-slate-700 transition-colors hover:bg-white/50"
//                   />
//                   <PencilIcon
//                     onClick={() => {
//                       setEditResumeId(resume._id);
//                       setTitle(resume.title);
//                     }}
//                     className="size-7 rounded p-1.5 text-slate-700 transition-colors hover:bg-white/50"
//                   />
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         {showCreateResume && (
//           <form
//             onSubmit={createResume}
//             className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 bg-opacity-50 backdrop-blur"
//             onClick={() => setShowCreateResume(false)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" || e.key === " ") e.stopPropagation();
//             }}
//           >
//             {/** biome-ignore lint/a11y/useSemanticElements: This div is intentionally used as a button */}
//             <div
//               role="button"
//               tabIndex={0}
//               onClick={(e) => e.stopPropagation()}
//               className="relative w-full max-w-sm rounded-lg border bg-slate-50 p-6 shadow-md"
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" || e.key === " ") e.stopPropagation();
//               }}
//             >
//               <h2 className="mb-4 font-bold text-xl">Create a resume</h2>
//               <input
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 type="text"
//                 placeholder="Enter resume title"
//                 className="mb-4 w-full px-4 py-2 ring-primary-600 focus:border-primary-600"
//               />
//               <button
//                 type="submit"
//                 className="w-full rounded bg-primary-600 py-2 text-white transition-colors hover:bg-primary-700"
//               >
//                 Create resume
//               </button>
//               <XIcon
//                 className="absolute top-4 right-4 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
//                 onClick={() => {
//                   setShowCreateResume(false);
//                   setTitle("");
//                 }}
//               />
//             </div>
//           </form>
//         )}

//         {showUploadResume && (
//           <form
//             onSubmit={uploadResume}
//             className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 bg-opacity-50 backdrop-blur"
//             onClick={() => setShowUploadResume(false)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" || e.key === " ") e.stopPropagation();
//             }}
//           >
//             {/** biome-ignore lint/a11y/useSemanticElements: This div is intentionally used as a button */}
//             <div
//               role="button"
//               tabIndex={0}
//               onClick={(e) => e.stopPropagation()}
//               className="relative w-full max-w-sm rounded-lg border bg-slate-50 p-6 shadow-md"
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" || e.key === " ") e.stopPropagation();
//               }}
//             >
//               <h2 className="mb-4 font-bold text-xl">Upload resume</h2>
//               <input
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 type="text"
//                 placeholder="Enter resume title"
//                 className="mb-4 w-full px-4 py-2 ring-primary-600 focus:border-primary-600"
//               />
//               <div>
//                 <label
//                   htmlFor={resumeInputId}
//                   className="block text-slate-700 text-sm"
//                 >
//                   Select resume file
//                   <div className="group my-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-slate-400 border-dashed p-4 py-10 text-slate-400 transition-colors hover:border-primary-500 hover:text-primary-700">
//                     {resume ? (
//                       <p className="text-primary-700">{resume.name}</p>
//                     ) : (
//                       <>
//                         <UploadIcon className="size-14 stroke-1" />
//                         <p>Click to upload file</p>
//                       </>
//                     )}
//                   </div>
//                 </label>
//                 <input
//                   hidden
//                   type="file"
//                   id={resumeInputId}
//                   accept=".pdf"
//                   onChange={(e) => {
//                     if (e.target.files && e.target.files.length > 0) {
//                       const file = e.target.files[0] ?? null;
//                       setResume(file);
//                     }
//                   }}
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="w-full rounded bg-primary-600 py-2 text-white transition-colors hover:bg-primary-700"
//               >
//                 Upload resume
//               </button>
//               <XIcon
//                 className="absolute top-4 right-4 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
//                 onClick={() => {
//                   setShowUploadResume(false);
//                   setTitle("");
//                 }}
//               />
//             </div>
//           </form>
//         )}

//         {editResumeId && (
//           <form
//             onSubmit={editTitle}
//             className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 bg-opacity-50 backdrop-blur"
//             onClick={() => setEditResumeId("")}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" || e.key === " ") e.stopPropagation();
//             }}
//           >
//             {/** biome-ignore lint/a11y/useSemanticElements: This div is intentionally used as a button */}
//             <div
//               role="button"
//               tabIndex={0}
//               onClick={(e) => e.stopPropagation()}
//               className="relative w-full max-w-sm rounded-lg border bg-slate-50 p-6 shadow-md"
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" || e.key === " ") e.stopPropagation();
//               }}
//             >
//               <h2 className="mb-4 font-bold text-xl">Edit Resume Title</h2>
//               <input
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 type="text"
//                 placeholder="Enter resume title"
//                 className="mb-4 w-full px-4 py-2 ring-primary-600 focus:border-primary-600"
//               />
//               <button
//                 type="submit"
//                 className="w-full rounded bg-primary-600 py-2 text-white transition-colors hover:bg-primary-700"
//               >
//                 Update
//               </button>
//               <XIcon
//                 className="absolute top-4 right-4 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
//                 onClick={() => {
//                   setEditResumeId("");
//                   setTitle("");
//                 }}
//               />
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  ActionButtons,
  CreateResumeModal,
  EditResumeModal,
  ResumeCard,
  UploadResumeModal,
} from "@/components/Dashboard";
import { dummyResumeData, type ResumeData } from "@/constants/dummy";

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
  const resumeInputId = useId();

  // State management
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [editingTitle, setEditingTitle] = useState("");

  // Initialize resumes on mount
  useEffect(() => {
    loadResumes();
  }, []);

  /**
   * Load all resumes from data source
   */
  const loadResumes = async () => {
    try {
      setResumes(dummyResumeData);
    } catch (error) {
      console.error("Failed to load resumes:", error);
    }
  };

  /**
   * Handle resume creation
   */
  const handleCreateResume = (title: string) => {
    if (!title.trim()) return;
    setModalState({ type: null });
    router.push("/app/builder/123");
  };

  /**
   * Handle resume upload
   */
  const handleUploadResume = (title: string, file: File) => {
    if (!title.trim() || !file) return;
    setModalState({ type: null });
    router.push("/app/builder/123");
  };

  /**
   * Handle resume title update
   */
  const handleEditTitle = (newTitle: string) => {
    if (!newTitle.trim() || !modalState.resumeId) return;

    setResumes((prev) =>
      prev.map((resume) =>
        resume._id === modalState.resumeId
          ? { ...resume, title: newTitle }
          : resume,
      ),
    );
    setModalState({ type: null });
  };

  /**
   * Handle resume deletion with confirmation
   */
  const handleDeleteResume = (resumeId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?",
    );

    if (confirmed) {
      setResumes((prev) => prev.filter((resume) => resume._id !== resumeId));
    }
  };

  /**
   * Navigate to resume builder
   */
  const handleOpenResume = (resumeId: string) => {
    router.push(`/app/builder/${resumeId}`);
  };

  /**
   * Open edit modal for a specific resume
   */
  const handleOpenEditModal = (resumeId: string, title: string) => {
    setEditingTitle(title);
    setModalState({ type: "edit", resumeId });
  };

  /**
   * Close active modal
   */
  const handleCloseModal = () => {
    setModalState({ type: null });
    setEditingTitle("");
  };

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
          {resumes.map((resume, index) => (
            <ResumeCard
              key={resume._id}
              resume={resume}
              color={RESUME_COLORS[index % RESUME_COLORS.length] ?? ""}
              onOpen={() => handleOpenResume(resume._id)}
              onEdit={() => handleOpenEditModal(resume._id, resume.title)}
              onDelete={() => handleDeleteResume(resume._id)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {modalState.type === "create" && (
        <CreateResumeModal
          onSubmit={handleCreateResume}
          onClose={handleCloseModal}
        />
      )}

      {modalState.type === "upload" && (
        <UploadResumeModal
          onSubmit={handleUploadResume}
          onClose={handleCloseModal}
        />
      )}

      {modalState.type === "edit" && (
        <EditResumeModal
          title={editingTitle}
          onSubmit={handleEditTitle}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
