import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import TaxActions from "@/components/TaxActions";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기", PAID: "완료", FAILED: "실패", REFUNDED: "환불", PARTIAL_REFUND: "부분환불",
};

const PAGE_SIZE = 20;

export default async function PaymentsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const session = await auth();
  const isOwner = (session?.user as any)?.role === "OWNER";
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" }, include: { contact: true },
    skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE + 1,
  });
  const hasNext = payments.length > PAGE_SIZE;
  const pageItems = payments.slice(0, PAGE_SIZE);
  const total = pageItems.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">결제·매출</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>완료 합계: <b>{total.toLocaleString()}원</b></span>
          {isOwner && <a href="/api/export/payments" className="rounded border px-3 py-1.5 text-gray-700 hover:bg-gray-50">CSV 내보내기</a>}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="p-3">고객</th><th className="p-3">금액</th>
            <th className="p-3">상태</th><th className="p-3">수단</th><th className="p-3">결제일</th><th className="p-3">증빙</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {pageItems.map((p) => (
            <tr key={p.id}>
              <td className="p-3">{p.contact.name}</td>
              <td className="p-3">{p.amount.toLocaleString()}원</td>
              <td className="p-3">{STATUS_LABEL[p.status] ?? p.status}</td>
              <td className="p-3">{p.method ?? "-"}</td>
              <td className="p-3">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("ko-KR") : "-"}</td>
              <td className="p-3">
                <TaxActions paymentId={p.id} status={p.status} taxType={p.taxType}
                  taxStatus={p.taxStatus} receiptUrl={p.receiptUrl} isOwner={isOwner} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination base="/payments" page={page} hasNext={hasNext} />
    </div>
  );
}
