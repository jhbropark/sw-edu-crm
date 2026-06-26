import { describe, it, expect } from "vitest";
import {
  parseTrigger, addDays, computeSendAt, isWithinQueueWindow, dedupeKey,
} from "@/lib/campaign-trigger";

describe("parseTrigger", () => {
  it("유효한 트리거를 파싱한다", () => {
    expect(parseTrigger("enrollment.completed+90d")).toEqual({ event: "enrollment.completed", offsetDays: 90 });
    expect(parseTrigger("lead.created+3d")).toEqual({ event: "lead.created", offsetDays: 3 });
  });
  it("잘못된 형식은 null", () => {
    expect(parseTrigger("unknown+1d")).toBeNull();
    expect(parseTrigger("lead.created")).toBeNull();
    expect(parseTrigger("lead.created+xd")).toBeNull();
    expect(parseTrigger("")).toBeNull();
  });
});

describe("computeSendAt", () => {
  it("기준일 + 오프셋 + 스텝지연을 더한다", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    const r = computeSendAt(base, 90, 7); // +97일
    expect(r.toISOString()).toBe(new Date("2026-04-08T00:00:00Z").toISOString());
  });
  it("addDays 음수도 동작", () => {
    const base = new Date("2026-01-10T00:00:00Z");
    expect(addDays(base, -5).toISOString()).toBe(new Date("2026-01-05T00:00:00Z").toISOString());
  });
});

describe("isWithinQueueWindow", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  it("7일 이내면 true", () => {
    expect(isWithinQueueWindow(addDays(now, 3), now)).toBe(true);
    expect(isWithinQueueWindow(addDays(now, 7), now)).toBe(true);
    expect(isWithinQueueWindow(addDays(now, -1), now)).toBe(true); // 이미 지난 것도 발송대상
  });
  it("7일 초과 미래면 false", () => {
    expect(isWithinQueueWindow(addDays(now, 8), now)).toBe(false);
  });
});

describe("dedupeKey", () => {
  it("3요소를 콜론으로 합친다", () => {
    expect(dedupeKey("c1", "s1", "u1")).toBe("c1:s1:u1");
  });
});
