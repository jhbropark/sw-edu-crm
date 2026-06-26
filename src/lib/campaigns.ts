import { prisma } from "@/lib/prisma";
import { parseTrigger, computeSendAt, isWithinQueueWindow, dedupeKey, assignVariant } from "@/lib/campaign-trigger";

// 트리거 파싱/시각 계산은 campaign-trigger.ts (단위테스트 대상)

// 활성 캠페인을 평가해, 트리거가 충족된 대상에게 스텝별 예약 메시지를 적재.
// dedupeKey + skipDuplicates 로 중복 적재를 방지하므로 반복 실행해도 안전(idempotent).
export async function enqueueDueCampaigns(now = new Date()) {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "active" },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  let queued = 0;

  for (const c of campaigns) {
    if (!c.trigger || c.steps.length === 0) continue;
    const t = parseTrigger(c.trigger);
    if (!t) continue;

    // 트리거별 대상 + 기준일(baseDate) 수집
    const targets: { contactId: string; baseDate: Date }[] = [];

    if (t.event === "enrollment.completed") {
      const rows = await prisma.enrollment.findMany({
        where: { status: "completed", startAt: { not: null } },
        select: { contactId: true, startAt: true },
      });
      for (const r of rows) targets.push({ contactId: r.contactId, baseDate: r.startAt! });
    } else if (t.event === "lead.created") {
      const rows = await prisma.lead.findMany({
        where: { stage: { in: ["NEW", "CONTACTED"] }, contactId: { not: null } },
        select: { contactId: true, createdAt: true },
      });
      for (const r of rows) targets.push({ contactId: r.contactId!, baseDate: r.createdAt });
    }

    // A/B 분기: 스텝에 지정된 variant 집합(null 제외)
    const variants = Array.from(new Set(c.steps.map((s) => s.variant).filter((v): v is string => !!v)));

    for (const tgt of targets) {
      const assigned = variants.length ? assignVariant(tgt.contactId, variants) : null;
      for (const step of c.steps) {
        // 특정 variant 스텝은 배정된 그룹만 적재(null variant는 공통)
        if (step.variant && step.variant !== assigned) continue;
        // 발송 예정 시각 = baseDate + (트리거 offset + 스텝 지연)
        const sendAt = computeSendAt(tgt.baseDate, t.offsetDays, step.delayDays);
        // 7일 이내로 다가온 것만 큐잉
        if (!isWithinQueueWindow(sendAt, now)) continue;

        const key = dedupeKey(c.id, step.id, tgt.contactId);
        const res = await prisma.scheduledMessage.createMany({
          data: [{
            contactId: tgt.contactId,
            channel: c.channel,
            subject: c.channel === "alimtalk" ? step.template : null, // 알림톡: template=templateId
            body: step.template,
            sendAt,
            status: "queued",
            campaignId: c.id,
            stepId: step.id,
            dedupeKey: key,
          }],
          skipDuplicates: true, // dedupeKey 중복이면 무시
        });
        queued += res.count;
      }
    }
  }
  return { queued };
}
