import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useClientDate, useIsMounted } from "../useClientDate";

describe("useClientDate", () => {
  it("returns null on initial render then a Date after mount", () => {
    const { result } = renderHook(() => useClientDate());
    expect(result.current).toBeInstanceOf(Date);
  });
});

describe("useIsMounted", () => {
  it("returns true after mounting", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current).toBe(true);
  });
});
