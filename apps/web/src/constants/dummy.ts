// @ts-nocheck

import type { ResumeWithRelations } from "@rezumerai/types";

/**
 * Sample resume data for testing and demonstration purposes.
 * Contains multiple pre-filled resume examples with complete data.
 */
export const dummyResumeData: ResumeWithRelations[] = [
  {
    // ----------------------------------------------------- Resume 1 ------------------------------------------------------
    id: "68d2a31a1c4dd38875bb037e",
    userId: "68c180acdf1775dfd02c6d87",
    title: "Alex's Resume",
    public: true,
    professionalSummary:
      "Highly analytical Data Analyst with 6 years of experience transforming complex datasets into actionable insights using SQL, Python, and advanced visualization tools. ",
    template: "minimal_image",
    accentColor: "#14B8A6",
    fontSize: "medium",
    customFontSize: 1,
    personalInfo: {
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
        company: "Example Technologies.",
        position: "Senior Full Stack Developer",
        startDate: new Date(2023, 5, 1),
        endDate: null,
        description:
          "Architected, developed, and deployed innovative full-stack applications at Example Technologies.\ncreating robust back-end systems and intuitive front- end interfaces to deliver meaningful digital experiences ",
        isCurrent: true,
        id: "68d2a31a1c4dd38875bb037f",
      },
      {
        company: "Example Technologies.",
        position: "Full Stack Developer",
        startDate: new Date(2019, 7, 1),
        endDate: new Date(2023, 4, 1),
        description:
          "Engineered and deployed scalable full-stack web applications for Example Technologies, translating complex requirements into robust front-end interfaces and efficient back-end services.",
        isCurrent: false,
        id: "68d4f7abc8f0d46dc8a8b114",
      },
    ],
    education: [
      {
        institution: "Example Institute of Technology",
        degree: "B.TECH",
        field: "CSE",
        graduationDate: new Date(2023, 4, 1),
        gpa: "8.7",
        id: "68d2a31a1c4dd38875bb0380",
      },
      {
        institution: "Example Public School",
        degree: "HIGHER SECONDARY",
        field: "PCM",
        graduationDate: new Date(2019, 2, 1),
        gpa: "",
        id: "68d2a31a1c4dd38875bb0381",
      },
      {
        institution: "Example Academy",
        degree: "SECONDARY SCHOOL",
        field: "",
        graduationDate: new Date(2017, 2, 1),
        gpa: "",
        id: "68d2a31a1c4dd38875bb0382",
      },
    ],
    project: [
      {
        name: "Team Task Management System",
        type: "Web Application (Productivity Tool)",
        description:
          "TaskTrackr is a collaborative task management system designed for teams to create, assign, track, and manage tasks in real time. ",
        id: "68d4f882c8f0d46dc8a8b139",
      },
      {
        name: "EduHub - Online Learning Platform",
        type: "Web Application (EdTech Platform)",
        description:
          "EduHub is an online learning platform where instructors can create courses with video lessons, quizzes, and downloadable resources.",
        id: "68d4f89dc8f0d46dc8a8b147",
      },
    ],
    updatedAt: "2025-09-23T13:39:38.395Z",
    createdAt: "2025-09-23T13:39:38.395Z",
  },
  {
    // ----------------------------------------------------- Resume 2 ------------------------------------------------------
    personalInfo: {
      fullName: "Jordan Lee",
      email: "jordan.lee@example.com",
      phone: "0 987654321",
      location: "San Francisco, CA, USA",
      linkedin: "https://www.linkedin.com/in/jordanlee",
      website: "https://www.jordanlee.dev",
      profession: "Frontend Engineer",
      image: "https://avatars.githubusercontent.com/u/19688908?v=4",
    },
    id: "78e3b42c2d5ff49286cc148f",
    userId: "78d2e0bdcf2886efg03e7e98",
    title: "Jordan's Resume",
    public: true,
    professionalSummary:
      "Creative and detail-oriented Frontend Engineer with 5+ years of experience crafting responsive, user-centric web applications using React, Vue, and modern CSS frameworks.",
    skills: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "React",
      "Vue.js",
      "SASS",
      "Tailwind CSS",
      "Figma",
      "Web Accessibility",
      "REST APIs",
    ],
    experience: [
      {
        company: "TechSpark Inc.",
        position: "Lead Frontend Engineer",
        startDate: new Date(2022, 1, 1),
        endDate: null,
        description:
          "Leading a team of frontend developers to build accessible and scalable user interfaces. Collaborated with UX teams to implement design systems and improve frontend performance.",
        isCurrent: true,
        id: "78e3b42c2d5ff49286cc1490",
      },
      {
        company: "PixelForge Labs",
        position: "Frontend Developer",
        startDate: new Date(2018, 8, 1),
        endDate: new Date(2022, 0, 1),
        description:
          "Developed reusable UI components using React and Vue.js. Worked closely with backend teams to integrate REST APIs and optimize SPA performance.",
        isCurrent: false,
        id: "78e3b42c2d5ff49286cc1491",
      },
    ],
    education: [
      {
        institution: "University of Digital Arts",
        degree: "B.Sc.",
        field: "Computer Science",
        graduationDate: new Date(2018, 5, 1),
        gpa: "3.8",
        id: "78e3b42c2d5ff49286cc1492",
      },
      {
        institution: "Lincoln High School",
        degree: "High School Diploma",
        field: "Science",
        graduationDate: new Date(2014, 4, 1),
        gpa: "",
        id: "78e3b42c2d5ff49286cc1493",
      },
    ],
    template: "minimal_image",
    accentColor: "#6366F1",
    fontSize: "medium",
    customFontSize: 1,
    project: [
      {
        name: "FitTrack - Fitness Dashboard",
        type: "Web Application (Health & Fitness)",
        description:
          "FitTrack is a fitness analytics dashboard that allows users to log workouts, track progress, and visualize performance through interactive charts.",
        id: "78e3b42c2d5ff49286cc1494",
      },
      {
        name: "ShopEase - E-commerce UI Kit",
        type: "Frontend UI Kit",
        description:
          "ShopEase is a modular e-commerce frontend template with ready-to-use components for product listing, cart management, and responsive navigation.",
        id: "78e3b42c2d5ff49286cc1495",
      },
    ],
    updatedAt: "2025-09-25T15:10:21.184Z",
    createdAt: "2025-09-25T15:10:21.184Z",
  },
  {
    // ----------------------------------------------------- Resume 3 ------------------------------------------------------
    personalInfo: {
      fullName: "Riley Morgan",
      email: "riley.morgan@example.com",
      phone: "0 1122334455",
      location: "Austin, TX, USA",
      linkedin: "https://www.linkedin.com/in/rileymorgan",
      website: "https://www.rileym.dev",
      profession: "Backend Developer",
      image: "https://avatars.githubusercontent.com/u/19688908?v=4",
    },
    id: "89f4c53d3e6gg59397dd259g",
    userId: "89e3f1cedg3997fgh14f8f09",
    title: "Riley's Resume",
    public: true,
    professionalSummary:
      "Dedicated Backend Developer with 7+ years of experience building secure, high-performance APIs and microservices using Node.js, Python, and PostgreSQL. Passionate about scalability, automation, and clean architecture.",
    skills: ["Node.js", "Python", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "CI/CD", "Redis", "GraphQL", "AWS"],
    experience: [
      {
        company: "DataNest Solutions",
        position: "Senior Backend Engineer",
        startDate: new Date(2021, 2, 1),
        endDate: null,
        description:
          "Developed distributed microservices using Node.js and Docker. Implemented API rate limiting, authentication, and background job processing using Redis and Bull.",
        isCurrent: true,
        id: "89f4c53d3e6gg59397dd259h",
      },
      {
        company: "CloudCore Systems",
        position: "Backend Developer",
        startDate: new Date(2016, 6, 1),
        endDate: new Date(2021, 1, 1),
        description:
          "Maintained and scaled backend systems built on Python and PostgreSQL. Automated deployments with GitLab CI/CD and improved API response time by 35%.",
        isCurrent: false,
        id: "89f4c53d3e6gg59397dd259i",
      },
    ],
    education: [
      {
        institution: "Texas Institute of Technology",
        degree: "B.E.",
        field: "Information Technology",
        graduationDate: new Date(2016, 4, 1),
        gpa: "3.9",
        id: "89f4c53d3e6gg59397dd259j",
      },
      {
        institution: "Central High School",
        degree: "High School Diploma",
        field: "Science",
        graduationDate: new Date(2012, 3, 1),
        gpa: "",
        id: "89f4c53d3e6gg59397dd259k",
      },
    ],
    template: "minimal_image",
    accentColor: "#F59E0B",
    fontSize: "medium",
    customFontSize: 1,
    project: [
      {
        name: "Invoicr - Invoice Management System",
        type: "Web Application (FinTech)",
        description:
          "Invoicr is a secure web platform that allows freelancers and small businesses to generate, track, and automate professional invoices. Built with Node.js, MongoDB, and Stripe integration.",
        id: "89f4c53d3e6gg59397dd259l",
      },
      {
        name: "API Monitor Dashboard",
        type: "DevOps Tool",
        description:
          "A real-time API monitoring dashboard for microservices. Tracks latency, uptime, and error rates using Prometheus and Grafana.",
        id: "89f4c53d3e6gg59397dd259m",
      },
    ],
    updatedAt: "2025-09-25T15:26:49.652Z",
    createdAt: "2025-09-25T15:26:49.652Z",
  },
];

/**
 * Default empty resume template with all required fields initialized.
 * Used as the base structure for creating new resumes.
 * All string fields are empty, arrays contain single empty entries.
 */
export const defaultResume: ResumeWithRelations = {
  id: "",
  userId: "",
  title: "",
  public: false,
  professionalSummary: "",
  template: "",
  accentColor: "",
  fontSize: "medium",
  customFontSize: 1,
  updatedAt: "",
  createdAt: "",

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

  experience: [
    {
      id: "",
      company: "",
      position: "",
      startDate: new Date(),
      endDate: null,
      description: "",
      isCurrent: false,
    },
  ],

  education: [
    {
      id: "",
      institution: "",
      degree: "",
      field: "",
      graduationDate: new Date(),
      gpa: "",
    },
  ],

  project: [
    {
      id: "",
      name: "",
      type: "",
      description: "",
    },
  ],
};
