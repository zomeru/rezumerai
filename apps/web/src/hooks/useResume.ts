import { useQuery } from "@tanstack/react-query";
import { DUMMY_RESUME_DATA_ID } from "@/constants/dummy";
import { api } from "@/lib/api";

export function useResumeById(id: string) {
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
    enabled: !!id && id !== DUMMY_RESUME_DATA_ID, // Disable if no ID or if it's the dummy ID
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
