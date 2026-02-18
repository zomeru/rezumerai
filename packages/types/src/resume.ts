/**
 * Available resume template identifiers.
 * Each template has a unique visual design and layout.
 *
 * - "classic": Traditional professional layout
 * - "modern": Contemporary design with bold accents
 * - "minimal": Clean, content-focused design
 * - "minimal_image": Minimal layout with profile image
 */
export type TemplateType = "classic" | "modern" | "minimal" | "minimal_image";

/**
 * Personal contact information and professional identity.
 *
 * @property fullName - Full name of the resume owner
 * @property email - Email address
 * @property phone - Phone number
 * @property location - City, state/country location
 * @property linkedin - LinkedIn profile URL
 * @property website - Personal website or portfolio URL
 * @property profession - Job title or professional designation
 * @property image - Profile image URL
 */
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  profession: string;
  image: string;
}

/**
 * Work experience entry with company and role details.
 *
 * @property _id - Unique identifier for the experience entry
 * @property company - Company name
 * @property position - Job title/position held
 * @property startDate - Start date in YYYY-MM or YYYY-MM-DD format
 * @property endDate - End date ("Present" if current) or YYYY-MM/YYYY-MM-DD
 * @property description - Job responsibilities and achievements
 * @property isCurrent - Whether this is the current position
 */
export interface Experience {
  _id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
}

/**
 * Education entry with institution and degree details.
 *
 * @property _id - Unique identifier for the education entry
 * @property institution - School, college, or university name
 * @property degree - Degree type (e.g., B.S., M.S., Ph.D.)
 * @property field - Field of study or major
 * @property graduationDate - Graduation date in YYYY-MM or YYYY-MM-DD format
 * @property gpa - Grade point average or academic score
 */
export interface Education {
  _id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa: string;
}

/**
 * List of skills or competencies.
 * Array of skill names (e.g., ["JavaScript", "React", "TypeScript"]).
 */
export type Skills = string[];

/**
 * Project portfolio entry with description.
 *
 * @property _id - Unique identifier for the project entry
 * @property name - Project name or title
 * @property type - Project category or type
 * @property description - Project summary and key details
 */
export interface Project {
  _id: string;
  name: string;
  type: string;
  description: string;
}

/**
 * Predefined font size presets for resume rendering.
 * "custom" allows user-defined font sizes via customFontSize field.
 */
export type FontSizePreset = "small" | "medium" | "large" | "custom";

/**
 * Complete resume data structure.
 * Represents a full resume document with all sections.
 *
 * @property _id - Unique resume identifier
 * @property userId - ID of the user who owns this resume
 * @property title - Resume title for identification
 * @property public - Whether the resume is publicly accessible
 * @property professionalSummary - Professional summary or objective statement
 * @property template - Selected resume template identifier
 * @property accentColor - Hex color code for template accent
 * @property fontSize - Font size preset selection
 * @property customFontSize - Custom font size multiplier (when fontSize is "custom")
 * @property updatedAt - Last update timestamp
 * @property createdAt - Creation timestamp
 * @property personalInfo - Contact and personal information
 * @property skills - List of skills
 * @property experience - Work experience entries
 * @property education - Education entries
 * @property project - Project portfolio entries
 */
export interface Resume {
  _id: string;
  userId: string;
  title: string;
  public: boolean;
  professionalSummary: string;
  template: TemplateType;
  accentColor: string;
  fontSize: FontSizePreset;
  customFontSize: number;
  updatedAt: string;
  createdAt: string;

  personalInfo: PersonalInfo;

  skills: Skills;

  experience: Array<Experience>;

  education: Array<Education>;

  project: Array<Project>;
}

/**
 * Default empty resume template with all required fields initialized.
 * Used as the base structure for creating new resumes.
 * All string fields are empty, arrays contain single empty entries.
 */
export const defaultResume: Resume = {
  _id: "",
  userId: "",
  title: "",
  public: false,
  professionalSummary: "",
  template: "classic",
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
      _id: "",
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrent: false,
    },
  ],

  education: [
    {
      _id: "",
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: "",
    },
  ],

  project: [
    {
      _id: "",
      name: "",
      type: "",
      description: "",
    },
  ],
};
