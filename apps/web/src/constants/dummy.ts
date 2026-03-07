import type { ResumeWithRelations } from "@rezumerai/types";
import type { CreateResumeInput } from "@/hooks/useResume";

export const DUMMY_RESUME_DATA_ID = "sample_resume_id";
export const DUMMY_RESUME_USER_ID = "sample_user_id";

export const DUMMY_RESUME_PREVIEW_DATA: ResumeWithRelations = {
  // ----------------------------------------------------- Resume 1 ------------------------------------------------------
  id: DUMMY_RESUME_DATA_ID,
  userId: DUMMY_RESUME_USER_ID,
  title: "Alex's Resume",
  public: true,
  professionalSummary:
    "Highly analytical Data Analyst with 6 years of experience transforming complex datasets into actionable insights using SQL, Python, and advanced visualization tools. ",
  template: "minimal_image",
  accentColor: "#14B8A6",
  fontSize: "medium",
  customFontSize: 1,
  personalInfo: {
    id: "123",
    resumeId: DUMMY_RESUME_DATA_ID,
    fullName: "Alex Smith",
    email: "alex@example.com",
    phone: "0 123456789",
    location: "NY, USA",
    linkedin: "https://www.linkedin.com",
    website: "https://www.example.com",
    profession: "Full Stack Developer",
    image: "https://avatars.githubusercontent.com/u/19688908?v=4",
  },

  skills: [
    "JavaScript",
    "React JS",
    "Full Stack Development",
    "Git",
    "GitHub",
    "NextJS",
    "Express",
    "NodeJS",
    "TypeScript",
  ],
  experience: [
    {
      id: "68d2a31a1c4dd38875bb037f",
      resumeId: DUMMY_RESUME_DATA_ID,
      company: "Example Technologies.",
      position: "Senior Full Stack Developer",
      startDate: new Date(2023, 5, 1),
      endDate: null,
      description:
        "Architected, developed, and deployed innovative full-stack applications at Example Technologies.\ncreating robust back-end systems and intuitive front- end interfaces to deliver meaningful digital experiences ",
      isCurrent: true,
    },
    {
      id: "68d4f7abc8f0d46dc8a8b114",
      resumeId: DUMMY_RESUME_DATA_ID,
      company: "Example Technologies.",
      position: "Full Stack Developer",
      startDate: new Date(2019, 7, 1),
      endDate: new Date(2023, 4, 1),
      description:
        "Engineered and deployed scalable full-stack web applications for Example Technologies, translating complex requirements into robust front-end interfaces and efficient back-end services.",
      isCurrent: false,
    },
  ],
  education: [
    {
      id: "68d2a31a1c4dd38875bb0380",
      resumeId: DUMMY_RESUME_DATA_ID,
      institution: "Example Institute of Technology",
      degree: "B.TECH",
      field: "CSE",
      schoolYearStartDate: new Date(2019, 8, 1),
      graduationDate: new Date(2023, 4, 1),
      isCurrent: false,
      gpa: "8.7",
    },
    {
      id: "68d2a31a1c4dd38875bb0381",
      resumeId: DUMMY_RESUME_DATA_ID,
      institution: "Example Public School",
      degree: "HIGHER SECONDARY",
      field: "PCM",
      schoolYearStartDate: new Date(2017, 6, 1),
      graduationDate: new Date(2019, 2, 1),
      isCurrent: false,
      gpa: "",
    },
    {
      id: "68d2a31a1c4dd38875bb0382",
      resumeId: DUMMY_RESUME_DATA_ID,
      institution: "Example Academy",
      degree: "SECONDARY SCHOOL",
      field: "",
      schoolYearStartDate: new Date(2013, 6, 1),
      graduationDate: new Date(2017, 2, 1),
      isCurrent: false,
      gpa: "",
    },
  ],
  project: [
    {
      id: "68d4f882c8f0d46dc8a8b139",
      resumeId: DUMMY_RESUME_DATA_ID,
      name: "Team Task Management System",
      type: "Web Application (Productivity Tool)",
      description:
        "TaskTrackr is a collaborative task management system designed for teams to create, assign, track, and manage tasks in real time. ",
    },
    {
      id: "68d4f89dc8f0d46dc8a8b147",
      resumeId: DUMMY_RESUME_DATA_ID,
      name: "EduHub - Online Learning Platform",
      type: "Web Application (EdTech Platform)",
      description:
        "EduHub is an online learning platform where instructors can create courses with video lessons, quizzes, and downloadable resources.",
    },
  ],

  updatedAt: new Date("2025-09-23T13:39:38.395Z"),
  createdAt: new Date("2025-09-23T13:39:38.395Z"),
};

/**
 * Default empty resume template with all required fields initialized.
 * Used as the base structure for creating new resumes.
 * All string fields are empty, arrays contain single empty entries.
 */
export const initialResume: CreateResumeInput = {
  title: "",
  public: false,
  professionalSummary: "",
  template: "classic",
  accentColor: "",
  fontSize: "medium",
  customFontSize: 1,

  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    profession: "",
    image: "",
  },

  skills: [],

  experience: [],

  education: [],

  project: [],
};
