// 보관기간 관련 순수 함수 (DB 비의존)
export function computeCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * 86400000);
}
