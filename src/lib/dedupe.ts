// 리드 중복 탐지 순수 로직 (DB 비의존)

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits : null;
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  return e.includes("@") ? e : null;
}

export type DedupeInput = { id: string; phone?: string | null; email?: string | null };

// 전화/이메일 중 하나라도 같으면 같은 그룹으로 묶는다(Union-Find).
export function findDuplicateGroups(leads: DedupeInput[]): string[][] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  };
  const union = (a: string, b: string) => { parent.set(find(a), find(b)); };

  for (const l of leads) parent.set(l.id, l.id);

  const byKey = new Map<string, string>(); // 정규화 키 → 대표 lead id
  for (const l of leads) {
    for (const key of [
      l.phone ? `p:${normalizePhone(l.phone)}` : null,
      l.email ? `e:${normalizeEmail(l.email)}` : null,
    ]) {
      if (!key || key.endsWith(":null")) continue;
      const seen = byKey.get(key);
      if (seen) union(seen, l.id); else byKey.set(key, l.id);
    }
  }

  const groups = new Map<string, string[]>();
  for (const l of leads) {
    const root = find(l.id);
    groups.set(root, [...(groups.get(root) ?? []), l.id]);
  }
  return Array.from(groups.values()).filter((g) => g.length > 1);
}
