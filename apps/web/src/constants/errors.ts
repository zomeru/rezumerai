export const ERROR_MESSAGES = {
  // Experience validation
  EXPERIENCE_END_DATE_REQUIRED: "End date is required for non-current positions.",
  EXPERIENCE_POSITION_REQUIRED: "Position is required.",
  EXPERIENCE_COMPANY_REQUIRED: "Company is required.",
  EXPERIENCE_START_DATE_REQUIRED: "Start date is required.",

  // Project validation
  PROJECT_NAME_REQUIRED: "Project name is required.",

  // Education validation
  EDUCATION_INSTITUTION_REQUIRED: "Institution is required.",
  EDUCATION_DEGREE_REQUIRED: "Degree is required.",
  EDUCATION_SCHOOL_YEAR_START_DATE_REQUIRED: "School year start date is required.",
  EDUCATION_GRADUATION_DATE_MUST_BE_NULL: "Graduation date must be empty when currently studying.",
  EDUCATION_GRADUATION_DATE_REQUIRED: "Graduation date is required for non-current education entries.",

  // Personal info validation
  PERSONAL_INFO_FULL_NAME_REQUIRED: "Full name is required.",
  PERSONAL_INFO_EMAIL_REQUIRED: "Email is required.",
  PERSONAL_INFO_PHONE_REQUIRED: "Phone number is required.",
  PERSONAL_INFO_LOCATION_REQUIRED: "Location is required.",
  PERSONAL_INFO_PROFESSION_REQUIRED: "Profession is required.",
  PERSONAL_INFO_LINKEDIN_REQUIRED: "LinkedIn URL is required.",
  PERSONAL_INFO_EMAIL_INVALID: "Please enter a valid email address.",
  PERSONAL_INFO_PHONE_INVALID: "Please enter a valid phone number.",
  PERSONAL_INFO_LINKEDIN_INVALID: "Please enter a valid LinkedIn URL.",
  PERSONAL_INFO_WEBSITE_INVALID: "Please enter a valid website URL.",

  // AI feature validation - need to be signed in to access
  AI_AUTH_REQUIRED: "You must be signed in to access this feature.",
  AI_EMPTY_INPUT: "Text input cannot be empty.",
  AI_CREDITS_EXHAUSTED: "You have reached the daily limit of 100 AI text optimizations. Please try again tomorrow.",

  // Unknown error
  UNKNOWN_ERROR: "An unknown error occurred. Please try again.",
};
