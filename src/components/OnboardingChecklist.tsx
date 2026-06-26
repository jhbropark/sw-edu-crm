import { prisma } from "@/lib/prisma";
import Link from "next/link";

// 초기 셋업 진행도. 모든 항목 충족 시 렌더 안 함.
export default async function OnboardingChecklist() {
  const [leads, payments, campaigns, settings] = await Promise.all([
    prisma.lead.count(),
    prisma.payment.count(),
    prisma.campaign.count(),
    prisma.appSetting.findUnique({ where: { id: "singleton" } }),
  ]);

  const steps = [
    { done: !!settings?.businessName, label: "상호·발신정보 설정", href: "/settings" },
    { done: leads > 0, label: "첫 리드 추가 또는 공개폼 게시", href: "/leads" },
    { done: payments > 0, label: "첫 결제 링크 발행", href: "/payments" },
    { done: campaigns > 0, label: "첫 캠페인 만들기", href: "/campaigns" },
  ];
  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  const doneCount = steps.length - remaining.length;
  return (
    <section className="mb-6 rounded-lg border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">시작 가이드 ({doneCount}/{steps.length})</h2>
        <Link href="/help" className="text-xs text-blue-600 hover:underline">도움말</Link>
      </div>
      <ul className="space-y-1">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className={s.done ? "text-green-600" : "text-gray-300"}>{s.done ? "✓" : "○"}</span>
            {s.done ? <span className="text-gray-400 line-through">{s.label}</span>
                    : <Link href={s.href} className="text-gray-700 hover:underline">{s.label}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
