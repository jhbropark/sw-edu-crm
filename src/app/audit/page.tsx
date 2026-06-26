import { prisma } from "@/lib/prisma";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  "lead.stage_change": "리드 단계 변경",
  "campaign.create": "캠페인 생성",
  "campaign.status_change": "캠페인 상태 변경",
  "settings.update": "설정 변경",
  "payment.tax_issue": "증빙 발행",
};

const PAGE_SIZE = 30;

export default async function AuditPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE + 1 });
  const hasNext = rows.length > PAGE_SIZE;
  const logs = rows.slice(0, PAGE_SIZE);
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">감사 로그</h1>
      <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">시각</th><th className="p-3">작업자</th>
            <th className="p-3">작업</th><th className="p-3">대상</th><th className="p-3">상세</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.length === 0 ? (
            <tr><td colSpan={5} className="p-4 text-center text-gray-500">기록이 없습니다.</td></tr>
          ) : logs.map((l) => (
            <tr key={l.id}>
              <td className="p-3 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("ko-KR")}</td>
              <td className="p-3">{l.actorEmail ?? "-"}</td>
              <td className="p-3">{ACTION_LABEL[l.action] ?? l.action}</td>
              <td className="p-3">{l.entity ?? "-"}{l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}</td>
              <td className="p-3 text-gray-500">{l.meta ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination base="/audit" page={page} hasNext={hasNext} />
    </div>
  );
}
