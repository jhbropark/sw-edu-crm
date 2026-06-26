import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import LeadActivity from "@/components/LeadActivity";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  NEW: "신규 문의", CONTACTED: "1차 연락", CONSULTING: "상담중",
  PROPOSAL: "제안/견적", WON: "결제 전환", LOST: "종료",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) notFound();

  const info: [string, string][] = [
    ["단계", STAGE_LABEL[lead.stage] ?? lead.stage],
    ["연락처", lead.phone ?? "-"],
    ["이메일", lead.email ?? "-"],
    ["유입경로", lead.source ?? "-"],
    ["관심 강의", lead.interest ?? "-"],
    ["등록일", new Date(lead.createdAt).toLocaleDateString("ko-KR")],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/leads" className="text-sm text-gray-500 hover:underline">← 파이프라인으로</Link>
      <h1 className="mb-4 mt-2 text-xl font-bold">{lead.name}</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-lg border bg-white p-4 text-sm md:grid-cols-3">
        {info.map(([k, v]) => (
          <div key={k}><div className="text-xs text-gray-400">{k}</div><div>{v}</div></div>
        ))}
        {lead.memo && (
          <div className="col-span-full"><div className="text-xs text-gray-400">메모</div><div>{lead.memo}</div></div>
        )}
      </div>

      <LeadActivity
        leadId={lead.id}
        nextActionAt={lead.nextActionAt ? lead.nextActionAt.toISOString() : null}
        initialActivities={lead.activities.map((a) => ({
          id: a.id, type: a.type, content: a.content, createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
