import { describe, it, expect } from "vitest";
import { hashString, assignVariant } from "@/lib/campaign-trigger";

describe("hashString", () => {
  it("결정적이다", () => {
    expect(hashString("contact-1")).toBe(hashString("contact-1"));
  });
  it("다른 입력은 (대개) 다른 값", () => {
    expect(hashString("a")).not.toBe(hashString("b"));
  });
});

describe("assignVariant", () => {
  it("variant 없으면 null", () => {
    expect(assignVariant("u1", [])).toBeNull();
  });
  it("같은 contactId는 항상 같은 그룹", () => {
    const a = assignVariant("contact-xyz", ["A", "B"]);
    const b = assignVariant("contact-xyz", ["B", "A"]); // 순서 무관
    expect(a).toBe(b);
    expect(["A", "B"]).toContain(a);
  });
  it("대량 배정 시 양쪽 그룹에 분포", () => {
    const counts: Record<string, number> = { A: 0, B: 0 };
    for (let i = 0; i < 1000; i++) {
      const v = assignVariant(`user-${i}`, ["A", "B"])!;
      counts[v]++;
    }
    expect(counts.A).toBeGreaterThan(300);
    expect(counts.B).toBeGreaterThan(300);
  });
});
