import { beforeEach, describe, expect, it, mock } from "bun:test";

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
    const { addResume } = useResumeStore.getState();
    addResume(MOCK_RESUME);

    const { resumes } = useResumeStore.getState();
    expect(resumes).toHaveLength(1);
    expect(resumes[0]?.id).toBe("res_1");
  });
});

describe("useResumeStore.deleteResume", () => {
  it("removes resume from store when API call succeeds", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesByIdDelete.mockResolvedValue({ data: { success: true }, error: null });

    await useResumeStore.getState().deleteResume("res_1");

    const { resumes } = useResumeStore.getState();
    expect(resumes).toHaveLength(0);
    expect(mockResumeById).toHaveBeenCalledWith({ id: "res_1" });
  });

  it("keeps resume in store when API call fails", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesByIdDelete.mockResolvedValue({
      data: null,
      error: { error: "Not found" },
    });

    await useResumeStore.getState().deleteResume("res_1");

    const { resumes } = useResumeStore.getState();
    expect(resumes).toHaveLength(1);
  });
});

describe("useResumeStore.fetchResumes", () => {
  it("does not re-fetch when hasFetched is true and force is not set", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesGet.mockResolvedValue({ data: { data: [] }, error: null });

    await useResumeStore.getState().fetchResumes();

    expect(mockResumesGet).not.toHaveBeenCalled();
  });

  it("re-fetches when force is true even if hasFetched is true", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesGet.mockResolvedValue({ data: { data: [MOCK_RESUME] }, error: null });

    await useResumeStore.getState().fetchResumes(true);

    expect(mockResumesGet).toHaveBeenCalledTimes(1);
  });
});
