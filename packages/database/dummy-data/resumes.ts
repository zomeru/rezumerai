import type { Prisma } from "../";

export const dummyResumeData: Prisma.ResumeCreateInput[] = [
  {
    // ----------------------------------------------------- Resume 1 ------------------------------------------------------
    user: {
      connect: {
        id: "cmlmajxkm0000dvjw2b3b2mvu",
      },
    },
    personalInfo: {
      create: {
        fullName: "Alex Smith",
        email: "alex@example.com",
        phone: "0 123456789",
        location: "NY, USA",
        linkedin: "https://www.linkedin.com",
        website: "https://www.example.com",
        profession: "Full Stack Developer",
        image: "https://avatars.githubusercontent.com/u/19688908?v=4",
      },
    },
    title: "Alex's Resume",
    public: true,
    professionalSummary:
      "Highly analytical Data Analyst with 6 years of experience transforming complex datasets into actionable insights using SQL, Python, and advanced visualization tools. ",
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
    experience: {
      create: [
        {
          company: "Example Technologies.",
          position: "Senior Full Stack Developer",
          startDate: "2023-06",
          endDate: "Present",
          description:
            "Architected, developed, and deployed innovative full-stack applications at Example Technologies.\ncreating robust back-end systems and intuitive front- end interfaces to deliver meaningful digital experiences ",
          isCurrent: true,
        },
        {
          company: "Example Technologies.",
          position: "Full Stack Developer",
          startDate: "2019-08",
          endDate: "2023-05",
          description:
            "Engineered and deployed scalable full-stack web applications for Example Technologies, translating complex requirements into robust front-end interfaces and efficient back-end services.",
          isCurrent: false,
        },
      ],
    },
    education: {
      create: [
        {
          institution: "Example Institute of Technology",
          degree: "B.TECH",
          field: "CSE",
          graduationDate: "2023-05",
          gpa: "8.7",
        },
        {
          institution: "Example Public School",
          degree: "HIGHER SECONDARY",
          field: "PCM",
          graduationDate: "2019-03",
          gpa: "",
        },
        {
          institution: "Example Academy",
          degree: "SECONDARY SCHOOL",
          field: "",
          graduationDate: "2017-03",
          gpa: "",
        },
      ],
    },
    template: "minimal_image",
    accentColor: "#14B8A6",
    fontSize: "medium",
    customFontSize: 1,
    project: {
      create: [
        {
          name: "Team Task Management System",
          type: "Web Application (Productivity Tool)",
          description:
            "TaskTrackr is a collaborative task management system designed for teams to create, assign, track, and manage tasks in real time. ",
        },
        {
          name: "EduHub - Online Learning Platform",
          type: "Web Application (EdTech Platform)",
          description:
            "EduHub is an online learning platform where instructors can create courses with video lessons, quizzes, and downloadable resources.",
        },
      ],
    },
    updatedAt: new Date("2025-09-23T13:39:38.395Z"),
    createdAt: new Date("2025-09-23T13:39:38.395Z"),
  },
  {
    // ----------------------------------------------------- Resume 2 ------------------------------------------------------
    user: {
      connect: {
        id: "cmlmajxkm0000dvjw2b3b2mvu",
      },
    },
    personalInfo: {
      create: {
        fullName: "Jordan Lee",
        email: "jordan.lee@example.com",
        phone: "0 987654321",
        location: "San Francisco, CA, USA",
        linkedin: "https://www.linkedin.com/in/jordanlee",
        website: "https://www.jordanlee.dev",
        profession: "Frontend Engineer",
        image: "https://avatars.githubusercontent.com/u/19688908?v=4",
      },
    },
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
    experience: {
      create: [
        {
          company: "TechSpark Inc.",
          position: "Lead Frontend Engineer",
          startDate: "2022-02",
          endDate: "Present",
          description:
            "Leading a team of frontend developers to build accessible and scalable user interfaces. Collaborated with UX teams to implement design systems and improve frontend performance.",
          isCurrent: true,
        },
        {
          company: "PixelForge Labs",
          position: "Frontend Developer",
          startDate: "2018-09",
          endDate: "2022-01",
          description:
            "Developed reusable UI components using React and Vue.js. Worked closely with backend teams to integrate REST APIs and optimize SPA performance.",
          isCurrent: false,
        },
      ],
    },
    education: {
      create: [
        {
          institution: "University of Digital Arts",
          degree: "B.Sc.",
          field: "Computer Science",
          graduationDate: "2018-06",
          gpa: "3.8",
        },
        {
          institution: "Lincoln High School",
          degree: "High School Diploma",
          field: "Science",
          graduationDate: "2014-05",
          gpa: "",
        },
      ],
    },
    template: "minimal_image",
    accentColor: "#6366F1",
    fontSize: "medium",
    customFontSize: 1,
    project: {
      create: [
        {
          name: "FitTrack - Fitness Dashboard",
          type: "Web Application (Health & Fitness)",
          description:
            "FitTrack is a fitness analytics dashboard that allows users to log workouts, track progress, and visualize performance through interactive charts.",
        },
        {
          name: "ShopEase - E-commerce UI Kit",
          type: "Frontend UI Kit",
          description:
            "ShopEase is a modular e-commerce frontend template with ready-to-use components for product listing, cart management, and responsive navigation.",
        },
      ],
    },
    updatedAt: new Date("2025-09-25T15:10:21.184Z"),
    createdAt: new Date("2025-09-25T15:10:21.184Z"),
  },
  {
    // ----------------------------------------------------- Resume 3 ------------------------------------------------------
    user: {
      connect: {
        id: "cmlmajxkm0000dvjw2b3b2mvu",
      },
    },
    personalInfo: {
      create: {
        fullName: "Riley Morgan",
        email: "riley.morgan@example.com",
        phone: "0 1122334455",
        location: "Austin, TX, USA",
        linkedin: "https://www.linkedin.com/in/rileymorgan",
        website: "https://www.rileym.dev",
        profession: "Backend Developer",
        image: "https://avatars.githubusercontent.com/u/19688908?v=4",
      },
    },
    title: "Riley's Resume",
    public: true,
    professionalSummary:
      "Dedicated Backend Developer with 7+ years of experience building secure, high-performance APIs and microservices using Node.js, Python, and PostgreSQL. Passionate about scalability, automation, and clean architecture.",
    skills: ["Node.js", "Python", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "CI/CD", "Redis", "GraphQL", "AWS"],
    experience: {
      create: [
        {
          company: "DataNest Solutions",
          position: "Senior Backend Engineer",
          startDate: "2021-03",
          endDate: "Present",
          description:
            "Developed distributed microservices using Node.js and Docker. Implemented API rate limiting, authentication, and background job processing using Redis and Bull.",
          isCurrent: true,
        },
        {
          company: "CloudCore Systems",
          position: "Backend Developer",
          startDate: "2016-07",
          endDate: "2021-02",
          description:
            "Maintained and scaled backend systems built on Python and PostgreSQL. Automated deployments with GitLab CI/CD and improved API response time by 35%.",
          isCurrent: false,
        },
      ],
    },
    education: {
      create: [
        {
          institution: "Texas Institute of Technology",
          degree: "B.E.",
          field: "Information Technology",
          graduationDate: "2016-05",
          gpa: "3.9",
        },
        {
          institution: "Central High School",
          degree: "High School Diploma",
          field: "Science",
          graduationDate: "2012-04",
          gpa: "",
        },
      ],
    },
    template: "minimal_image",
    accentColor: "#F59E0B",
    fontSize: "medium",
    customFontSize: 1,
    project: {
      create: [
        {
          name: "Invoicr - Invoice Management System",
          type: "Web Application (FinTech)",
          description:
            "Invoicr is a secure web platform that allows freelancers and small businesses to generate, track, and automate professional invoices. Built with Node.js, MongoDB, and Stripe integration.",
        },
        {
          name: "API Monitor Dashboard",
          type: "DevOps Tool",
          description:
            "A real-time API monitoring dashboard for microservices. Tracks latency, uptime, and error rates using Prometheus and Grafana.",
        },
      ],
    },
    updatedAt: new Date("2025-09-25T15:26:49.652Z"),
    createdAt: new Date("2025-09-25T15:26:49.652Z"),
  },
];
