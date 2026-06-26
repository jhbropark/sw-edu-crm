import { describe, it, expect } from "vitest";
import { normalizePhone, normalizeEmail, findDuplicateGroups } from "@/lib/dedupe";

describe("normalizePhone", () => {
  it("숫자만 남기고 9자리 미만은 null", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
    expect(normalizePhone("010 1234 5678")).toBe("01012345678");
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("소문자/trim, @없으면 null", () => {
    expect(normalizeEmail(" A@B.com ")).toBe("a@b.com");
    expect(normalizeEmail("nope")).toBeNull();
  });
});

describe("findDuplicateGroups", () => {
  it("전화가 같으면 묶는다", () => {
    const g = findDuplicateGroups([
      { id: "1", phone: "010-1111-2222" },
      { id: "2", phone: "01011112222" },
      { id: "3", phone: "010-9999-0000" },
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].sort()).toEqual(["1", "2"]);
  });
  it("이메일 연결로 전이적으로 묶인다", () => {
    const g = findDuplicateGroups([
      { id: "1", phone: "010-1111-2222", email: "a@x.com" },
      { id: "2", phone: "010-1111-2222" },      // 1과 전화 동일
      { id: "3", email: "A@X.com" },             // 1과 이메일 동일
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].sort()).toEqual(["1", "2", "3"]);
  });
  it("중복 없으면 빈 배열", () => {
    expect(findDuplicateGroups([{ id: "1", phone: "010-1" }, { id: "2", email: "b@b.com" }])).toEqual([]);
  });
});
