import { z } from "zod";

export const AiConfigurationSchema = z.object({
  PROMPT_VERSION: z.string().trim().min(1).max(100),
  DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: z.number().int().min(1).max(1000),
  OPTIMIZE_SYSTEM_PROMPT: z.string().trim().min(1).max(10000),
});

export const AiModelOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  modelId: z.string(),
  providerName: z.string(),
  providerDisplayName: z.string(),
});

export const AiSettingsSchema = z.object({
  models: z.array(AiModelOptionSchema),
  selectedModelId: z.string(),
  isAdmin: z.boolean(),
  config: AiConfigurationSchema.nullable(),
});

export const SelectAiModelInputSchema = z.object({
  modelId: z.string().trim().min(1),
});

export const UpdateAiConfigurationInputSchema = AiConfigurationSchema;

export type AiConfiguration = z.infer<typeof AiConfigurationSchema>;
export type AiModelOption = z.infer<typeof AiModelOptionSchema>;
export type AiSettings = z.infer<typeof AiSettingsSchema>;
export type SelectAiModelInput = z.infer<typeof SelectAiModelInputSchema>;
export type UpdateAiConfigurationInput = z.infer<typeof UpdateAiConfigurationInputSchema>;
