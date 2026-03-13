import type { AiModelOption } from "@rezumerai/types";

export interface ModelSelectOption {
  value: string;
  label: string;
}

/**
 * Converts an array of AiModelOption to a format suitable for select dropdowns.
 * The value is the model ID, the label is the display name.
 */
export function toModelSelectOptions(models: AiModelOption[]): ModelSelectOption[] {
  return models.map((model) => ({
    value: model.id,
    label: model.name,
  }));
}
