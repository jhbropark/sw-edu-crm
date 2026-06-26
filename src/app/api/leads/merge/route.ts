import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { z } from "zod";

const Input = z.object({ primaryId: z.string().min(1), mergeIds: z.array(z.string().min(1)).min(1) });

// mergeIds 리드들을 primaryId로 병합: 활동 이전, 빈 필드 보완, WON 우선, 메모 합침, 나머지 삭제
export async function POST(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { primaryId, mergeIds } = parsed.data;
  if (mergeIds.includes(primaryId)) return NextResponse.json({ error: "primary는 병합 대상에 포함될 수 없습니다." }, { status: 400 });

  const ids = [primaryId, ...mergeIds];
  const leads = await prisma.lead.findMany({ where: { id: { in: ids } } });
  const primary = leads.find((l) => l.id === primaryId);
  if (!primary || leads.length !== ids.length) return NextResponse.json({ error: "리드를 찾을 수 없습니다." }, { status: 404 });

  const others = leads.filter((l) => l.id !== primaryId);
  const stageRank = ["LOST", "NEW", "CONTACTED", "CONSULTING", "PROPOSAL", "WON"];
  const bestStage = leads.map((l) => l.stage).sort((a, b) => stageRank.indexOf(b) - stageRank.indexOf(a))[0];
  const mergedMemo = [primary.memo, ...others.map((o) => o.memo)].filter(Boolean).join("\n---\n") || null;

  await prisma.$transaction([
    // 활동 이전
    prisma.activity.updateMany({ where: { leadId: { in: mergeIds } }, data: { leadId: primaryId } }),
    // 빈 필드 보완 + 단계/메모 갱신
    prisma.lead.update({
      where: { id: primaryId },
      data: {
        phone: primary.phone ?? others.find((o) => o.phone)?.phone ?? null,
        email: primary.email ?? others.find((o) => o.email)?.email ?? null,
        interest: primary.interest ?? others.find((o) => o.interest)?.interest ?? null,
        source: primary.source ?? others.find((o) => o.source)?.source ?? null,
        stage: bestStage,
        memo: mergedMemo,
      },
    }),
    // 나머지 삭제
    prisma.lead.deleteMany({ where: { id: { in: mergeIds } } }),
  ]);

  await audit("lead.merge", { entity: "lead", entityId: primaryId, meta: { merged: mergeIds } });
  return NextResponse.json({ ok: true, primaryId, merged: mergeIds.length });
}
