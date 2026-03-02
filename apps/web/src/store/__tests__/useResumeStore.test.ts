import { beforeEach, describe, expect, it } from "bun:test";

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
});

describe("useResumeStore.setResumes", () => {
  it("sets the resume list and marks hasFetched as true", () => {
    const { setResumes } = useResumeStore.getState();
    setResumes([MOCK_RESUME]);

    const { resumes, hasFetched } = useResumeStore.getState();
    expect(resumes).toHaveLength(1);
    expect(resumes[0]?.id).toBe("res_1");
    expect(hasFetched).toBe(true);
  });
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

describe("useResumeStore.updateResume", () => {
  it("updates a resume in the list", () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME] });

    const { updateResume } = useResumeStore.getState();
    updateResume("res_1", { title: "Updated Resume" });

    const { resumes } = useResumeStore.getState();
    expect(resumes).toHaveLength(1);
    expect(resumes[0]?.title).toBe("Updated Resume");
  });

  it("does not modify list if id not found", () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME] });

    const { updateResume } = useResumeStore.getState();
    updateResume("non_existent", { title: "Updated Resume" });

    const { resumes } = useResumeStore.getState();
    expect(resumes).toHaveLength(1);
    expect(resumes[0]?.title).toBe("My Resume");
  });
});

describe("useResumeStore.clearResumes", () => {
  it("clears the resume list and resets hasFetched", () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });

    const { clearResumes } = useResumeStore.getState();
    clearResumes();

    const { resumes, hasFetched } = useResumeStore.getState();
    expect(resumes).toHaveLength(0);
    expect(hasFetched).toBe(false);
  });
});
