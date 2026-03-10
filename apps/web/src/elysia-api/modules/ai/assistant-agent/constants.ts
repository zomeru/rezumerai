export const MAX_COLLECTION_PREVIEW_ITEMS = 10;

export const replyDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const ASSISTANT_SAFE_RETRIEVAL_REPLY = "I couldn't retrieve that information.";
export const ASSISTANT_ACCESS_DENIED_REPLY = "I don't have access to that information.";
export const ASSISTANT_SIGN_IN_REPLY = "Sign in to access your account data.";
