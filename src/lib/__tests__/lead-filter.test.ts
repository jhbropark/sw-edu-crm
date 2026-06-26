import { describe, it, expect } from "vitest";
import { filterLeads, type FilterableLead } from "@/lib/lead-filter";

const L = (p: Partial<FilterableLead> & { id: string; name: string }): FilterableLead => ({
  phone: null, email: null, source: null, interest: null, stage: "NEW", nextActionAt: null, ...p,
});

const leads: FilterableLead[] = [
  L({ id: "1", name: "김철수", phone: "010-1111-2222", interest: "파이썬", stage: "NEW", source: "blog", createdAt: "2026-06-01" }),
  L({ id: "2", name: "이영희", email: "lee@x.com", stage: "WON", source: "instagram", createdAt: "2026-06-10", nextActionAt: "2026-06-20" }),
  L({ id: "3", name: "박민수", interest: "웹개발", stage: "CONSULTING", source: "blog", createdAt: "2026-06-05", nextActionAt: "2026-06-15" }),
];

describe("filterLeads", () => {
  it("검색어로 이름/관심 매칭", () => {
    expect(filterLeads(leads, { q: "파이썬" }).map((l) => l.id)).toEqual(["1"]);
    expect(filterLeads(leads, { q: "김" }).map((l) => l.id)).toEqual(["1"]);
  });
  it("단계 필터", () => {
    expect(filterLeads(leads, { stage: "WON" }).map((l) => l.id)).toEqual(["2"]);
  });
  it("유입경로 필터", () => {
    expect(filterLeads(leads, { source: "blog" }).map((l) => l.id).sort()).toEqual(["1", "3"]);
  });
  it("이름 정렬(ko)", () => {
    expect(filterLeads(leads, { sort: "name" }).map((l) => l.name)).toEqual(["김철수", "박민수", "이영희"]);
  });
  it("최신순/오래된순", () => {
    expect(filterLeads(leads, { sort: "recent" }).map((l) => l.id)).toEqual(["2", "3", "1"]);
    expect(filterLeads(leads, { sort: "oldest" }).map((l) => l.id)).toEqual(["1", "3", "2"]);
  });
  it("다음연락일순(없으면 뒤로)", () => {
    expect(filterLeads(leads, { sort: "due" }).map((l) => l.id)).toEqual(["3", "2", "1"]);
  });
});
