import type { ResumeListItem, ResumeWithRelations, ResumeWithRelationsInputUpdate } from "@rezumerai/types";
import { type QueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DUMMY_RESUME_DATA_ID } from "@/constants/dummy";
import type { ResumeCreateInput } from "@/elysia-api/modules/resume/types";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export type CreateResumeInput = ResumeCreateInput;

export function useResumeById(
  id: string,
  options?: Omit<QueryOptions<ResumeWithRelations>, "queryKey" | "queryFn" | "enabled">,
) {
  return useQuery({
    queryKey: queryKeys.resumes.detail(id),
    queryFn: async () => {
      const { data, error } = await api.resumes({ id }).get();

      if (error) {
        const errorMessage =
          typeof error.value === "string"
            ? error.value
            : error.value.message || "An unknown error occurred while fetching the resume.";
        throw new Error(errorMessage);
      }

      return data as ResumeWithRelations;
    },
    enabled: !!id && id !== DUMMY_RESUME_DATA_ID,
    ...options,
  });
}

export function useResumeList(search?: string) {
  return useQuery({
    queryKey: queryKeys.resumes.list(search),
    queryFn: async () => {
      const queryParams = search ? { search } : {};
      const { data, error } = await api.resumes.get({
        query: queryParams,
      });

      if (error) {
        const errorMessage =
          typeof error.value === "string"
            ? error.value
            : error.value.message || "An unknown error occurred while fetching resumes.";
        throw new Error(errorMessage);
      }

      return (data ?? []) as ResumeListItem[];
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
            : ("message" in error.value ? error.value.message : undefined) ||
              "An unknown error occurred while creating the resume.";
        throw new Error(errorMessage);
      }

      if (!data || !("data" in data) || !data.data) {
        throw new Error("Failed to create resume: Invalid response");
      }

      return data.data as ResumeWithRelations;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all() });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ResumeWithRelationsInputUpdate }) => {
      const { data, error } = await api.resumes({ id }).patch(updates as never);

      if (error) {
        const errorMessage =
          typeof error.value === "string" ? error.value : "An unknown error occurred while updating the resume.";
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error("Failed to update resume: Invalid response");
      }

      return data as ResumeWithRelations;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.resumes.detail(variables.id),
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all() });
    },
  });
}
