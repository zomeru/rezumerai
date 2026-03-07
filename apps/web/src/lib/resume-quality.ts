import type { ResumeWithRelationsInputUpdate } from "@rezumerai/types";

export interface ResumeQualityIssue {
  type: "placeholder" | "junk" | "repetition" | "malformed" | "test";
  excerpt: string;
}

const PLACEHOLDER_PATTERNS = [
  /\blorem ipsum\b/i,
  /\b(tbd|todo|n\/a)\b/i,
  /\b(insert|add|replace)\s+(text|details|summary|experience|bullet)s?\b/i,
  /\b(your name|company name|job title|school name)\b/i,
  /\bsummary here\b/i,
];

const TEST_PATTERNS = [/\btest(?:ing)?123\b/i, /\b(?:asdf|qwerty|foo bar|sample text)\b/i];
const MALFORMED_PATTERNS = [/\bwith out\b/i, /\ba lot of of\b/i, /\binorder to\b/i];

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|ul|ol|h\d)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function collectResumeText(input: ResumeWithRelationsInputUpdate): string[] {
  const values: string[] = [];

  const pushString = (value: unknown): void => {
    if (typeof value !== "string") {
      return;
    }

    const normalized = stripHtml(value);
    if (normalized) {
      values.push(normalized);
    }
  };

  pushString(input.title);
  pushString(input.professionalSummary);

  input.skills?.forEach((skill) => {
    pushString(skill);
  });
  input.experience?.forEach((item) => {
    pushString(item.position);
    pushString(item.company);
    pushString(item.description);
  });
  input.education?.forEach((item) => {
    pushString(item.institution);
    pushString(item.degree);
    pushString(item.field);
  });
  input.project?.forEach((item) => {
    pushString(item.name);
    pushString(item.type);
    pushString(item.description);
  });
  if (input.personalInfo) {
    pushString(input.personalInfo.fullName);
    pushString(input.personalInfo.location);
    pushString(input.personalInfo.profession);
  }

  return values;
}

function findPatternMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      return match[0];
    }
  }

  return null;
}

function findRepeatedToken(text: string): string | null {
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);

  for (let index = 0; index < tokens.length - 3; index += 1) {
    const current = tokens[index];
    if (current && tokens[index + 1] === current && tokens[index + 2] === current) {
      return tokens.slice(index, index + 4).join(" ");
    }
  }

  return null;
}

function findRepeatedPhrase(text: string): string | null {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);

  for (let index = 0; index < words.length - 5; index += 1) {
    const phrase = words.slice(index, index + 2).join(" ");
    const next = words.slice(index + 2, index + 4).join(" ");
    const after = words.slice(index + 4, index + 6).join(" ");

    if (phrase.length > 3 && phrase === next && phrase === after) {
      return `${phrase} ${next} ${after}`;
    }
  }

  return null;
}

function findJunkContent(text: string): string | null {
  const normalized = text.toLowerCase();
  const shortNoiseMatches = normalized.match(/\b[a-z]{1,2}\b/g) ?? [];

  if (shortNoiseMatches.length >= 10 && shortNoiseMatches.length / normalized.split(/\s+/).length > 0.45) {
    return shortNoiseMatches.slice(0, 8).join(" ");
  }

  const symbols = normalized.match(/[~`^*_=]{4,}/g);
  if (symbols?.[0]) {
    return symbols[0];
  }

  return null;
}

export function detectResumeQualityIssues(input: ResumeWithRelationsInputUpdate): ResumeQualityIssue[] {
  const issues: ResumeQualityIssue[] = [];

  for (const text of collectResumeText(input)) {
    const placeholder = findPatternMatch(text, PLACEHOLDER_PATTERNS);
    if (placeholder) {
      issues.push({ type: "placeholder", excerpt: placeholder });
      continue;
    }

    const test = findPatternMatch(text, TEST_PATTERNS);
    if (test) {
      issues.push({ type: "test", excerpt: test });
      continue;
    }

    const malformed = findPatternMatch(text, MALFORMED_PATTERNS);
    if (malformed) {
      issues.push({ type: "malformed", excerpt: malformed });
      continue;
    }

    const repeated = findRepeatedToken(text) ?? findRepeatedPhrase(text);
    if (repeated) {
      issues.push({ type: "repetition", excerpt: repeated });
      continue;
    }

    const junk = findJunkContent(text);
    if (junk) {
      issues.push({ type: "junk", excerpt: junk });
    }
  }

  return issues.slice(0, 5);
}
