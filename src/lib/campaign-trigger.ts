// 캠페인 트리거 관련 순수 함수 (DB 비의존 → 단위테스트 용이)

export type TriggerEvent = "enrollment.completed" | "lead.created";
export type ParsedTrigger = { event: TriggerEvent; offsetDays: number };

export function parseTrigger(trigger: string): ParsedTrigger | null {
  const m = trigger.match(/^(enrollment\.completed|lead\.created)\+(\d+)d$/);
  if (!m) return null;
  return { event: m[1] as TriggerEvent, offsetDays: Number(m[2]) };
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

// 발송 예정 시각 = 기준일 + (트리거 오프셋 + 스텝 지연)
export function computeSendAt(baseDate: Date, offsetDays: number, stepDelayDays: number): Date {
  return addDays(baseDate, offsetDays + stepDelayDays);
}

// 큐잉 윈도우: 도래가 windowDays 이내일 때만 적재
export function isWithinQueueWindow(sendAt: Date, now: Date, windowDays = 7): boolean {
  return sendAt.getTime() - now.getTime() <= windowDays * 86400000;
}

export function dedupeKey(campaignId: string, stepId: string, contactId: string): string {
  return `${campaignId}:${stepId}:${contactId}`;
}

// 결정적 해시(문자열 → 32bit 정수). 같은 입력 → 항상 같은 결과.
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

// A/B 등 variant 배정. contactId 기준 결정적(같은 사람은 늘 같은 그룹).
export function assignVariant(contactId: string, variants: string[]): string | null {
  if (variants.length === 0) return null;
  const sorted = [...variants].sort(); // 입력 순서에 무관하게 안정적
  return sorted[hashString(contactId) % sorted.length];
}
