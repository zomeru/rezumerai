import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

const mockResumesGet = mock();
const mockResumesPost = mock();
const mockResumesByIdDelete = mock();
const mockResumeById = mock().mockReturnValue({
  delete: mockResumesByIdDelete,
});

mock.module("@/lib/api", () => ({
  api: {
    resumes: Object.assign(mockResumeById, {
      get: mockResumesGet,
      post: mockResumesPost,
    }),
  },
}));

const { useResumeStore } = await import("../useResumeStore");

const MOCK_RESUME = {
  id: "res_1",
  userId: "user_1",
  title: "My Resume",
  public: false,
  professionalSummary: "",
  template: "classic" as const,
  accentColor: "#000000",
  fontSize: "medium" as const,
  customFontSize: 1,
  skills: [] as string[],
  createdAt: new Date(),
  updatedAt: new Date(),
  personalInfo: null,
  experience: [],
  education: [],
  project: [],
};

beforeEach(() => {
  useResumeStore.setState({ resumes: [], isLoading: false, hasFetched: false });
  mockResumesGet.mockReset();
  mockResumesPost.mockReset();
  mockResumesByIdDelete.mockReset();
  mockResumeById.mockReset();
  mockResumeById.mockReturnValue({ delete: mockResumesByIdDelete });
});

describe("useResumeStore.addResume", () => {
  it("appends a resume to the list", () => {
    const { result } = renderHook(() => useResumeStore());

    act(() => {
      result.current.addResume(MOCK_RESUME);
    });

    expect(result.current.resumes).toHaveLength(1);
    expect(result.current.resumes[0]?.id).toBe("res_1");
  });
});

describe("useResumeStore.deleteResume", () => {
  it("removes resume from store when API call succeeds", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesByIdDelete.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.deleteResume("res_1");
    });

    expect(result.current.resumes).toHaveLength(0);
    expect(mockResumeById).toHaveBeenCalledWith({ id: "res_1" });
  });

  it("keeps resume in store when API call fails", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesByIdDelete.mockResolvedValue({
      data: null,
      error: { error: "Not found" },
    });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.deleteResume("res_1");
    });

    expect(result.current.resumes).toHaveLength(1);
  });
});

describe("useResumeStore.fetchResumes", () => {
  it("does not re-fetch when hasFetched is true and force is not set", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesGet.mockResolvedValue({ data: { data: [] }, error: null });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.fetchResumes();
    });

    expect(mockResumesGet).not.toHaveBeenCalled();
  });

  it("re-fetches when force is true even if hasFetched is true", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesGet.mockResolvedValue({ data: { data: [MOCK_RESUME] }, error: null });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.fetchResumes(true);
    });

    expect(mockResumesGet).toHaveBeenCalledTimes(1);
  });
});
