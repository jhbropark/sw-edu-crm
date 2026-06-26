import { describe, it, expect } from "vitest";
import { computeCutoff } from "@/lib/retention";

describe("computeCutoff", () => {
  it("now에서 retentionDays만큼 과거", () => {
    const now = new Date("2026-06-26T00:00:00Z");
    expect(computeCutoff(now, 365).toISOString()).toBe(new Date("2025-06-26T00:00:00Z").toISOString());
    expect(computeCutoff(now, 0).toISOString()).toBe(now.toISOString());
  });
});
