"use client";

/**
 * Configuration Panel Component
 * Reusable panel for configuring queue settings
 * Refactored to use shared admin UI components
 */

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFieldLabel, AdminInput, AdminPanel, AdminSelect } from "@/components/Admin/AdminUI";

interface ConfigField {
  key: string;
  label: string;
  description: string;
  type: "number" | "boolean" | "text";
  min?: number;
  max?: number;
  step?: number;
}

interface ConfigurationPanelProps {
  title: string;
  description: string;
  endpoint: string;
  fields: ConfigField[];
  initialValues: Record<string, unknown>;
  onSuccess?: () => void;
}

export function ConfigurationPanel({
  title,
  description,
  endpoint,
  fields,
  initialValues,
  onSuccess,
}: ConfigurationPanelProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      toast.success(`${title} configuration saved`);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to save ${title.toLowerCase()} configuration`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: ConfigField) => {
    const value = values[field.key];

    if (field.type === "boolean") {
      const boolValue = value as boolean;
      return (
        <AdminSelect
          key={field.key}
          label={field.label}
          value={boolValue ? "true" : "false"}
          onChange={(newValue) => handleChange(field.key, newValue === "true")}
          options={[
            { value: "true", label: "Enabled" },
            { value: "false", label: "Disabled" },
          ]}
        />
      );
    }

    if (field.type === "number") {
      return (
        <AdminFieldLabel key={field.key} label={field.label}>
          <AdminInput
            value={String(value as number)}
            onChange={(newValue) => handleChange(field.key, Number(newValue))}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            className="w-full"
          />
          <p className="mt-1 text-muted-foreground text-xs">{field.description}</p>
        </AdminFieldLabel>
      );
    }

    return (
      <AdminFieldLabel key={field.key} label={field.label}>
        <AdminInput
          value={String(value as string)}
          onChange={(newValue) => handleChange(field.key, newValue)}
          className="w-full"
        />
        <p className="mt-1 text-muted-foreground text-xs">{field.description}</p>
      </AdminFieldLabel>
    );
  };

  return (
    <AdminPanel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-xl">{title}</h3>
          <p className="mt-1 text-slate-500 text-sm">{description}</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Save className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save configuration
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">{fields.map(renderField)}</div>
    </AdminPanel>
  );
}
