import { describe, expect, it } from "bun:test";
import { ExperienceArraySchema } from "../resume/schema";

const baseExp = {
  id: "exp_1",
  resumeId: "resume_1",
  company: "Acme",
  position: "Engineer",
  description: "",
  isCurrent: false,
  startDate: new Date("2022-01-01"),
  endDate: null,
};

describe("ExperienceArraySchema", () => {
  it("rejects non-current entry with null endDate", () => {
    const result = ExperienceArraySchema.safeParse([baseExp]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("endDate");
    }
  });

  it("accepts non-current entry with a valid endDate", () => {
    const result = ExperienceArraySchema.safeParse([{ ...baseExp, endDate: new Date("2023-06-01") }]);
    expect(result.success).toBe(true);
  });

  it("accepts current entry with null endDate", () => {
    const result = ExperienceArraySchema.safeParse([{ ...baseExp, isCurrent: true, endDate: null }]);
    expect(result.success).toBe(true);
  });

  it("returns invalid index in issues path", () => {
    const result = ExperienceArraySchema.safeParse([
      { ...baseExp, isCurrent: true }, // valid
      { ...baseExp, id: "exp_2", endDate: null }, // invalid
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path[0]).toBe(1); // index 1 is invalid
    }
  });
});
