import { ERROR_MESSAGES } from "@/constants/errors";

interface AiFeatureAccessState {
  emailVerified?: boolean | null;
  isAnonymous?: boolean | null;
}

export function getAiFeatureAccessMessage(state: AiFeatureAccessState): string | null {
  if (state.isAnonymous === true) {
    return ERROR_MESSAGES.AI_AUTH_REQUIRED;
  }

  if (state.emailVerified === false) {
    return ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED;
  }

  return null;
}
