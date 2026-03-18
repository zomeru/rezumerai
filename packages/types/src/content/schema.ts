import { z } from "zod";

export const SYSTEM_CONFIGURATION_KEYS = {
  AI_CONFIG: "AI_CONFIG",
  AI_CIRCUIT_BREAKER_CONFIG: "AI_CIRCUIT_BREAKER_CONFIG",
  GLOBAL_CONFIG: "GLOBAL_CONFIG",
  TOS_INFORMATION: "TOS_INFORMATION",
  PRIVACY_POLICY_INFORMATION: "PRIVACY_POLICY_INFORMATION",
  FAQ_INFORMATION: "FAQ_INFORMATION",
  ABOUT_US_INFORMATION: "ABOUT_US_INFORMATION",
  CONTACT_INFORMATION: "CONTACT_INFORMATION",
  LANDING_PAGE_INFORMATION: "LANDING_PAGE_INFORMATION",
} as const;

/**
 * AI Circuit Breaker configuration schema.
 * Controls the circuit breaker behavior for AI provider calls.
 * Uses SCREAMING_SNAKE_CASE for database consistency.
 */
export const AiCircuitBreakerConfigSchema = z.object({
  /** Enable/disable the circuit breaker */
  ENABLED: z.boolean().default(true),
  /** Number of consecutive failures before opening the circuit */
  FAILURE_THRESHOLD: z.number().int().positive().default(5),
  /** Time in milliseconds before attempting reset (open → half-open) */
  RESET_TIMEOUT_MS: z.number().int().positive().default(60000),
  /** Timeout for individual AI provider requests in milliseconds */
  EXECUTION_TIMEOUT_MS: z.number().int().positive().default(30000),
  /** Successful calls needed in half-open state to close circuit */
  HALF_OPEN_SUCCESS_THRESHOLD: z.number().int().positive().default(2),
});

export type AiCircuitBreakerConfig = z.infer<typeof AiCircuitBreakerConfigSchema>;

/**
 * Default AI circuit breaker configuration.
 */
export const DEFAULT_AI_CIRCUIT_BREAKER_CONFIG: AiCircuitBreakerConfig = {
  ENABLED: true,
  FAILURE_THRESHOLD: 5,
  RESET_TIMEOUT_MS: 60000,
  EXECUTION_TIMEOUT_MS: 30000,
  HALF_OPEN_SUCCESS_THRESHOLD: 2,
};

export const PublicContentTopicSchema = z.enum(["landing", "terms", "privacy", "faq", "about", "contact"]);

export const DocumentSectionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  heading: z.string().trim().min(1).max(140),
  paragraphs: z.array(z.string().trim().min(1).max(1000)).min(1).max(12),
  bullets: z.array(z.string().trim().min(1).max(400)).max(12).default([]),
});

export const ContentCardSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(500),
  items: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
});

export const ContentCtaSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(200),
});

export const ContentPageSchema = z.object({
  title: z.string().trim().min(1).max(140),
  summary: z.string().trim().min(1).max(600),
  lastUpdated: z.string().trim().min(1).max(40),
  sections: z.array(DocumentSectionSchema).min(1).max(16),
  cards: z.array(ContentCardSchema).max(6).default([]),
  cta: ContentCtaSchema.nullable().default(null),
});

export const FaqItemSchema = z.object({
  id: z.string().trim().min(1).max(100),
  question: z.string().trim().min(1).max(220),
  answer: z.string().trim().min(1).max(1000),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
});

export const FaqCategorySchema = z.object({
  id: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(120),
  items: z.array(FaqItemSchema).min(1).max(20),
});

export const FaqInformationSchema = z.object({
  title: z.string().trim().min(1).max(140),
  summary: z.string().trim().min(1).max(600),
  categories: z.array(FaqCategorySchema).min(1).max(10),
});

export const LandingFeatureIconSchema = z.enum(["sparkles", "target", "file-text", "shield", "messages"]);

export const LandingFeatureItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(260),
  icon: LandingFeatureIconSchema,
});

export const LandingWorkflowItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(260),
});

export const LandingPageInformationSchema = z.object({
  bannerTag: z.string().trim().min(1).max(120),
  hero: z.object({
    title: z.string().trim().min(1).max(220),
    description: z.string().trim().min(1).max(500),
    primaryCtaLabel: z.string().trim().min(1).max(60),
    secondaryCtaLabel: z.string().trim().min(1).max(60),
    trustBadges: z.array(z.string().trim().min(1).max(100)).min(1).max(6),
  }),
  featureSection: z.object({
    eyebrow: z.string().trim().min(1).max(60),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(400),
    items: z.array(LandingFeatureItemSchema).min(3).max(6),
  }),
  workflowSection: z.object({
    eyebrow: z.string().trim().min(1).max(60),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(400),
    items: z.array(LandingWorkflowItemSchema).min(3).max(8),
  }),
  ctaSection: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(320),
    primaryCtaLabel: z.string().trim().min(1).max(60),
    primaryCtaHref: z.string().trim().min(1).max(200),
  }),
  footer: z.object({
    description: z.string().trim().min(1).max(320),
  }),
});

export type PublicContentTopic = z.infer<typeof PublicContentTopicSchema>;
export type DocumentSection = z.infer<typeof DocumentSectionSchema>;
export type ContentCard = z.infer<typeof ContentCardSchema>;
export type ContentCta = z.infer<typeof ContentCtaSchema>;
export type ContentPage = z.infer<typeof ContentPageSchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
export type FaqCategory = z.infer<typeof FaqCategorySchema>;
export type FaqInformation = z.infer<typeof FaqInformationSchema>;
export type LandingFeatureIcon = z.infer<typeof LandingFeatureIconSchema>;
export type LandingFeatureItem = z.infer<typeof LandingFeatureItemSchema>;
export type LandingWorkflowItem = z.infer<typeof LandingWorkflowItemSchema>;
export type LandingPageInformation = z.infer<typeof LandingPageInformationSchema>;

export const DEFAULT_TERMS_CONTENT = ContentPageSchema.parse({
  title: "Terms of Service",
  summary:
    "These terms explain how Rezumerai can be used, what you are responsible for when creating resume content, and how AI suggestions must be reviewed before use.",
  lastUpdated: "March 7, 2026",
  sections: [
    {
      id: "overview",
      heading: "Service overview",
      paragraphs: [
        "Rezumerai provides a resume builder, resume management tools, and optional AI assistance for drafting, reviewing, and tailoring resume content.",
        "You remain responsible for the truthfulness, legality, and accuracy of any resume or job application material you create, upload, edit, or export through the service.",
      ],
    },
    {
      id: "accounts",
      heading: "Accounts and eligibility",
      paragraphs: [
        "You must provide accurate registration information and maintain the security of your account credentials.",
        "You may not use Rezumerai to impersonate another person, evade hiring platform rules, or submit fraudulent employment information.",
      ],
    },
    {
      id: "ai-use",
      heading: "AI assistance and review",
      paragraphs: [
        "AI suggestions are provided to help with wording, structure, and relevance. They are not legal, career, or hiring guarantees.",
        "You must review every AI-generated change before saving, exporting, or sharing a resume. Rezumerai does not guarantee that AI output is complete, accurate, or suitable for a specific role.",
      ],
      bullets: [
        "Do not rely on AI suggestions to invent experience, achievements, metrics, dates, or employers.",
        "Use AI output only as a draft that you verify and edit.",
      ],
    },
    {
      id: "acceptable-use",
      heading: "Acceptable use",
      paragraphs: [
        "You may not abuse the service, interfere with platform security, scrape restricted data, or attempt to gain unauthorized access to user, admin, or system data.",
        "We may suspend or restrict access if we detect fraud, misuse, security threats, or violations of these terms.",
      ],
    },
    {
      id: "credits-billing",
      heading: "Credits and usage limits",
      paragraphs: [
        "AI-powered features may be subject to credits, rate limits, or internal abuse-prevention rules. Available credits and limits may change over time.",
        "Unused credits do not create a property right unless explicitly stated in a separate paid plan or written commercial agreement.",
      ],
    },
    {
      id: "termination",
      heading: "Termination",
      paragraphs: [
        "You may stop using Rezumerai at any time. We may suspend or terminate access when reasonably necessary to protect users, the platform, or our partners.",
        "We may update the product, remove features, or revise these terms as the service evolves.",
      ],
    },
  ],
  cards: [],
  cta: { label: "Contact support", href: "/contact" },
});

export const DEFAULT_PRIVACY_CONTENT = ContentPageSchema.parse({
  title: "Privacy Policy",
  summary:
    "This policy describes what Rezumerai stores, how resume and account data are processed, and the limits placed on AI access to personal information.",
  lastUpdated: "March 7, 2026",
  sections: [
    {
      id: "information-we-collect",
      heading: "Information we collect",
      paragraphs: [
        "We collect account details such as your name, email address, authentication metadata, and the resume content you choose to create or upload.",
        "We also collect operational data such as usage analytics, error logs, and audit records needed to secure the platform and support the service.",
      ],
    },
    {
      id: "how-we-use-data",
      heading: "How we use data",
      paragraphs: [
        "We use your information to authenticate your account, store and render resume drafts, generate PDFs, provide AI-assisted features, and improve platform reliability.",
        "Admin users may access limited system data to operate the service, investigate incidents, and support users under role-based access controls.",
      ],
    },
    {
      id: "ai-processing",
      heading: "AI processing",
      paragraphs: [
        "When you use AI features, Rezumerai sends only the minimum content needed to complete the requested task, such as a selected resume section or a compact summary of your resume.",
        "AI features do not directly save changes to your account without explicit application logic and your review.",
      ],
      bullets: [
        "Transactional user data is accessed with direct database queries and ownership checks.",
        "Public help and marketing content may be searched for assistant responses.",
      ],
    },
    {
      id: "sharing",
      heading: "Information sharing",
      paragraphs: [
        "We do not sell your personal information. We may share data with infrastructure, hosting, authentication, analytics, and AI service providers that help us operate Rezumerai.",
        "We may disclose information when required by law, to enforce platform rules, or to protect rights, safety, and security.",
      ],
    },
    {
      id: "retention",
      heading: "Retention and security",
      paragraphs: [
        "We retain data for as long as needed to provide the service, comply with legal obligations, resolve disputes, and enforce agreements.",
        "We apply role-based access controls, audit logging, and operational monitoring to reduce unauthorized access and misuse.",
      ],
    },
  ],
  cards: [],
  cta: { label: "Review FAQ", href: "/faq" },
});

export const DEFAULT_ABOUT_CONTENT = ContentPageSchema.parse({
  title: "About Rezumerai",
  summary:
    "Rezumerai helps job seekers build stronger resumes with structured editing, AI-assisted refinement, and reviewable suggestions that keep users in control.",
  lastUpdated: "March 7, 2026",
  sections: [
    {
      id: "mission",
      heading: "Our mission",
      paragraphs: [
        "Applying for jobs is stressful enough without fighting a blank page, clunky formatting, or generic resume advice. Rezumerai is built to make resume writing clearer, faster, and more grounded in reality.",
        "We focus on practical tools that help users present real experience well instead of generating inflated or misleading claims.",
      ],
    },
    {
      id: "product-principles",
      heading: "How we build",
      paragraphs: [
        "We favor structured editing, transparent AI suggestions, and pragmatic product decisions that support real job-search workflows.",
      ],
      bullets: [
        "Users stay in control of every saved change.",
        "AI suggestions should be concise, reviewable, and safe.",
        "Product content should be centrally managed and ready for admin editing.",
      ],
    },
  ],
  cards: [
    {
      title: "Built for practical outcomes",
      description: "The product is designed to help users move from draft to application-ready resume faster.",
      items: ["Structured resume builder", "Role-aware assistant", "Tailored, reviewable AI suggestions"],
    },
    {
      title: "Safety over hype",
      description: "Resume content must remain grounded in real experience and user review.",
      items: ["No silent AI saves", "Ownership checks", "Admin auditing for sensitive access"],
    },
  ],
  cta: { label: "Get started", href: "/signup" },
});

export const DEFAULT_CONTACT_CONTENT = ContentPageSchema.parse({
  title: "Contact",
  summary: "Need product help, support, or a privacy-related follow-up? Reach out through the channels below.",
  lastUpdated: "March 7, 2026",
  sections: [
    {
      id: "support",
      heading: "Support",
      paragraphs: [
        "For account help, resume issues, or feature questions, contact the Rezumerai support team and include the email tied to your account when possible.",
      ],
    },
    {
      id: "privacy",
      heading: "Privacy requests",
      paragraphs: [
        "If you have a privacy, data-access, or deletion request, contact us with the subject line 'Privacy Request' so we can route the request quickly.",
      ],
    },
  ],
  cards: [
    {
      title: "General support",
      description: "Best for product questions, bug reports, and billing or credits issues.",
      items: ["Email: support@rezumerai.com", "Typical response window: 1-2 business days"],
    },
    {
      title: "Privacy and security",
      description: "Best for privacy requests, account access issues, or security concerns.",
      items: ["Email: privacy@rezumerai.com", "Include relevant account or incident details"],
    },
  ],
  cta: { label: "Read the privacy policy", href: "/privacy" },
});

export const DEFAULT_FAQ_CONTENT = FaqInformationSchema.parse({
  title: "Frequently Asked Questions",
  summary: "Answers about resume creation, AI suggestions, credits, exports, privacy, and account access.",
  categories: [
    {
      id: "product",
      title: "Product basics",
      items: [
        {
          id: "what-is-rezumerai",
          question: "What does Rezumerai do?",
          answer:
            "Rezumerai is a resume builder that helps you create, edit, review, tailor, and export resumes with optional AI assistance.",
          tags: ["product", "resume builder", "features"],
        },
        {
          id: "how-ai-works",
          question: "How does the AI help with my resume?",
          answer:
            "The AI can suggest clearer wording, review quality, and help tailor sections to a job description, but you review every suggestion before applying it.",
          tags: ["ai", "copilot", "review"],
        },
      ],
    },
    {
      id: "credits",
      title: "Credits and limits",
      items: [
        {
          id: "what-are-credits",
          question: "What are optimization credits?",
          answer:
            "Optimization credits are the daily allowance used for AI-powered resume improvement actions such as rewriting, tailoring, and review requests.",
          tags: ["credits", "limits", "ai"],
        },
        {
          id: "credits-reset",
          question: "When do credits reset?",
          answer: "Credits reset daily based on the app's configured daily credit window.",
          tags: ["credits", "reset"],
        },
      ],
    },
    {
      id: "privacy",
      title: "Privacy and safety",
      items: [
        {
          id: "is-my-data-shared",
          question: "Does the assistant have access to my data?",
          answer:
            "Only when you are signed in and only within the scope allowed for your role. Public users get product-only answers, regular users can access only their own data, and admins get audited admin access.",
          tags: ["privacy", "assistant", "security"],
        },
        {
          id: "does-ai-save",
          question: "Can AI save changes to my resume automatically?",
          answer:
            "No. AI suggestions are returned as reviewable drafts. Final resume changes still go through explicit save logic and validation.",
          tags: ["ai", "safety", "saving"],
        },
      ],
    },
  ],
});

export const DEFAULT_LANDING_PAGE_CONTENT = LandingPageInformationSchema.parse({
  bannerTag: "Early access - feedback welcome",
  hero: {
    title: "Build a resume you are proud to send with reviewable AI help.",
    description:
      "Create structured resumes, improve sections with Resume Copilot, tailor drafts to job descriptions, and keep every change under your control.",
    primaryCtaLabel: "Get started",
    secondaryCtaLabel: "View sample",
    trustBadges: ["Structured resume builder", "Reviewable AI suggestions", "Role-aware app assistant"],
  },
  featureSection: {
    eyebrow: "What it does",
    title: "A resume workflow built for real applications",
    description:
      "Use one workspace to write, refine, review, tailor, and export resumes without losing control of your content.",
    items: [
      {
        title: "Resume Copilot",
        description:
          "Optimize a section, review quality, or tailor your draft to a job post with compact, structured suggestions.",
        icon: "sparkles",
      },
      {
        title: "Targeted tailoring",
        description: "Match your resume against a role and focus on gaps, strengths, and safe wording improvements.",
        icon: "target",
      },
      {
        title: "Clean exports",
        description: "Choose a polished template and export a professional PDF when you are ready to apply.",
        icon: "file-text",
      },
    ],
  },
  workflowSection: {
    eyebrow: "How it works",
    title: "From draft to application-ready",
    description:
      "Rezumerai keeps the workflow simple: edit structured content, ask for focused help, review suggestions, then save and export.",
    items: [
      {
        title: "Start from your current resume",
        description: "Paste or build from scratch without blank-page pressure.",
      },
      {
        title: "Improve one section at a time",
        description: "Optimize only the piece you need instead of paying to rewrite the whole document.",
      },
      {
        title: "Tailor for a role safely",
        description: "Use the job description to align emphasis without inventing qualifications.",
      },
      { title: "Review before you save", description: "Every AI change stays a draft until you choose to apply it." },
    ],
  },
  ctaSection: {
    title: "Build faster, review smarter, and stay in control.",
    description:
      "Create your next resume draft with structured editing and a role-aware assistant that fits the whole app.",
    primaryCtaLabel: "Create my resume",
    primaryCtaHref: "/signup",
  },
  footer: {
    description:
      "Rezumerai is an AI-assisted resume builder for job seekers, career changers, and professionals who want clearer, safer resume support.",
  },
});
