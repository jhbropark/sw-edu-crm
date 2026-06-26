// 리드 검색/필터/정렬 (순수 함수, 클라이언트에서 사용 + 단위테스트)

export type FilterableLead = {
  id: string; name: string; phone: string | null; email: string | null;
  source: string | null; interest: string | null; stage: string; nextActionAt: string | null;
  createdAt?: string;
};

export type LeadFilter = {
  q?: string;          // 검색어(이름/전화/이메일/관심)
  stage?: string;      // "" = 전체
  source?: string;     // "" = 전체
  sort?: "recent" | "oldest" | "name" | "due";
};

export function filterLeads<T extends FilterableLead>(leads: T[], f: LeadFilter): T[] {
  const q = (f.q ?? "").trim().toLowerCase();
  let out = leads.filter((l) => {
    if (f.stage && l.stage !== f.stage) return false;
    if (f.source && (l.source ?? "") !== f.source) return false;
    if (q) {
      const hay = [l.name, l.phone, l.email, l.interest].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sort = f.sort ?? "recent";
  out = [...out].sort((a, b) => {
    switch (sort) {
      case "name": return a.name.localeCompare(b.name, "ko");
      case "due": {
        const av = a.nextActionAt ? Date.parse(a.nextActionAt) : Infinity;
        const bv = b.nextActionAt ? Date.parse(b.nextActionAt) : Infinity;
        return av - bv;
      }
      case "oldest": return Date.parse(a.createdAt ?? "0") - Date.parse(b.createdAt ?? "0");
      case "recent":
      default: return Date.parse(b.createdAt ?? "0") - Date.parse(a.createdAt ?? "0");
    }
  });
  return out;
}
