import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("BOM으로 시작하고 헤더+행을 CRLF로 연결", () => {
    const csv = toCsv(["a", "b"], [[1, 2]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("a,b\r\n1,2");
  });
  it("콤마/따옴표/줄바꿈을 이스케이프", () => {
    const csv = toCsv(["name"], [['김,철수'], ['따옴표"있음'], ['줄\n바꿈']]);
    expect(csv).toContain('"김,철수"');
    expect(csv).toContain('"따옴표""있음"');
    expect(csv).toContain('"줄\n바꿈"');
  });
  it("null/undefined는 빈 문자열", () => {
    const csv = toCsv(["x", "y"], [[null, undefined]]);
    expect(csv.endsWith(",")).toBe(true);
  });
});
