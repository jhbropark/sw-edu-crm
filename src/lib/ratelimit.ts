// 인메모리 슬라이딩 윈도우. 서버리스 인스턴스마다 별도 카운트이므로 1차 방어용.
// 운영 환경에서는 Upstash Ratelimit 등 분산 저장소 사용 권장.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { hits.set(key, arr); return false; }
  arr.push(now); hits.set(key, arr);
  return true;
}
