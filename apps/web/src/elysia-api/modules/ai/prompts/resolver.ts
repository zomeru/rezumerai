import type { AiConfiguration, AssistantRoleScope } from "@rezumerai/types";
import { DEFAULT_AI_CONFIGURATION } from "@rezumerai/types";
import { type AiPromptWorkflow, composeAiSystemPrompt } from "./composer";

type TextOptimizerWorkflow = {
  feature: "text-optimizer";
  action: "optimize";
};

type ComposedWorkflowPromptOptions = {
  config: AiConfiguration;
  currentPath?: string;
  memoryContext?: string | null;
  ragContext?: string | null;
  scope: AssistantRoleScope;
  toolNames: string[];
  workflow: AiPromptWorkflow;
};

type RawWorkflowPromptOptions = {
  config: AiConfiguration;
  workflow: TextOptimizerWorkflow;
};

export type ResolveAiSystemPromptOptions = ComposedWorkflowPromptOptions | RawWorkflowPromptOptions;

function isRawWorkflowPromptOptions(options: ResolveAiSystemPromptOptions): options is RawWorkflowPromptOptions {
  return options.workflow.feature === "text-optimizer";
}

function resolveBaseSystemPrompt(config: AiConfiguration, workflow: AiPromptWorkflow | TextOptimizerWorkflow): string {
  if (workflow.feature === "assistant") {
    return config.ASSISTANT_SYSTEM_PROMPT || DEFAULT_AI_CONFIGURATION.ASSISTANT_SYSTEM_PROMPT;
  }

  if (workflow.feature === "text-optimizer") {
    return config.TEXT_OPTIMIZER_SYSTEM_PROMPT || DEFAULT_AI_CONFIGURATION.TEXT_OPTIMIZER_SYSTEM_PROMPT;
  }

  switch (workflow.action) {
    case "optimize":
      return (
        config.RESUME_COPILOT_OPTIMIZE_SYSTEM_PROMPT || DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_OPTIMIZE_SYSTEM_PROMPT
      );
    case "tailor":
      return config.RESUME_COPILOT_TAILOR_SYSTEM_PROMPT || DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_TAILOR_SYSTEM_PROMPT;
    case "review":
      return config.RESUME_COPILOT_REVIEW_SYSTEM_PROMPT || DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_REVIEW_SYSTEM_PROMPT;
  }
}

export function resolveAiSystemPrompt(options: ResolveAiSystemPromptOptions): string {
  const baseSystemPrompt = resolveBaseSystemPrompt(options.config, options.workflow).trim();

  if (isRawWorkflowPromptOptions(options)) {
    return baseSystemPrompt;
  }

  return composeAiSystemPrompt({
    baseSystemPrompt,
    currentPath: options.currentPath,
    memoryContext: options.memoryContext,
    ragContext: options.ragContext,
    scope: options.scope,
    toolNames: options.toolNames,
    workflow: options.workflow,
  });
}
