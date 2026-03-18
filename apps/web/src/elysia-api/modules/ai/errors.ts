import { ERROR_MESSAGES } from "@/constants/errors";
import {
  AI_CREDITS_EXHAUSTED_CODE,
  AI_MODEL_POLICY_RESTRICTED_CODE,
  AI_MODEL_UNAVAILABLE_CODE,
  AI_PROVIDER_CIRCUIT_BREAKER_CODE,
} from "./constants";

export class AiCreditsExhaustedError extends Error {
  readonly code: string = AI_CREDITS_EXHAUSTED_CODE;

  constructor() {
    super(ERROR_MESSAGES.AI_CREDITS_EXHAUSTED);
    this.name = "AiCreditsExhaustedError";
  }
}

export class AiModelUnavailableError extends Error {
  readonly code: string = AI_MODEL_UNAVAILABLE_CODE;

  constructor(message = ERROR_MESSAGES.AI_MODEL_UNAVAILABLE) {
    super(message);
    this.name = "AiModelUnavailableError";
  }
}

export class AiModelPolicyRestrictedError extends Error {
  readonly code: string = AI_MODEL_POLICY_RESTRICTED_CODE;

  constructor() {
    super(ERROR_MESSAGES.AI_MODEL_POLICY_RESTRICTED);
    this.name = "AiModelPolicyRestrictedError";
  }
}

export class AiProviderCircuitBreakerError extends Error {
  readonly code: string = AI_PROVIDER_CIRCUIT_BREAKER_CODE;
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(ERROR_MESSAGES.AI_PROVIDER_UNAVAILABLE);
    this.name = "AiProviderCircuitBreakerError";
    this.retryAfterMs = retryAfterMs;
  }
}
