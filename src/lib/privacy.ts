import { prisma } from "@/lib/prisma";
import { getRetentionDays } from "@/lib/settings";
import { computeCutoff } from "@/lib/retention";

// 개인정보 보관기간 만료분 파기.
// 법적 보존 의무(전자상거래법: 계약·결제기록 5년)를 고려해
//  - 결제 이력이 있는 Contact 는 보존(삭제/익명화 제외)
//  - 미전환·종료 Lead(결제로 이어지지 않은 문의)는 보관기간 경과 시 삭제
//  - 마케팅 동의가 만료된, 결제 없는 Contact 는 PII 익명화
export async function purgeExpiredPersonalData(now = new Date()) {
  const retentionDays = await getRetentionDays();
  const cutoff = computeCutoff(now, retentionDays);

  // 1) 미전환/종료 리드 중 보관기간 경과분 삭제 (결제로 이어진 WON 제외)
  const staleLeads = await prisma.lead.findMany({
    where: { stage: { in: ["NEW", "CONTACTED", "CONSULTING", "PROPOSAL", "LOST"] }, createdAt: { lt: cutoff } },
    select: { id: true },
  });
  const leadIds = staleLeads.map((l) => l.id);
  let deletedLeads = 0;
  if (leadIds.length) {
    // Activity FK 때문에 활동 먼저 삭제
    await prisma.activity.deleteMany({ where: { leadId: { in: leadIds } } });
    const res = await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
    deletedLeads = res.count;
  }

  // 2) 결제 이력이 없는 Contact 중, 보관기간 경과분 PII 익명화
  const contacts = await prisma.contact.findMany({
    where: { createdAt: { lt: cutoff }, payments: { none: {} } },
    select: { id: true, name: true },
  });
  let anonymized = 0;
  for (const c of contacts) {
    if (c.name === "(삭제된 사용자)") continue; // 이미 처리됨
    await prisma.contact.update({
      where: { id: c.id },
      data: { name: "(삭제된 사용자)", phone: null, email: null, tags: [], consentAt: null, consentCh: null },
    });
    anonymized++;
  }

  return { cutoff: cutoff.toISOString(), deletedLeads, anonymizedContacts: anonymized };
}
