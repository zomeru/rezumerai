import type { ResumeWithRelations } from "@rezumerai/types";
import { type QueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DUMMY_RESUME_DATA_ID } from "@/constants/dummy";
import { api } from "@/lib/api";

export type CreateResumeInput = Parameters<typeof api.resumes.post>[0];

export function useResumeById(
  id: string,
  options?: Omit<QueryOptions<ResumeWithRelations>, "queryKey" | "queryFn" | "enabled">,
) {
  return useQuery({
    queryKey: ["resumesById", id],
    queryFn: async () => {
      const { data, error } = await api.resumes({ id }).get();

      if (error) {
        const errorMessage =
          typeof error.value === "string"
            ? error.value
            : error.value.message || "An unknown error occurred while fetching the resume.";
        throw new Error(errorMessage);
      }

      return data;
    },
    enabled: !!id && id !== DUMMY_RESUME_DATA_ID,
    ...options,
  });
}

export function useResumeList() {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data, error } = await api.resumes.get();

      if (error) {
        const errorMessage =
          typeof error.value === "string"
            ? error.value
            : error.value.message || "An unknown error occurred while fetching resumes.";
        throw new Error(errorMessage);
      }

      return data;
    },
  });
}

export function useCreateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateResumeInput) => {
      const { data, error } = await api.resumes.post(input);

      if (error) {
        const errorMessage =
          typeof error.value === "string"
            ? error.value
            : error.value.message || "An unknown error occurred while creating the resume.";
        throw new Error(errorMessage);
      }

      if (!data || !("data" in data) || !data.data) {
        throw new Error("Failed to create resume: Invalid response");
      }

      return data.data as ResumeWithRelations;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: unknown }) => {
      const { data, error } = await api.resumes({ id }).patch(updates);

      if (error) {
        const errorMessage =
          typeof error.value === "string"
            ? error.value
            : error.value.message || "An unknown error occurred while updating the resume.";
        throw new Error(errorMessage);
      }

      return data as ResumeWithRelations;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["resumesById", variables.id],
      });
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.resumes({ id }).delete();

      if (error) {
        const errorMessage =
          typeof error.value === "string"
            ? error.value
            : error.value.message || "An unknown error occurred while deleting the resume.";
        throw new Error(errorMessage);
      }

      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}
